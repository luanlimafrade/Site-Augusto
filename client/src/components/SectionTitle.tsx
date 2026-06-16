type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
  center?: boolean;
};

export function SectionTitle({
  eyebrow,
  title,
  children,
  center = false
}: SectionTitleProps) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-plum">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-3 font-display text-5xl font-semibold leading-tight text-moss md:text-6xl">
        {title}
      </h1>
      {children ? (
        <div className="mt-5 text-base leading-8 text-ink/70 md:text-lg">
          {children}
        </div>
      ) : null}
    </div>
  );
}
