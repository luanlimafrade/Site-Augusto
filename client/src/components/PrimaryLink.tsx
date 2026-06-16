import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

type PrimaryLinkProps = {
  to: string;
  children: React.ReactNode;
  icon?: LucideIcon;
  variant?: "solid" | "soft";
};

export function PrimaryLink({
  to,
  children,
  icon: Icon,
  variant = "solid"
}: PrimaryLinkProps) {
  return (
    <Link
      to={to}
      className={[
        "focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition",
        variant === "solid"
          ? "bg-moss text-ivory shadow-soft hover:bg-ink"
          : "border border-moss/18 bg-white/70 text-moss hover:bg-white"
      ].join(" ")}
    >
      {Icon ? <Icon size={18} /> : null}
      {children}
    </Link>
  );
}
