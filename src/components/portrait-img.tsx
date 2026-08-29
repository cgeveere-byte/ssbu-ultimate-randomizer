import type { CSSProperties } from "react";
import { usePortraitFocusY } from "@/lib/portrait-focus";
import { cn } from "@/lib/cn";

/** Portrait that pins `--focal` (0–1 from the top of the art) to the vertical center of wide tiles. Square tiles show the full image. */
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
  return (
    <span className="portrait-focal" style={{ "--focal": y / 100 } as CSSProperties}>
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={cn("portrait-focal-img", imgClassName)}
      />
    </span>
  );
}
