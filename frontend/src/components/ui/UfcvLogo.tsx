import { cn } from "../../lib/cn";

type UfcvLogoProps = {
  className?: string;
  imageClassName?: string;
  alt?: string;
};

export function UfcvLogo({
  className,
  imageClassName,
  alt = "Logo UFCV"
}: UfcvLogoProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-black/8",
        className
      )}
    >
      <img
        src="/brand/ufcv-logo.png"
        alt={alt}
        className={cn("h-full w-full object-contain", imageClassName)}
      />
    </div>
  );
}
