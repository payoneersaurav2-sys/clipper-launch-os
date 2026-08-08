import { useEffect, useState } from "react";
import { CalendarDays, Clock3 } from "lucide-react";

const fieldClass =
  "h-10 w-full rounded-[10px] border border-white/[0.08] bg-[#0D0D0D] px-3 text-[13px] text-[#FAFAFA] outline-none transition-colors focus:border-primary/60 [color-scheme:dark]";

export function BrandedDateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12px] text-[#71717A]">{label}</span>
      <span className="relative block">
        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary" />
        <input
          type="date"
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          className={`${fieldClass} pl-9`}
        />
      </span>
    </label>
  );
}

function toParts(value?: string) {
  if (!value) return { date: "", time: "" };
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return { date: "", time: "" };
  const pad = (part: number) => String(part).padStart(2, "0");
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

export function BrandedDateTimePicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value?: string) => void;
}) {
  const [parts, setParts] = useState(() => toParts(value));
  useEffect(() => setParts(toParts(value)), [value]);
  const update = (patch: Partial<typeof parts>) => {
    const next = { ...parts, ...patch };
    setParts(next);
    onChange(
      next.date && next.time
        ? new Date(`${next.date}T${next.time}`).toISOString()
        : undefined,
    );
  };
  return (
    <div className="rounded-[12px] border border-white/[0.08] bg-[#0D0D0D] p-2">
      <div className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-medium text-[#A1A1AA]">
        <CalendarDays className="h-3.5 w-3.5 text-primary" />
        Publishing schedule
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label>
          <span className="sr-only">Date</span>
          <input
            type="date"
            value={parts.date}
            onChange={(event) => update({ date: event.target.value })}
            className={fieldClass}
          />
        </label>
        <label className="relative">
          <span className="sr-only">Time</span>
          <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary" />
          <input
            type="time"
            value={parts.time}
            onChange={(event) => update({ time: event.target.value })}
            className={`${fieldClass} pl-9`}
          />
        </label>
      </div>
    </div>
  );
}
