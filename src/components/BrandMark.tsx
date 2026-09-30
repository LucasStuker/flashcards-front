import Image from "next/image";
import Link from "next/link";

type Props = {
  size?: "sm" | "md" | "lg" | "hero";
  href?: string | null;
  stacked?: boolean;
};

const sizes = {
  sm: { img: 40, text: "text-lg", gap: "gap-2" },
  md: { img: 52, text: "text-xl", gap: "gap-2.5" },
  lg: { img: 80, text: "text-3xl", gap: "gap-3" },
  hero: { img: 120, text: "text-4xl", gap: "gap-3" },
};

export function BrandMark({ size = "md", href = "/", stacked = false }: Props) {
  const { img, text, gap } = sizes[size];
  const mark = (
    <span
      className={`inline-flex items-center ${gap} ${stacked ? "flex-col" : ""}`}
    >
      <Image
        src="/logo.png"
        alt=""
        width={img * 2}
        height={img}
        className="h-auto w-auto shrink-0"
        style={{ height: img, width: "auto" }}
        priority
      />
      <span
        className={`${text} leading-none tracking-tight text-ink`}
        style={{ fontFamily: "var(--font-display), sans-serif" }}
      >
        Yorkstudy
      </span>
    </span>
  );

  if (!href) return mark;

  return (
    <Link href={href} className="inline-flex shrink-0 items-center outline-offset-4">
      {mark}
    </Link>
  );
}
