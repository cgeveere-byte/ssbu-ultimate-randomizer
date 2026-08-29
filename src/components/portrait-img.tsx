import { useLayoutEffect, useRef, useState } from "react";
import { usePortraitFocusY } from "@/lib/portrait-focus";
import { cn } from "@/lib/cn";

/**
 * Pins `y%` from the top of the art to the vertical center of wide tiles.
 * Uses object-fit (no extra transform) so Face-Off’s rotate(180) P2 pane doesn’t shred crops.
 * Square / tall tiles show the full image.
 */
export function PortraitFocal({
  fighterId,
  src,
  alt = "",
  imgClassName,
}: {
  fighterId: string;
  src: string;
  alt?: string;
  imgClassName?: string;
}) {
  const y = usePortraitFocusY(fighterId);
  const ref = useRef<HTMLSpanElement>(null);
  const [objectPosition, setObjectPosition] = useState("50% 50%");

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (h <= 0 || w / h < 1.05) {
        setObjectPosition("50% 50%");
        return;
      }
      const f = y / 100;
      const p = (0.5 * h - f * w) / (h - w);
      setObjectPosition(`50% ${Math.max(0, Math.min(100, p * 100))}%`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [y]);

  return (
    <span ref={ref} className="portrait-focal">
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={cn("portrait-focal-img", imgClassName)}
        style={{ objectPosition }}
      />
    </span>
  );
}
