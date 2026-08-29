import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { usePortraitFocusY } from "@/lib/portrait-focus";
import { cn } from "@/lib/cn";

/**
 * Pins `y%` from the top of the art to the vertical center of wide tiles.
 * Square / tall tiles show the full image (no vertical crop).
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
  const [wide, setWide] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () => {
      const { width, height } = el.getBoundingClientRect();
      setWide(height > 0 && width / height >= 1.05);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const imgStyle: CSSProperties | undefined = wide
    ? {
        position: "absolute",
        left: 0,
        top: "50%",
        width: "100%",
        height: "auto",
        maxWidth: "none",
        transform: `translateY(-${y}%)`,
      }
    : undefined;

  return (
    <span ref={ref} className="portrait-focal">
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={cn("portrait-focal-img", imgClassName)}
        style={imgStyle}
      />
    </span>
  );
}
