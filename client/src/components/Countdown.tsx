import { siteConfig } from "../data/siteConfig";
import { useCountdown } from "../hooks/useCountdown";

export function Countdown() {
  const countdown = useCountdown(siteConfig.weddingDateTime);
  const items = [
    ["Dias", countdown.days],
    ["Horas", countdown.hours],
    ["Min", countdown.minutes],
    ["Seg", countdown.seconds]
  ];

  return (
    <div className="grid grid-cols-4 overflow-hidden rounded-2xl border border-white/45 bg-ink/28 shadow-soft backdrop-blur-md">
      {items.map(([label, value]) => (
        <div
          key={label}
          className="border-r border-white/20 px-3 py-4 text-center last:border-r-0"
        >
          <p className="font-display text-3xl font-semibold text-white md:text-4xl">
            {String(value).padStart(2, "0")}
          </p>
          <p className="mt-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white/78">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}
