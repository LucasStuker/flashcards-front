import Image from "next/image";
import Link from "next/link";

type Props = {
  size?: "sm" | "md" | "lg";
  href?: string | null;
};

const sizes = {
  sm: { img: 36, text: "text-lg" },
  md: { img: 44, text: "text-xl" },
  lg: { img: 72, text: "text-4xl" },
};

export function BrandMark({ size = "md", href = "/" }: Props) {
  const { img, text } = sizes[size];
  const mark = (
    <span className="inline-flex items-center gap-3">
      <Image
        src="/logo.png"
        alt=""
        width={img}
        height={img}
        className="h-auto w-auto"
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
    <Link href={href} className="inline-flex items-center outline-offset-4">
      {mark}
    </Link>
  );
}
