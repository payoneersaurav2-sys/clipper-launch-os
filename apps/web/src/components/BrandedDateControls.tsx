import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const pad = (value: number) => String(value).padStart(2, "0");

function dateFromValue(value?: string) {
  if (!value) return undefined;
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day) : undefined;
}

function dateValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dateLabel(value?: string) {
  const date = dateFromValue(value);
  return date
    ? new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date)
    : "Select date";
}

function CalendarPopover({
  value,
  onChange,
  onClose,
}: {
  value?: string;
  onChange: (value: string) => void;
  onClose: () => void;
}) {
  const selected = dateFromValue(value);
  const [month, setMonth] = useState(() => selected ?? new Date());
  const days = useMemo(() => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const count = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    ).getDate();
    return Array.from({ length: start.getDay() + count }, (_, index) =>
      index < start.getDay()
        ? undefined
        : new Date(
            month.getFullYear(),
            month.getMonth(),
            index - start.getDay() + 1,
          ),
    );
  }, [month]);
  const previousMonth = () =>
    setMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
    );
  const nextMonth = () =>
    setMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
    );
  const today = new Date();
  return (
    <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[292px] rounded-[16px] border border-white/[0.1] bg-[#161616] p-3 shadow-2xl shadow-black/50">
      <div className="mb-3 flex items-center justify-between px-1">
        <button
          type="button"
          onClick={previousMonth}
          className="rounded-[8px] p-1.5 text-[#A1A1AA] hover:bg-white/[0.06] hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-[13px] font-semibold text-[#FAFAFA]">
          {MONTHS[month.getMonth()]} {month.getFullYear()}
        </p>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded-[8px] p-1.5 text-[#A1A1AA] hover:bg-white/[0.06] hover:text-white"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {DAYS.map((day) => (
          <span
            key={day}
            className="py-1 text-[10px] font-medium text-[#71717A]"
          >
            {day}
          </span>
        ))}
        {days.map((date, index) =>
          !date ? (
            <span key={`empty-${index}`} />
          ) : (
            <button
              type="button"
              key={dateValue(date)}
              onClick={() => {
                onChange(dateValue(date));
                onClose();
              }}
              className={`h-8 rounded-[8px] text-[11px] transition-colors ${dateValue(date) === value ? "bg-primary font-semibold text-white" : dateValue(date) === dateValue(today) ? "bg-primary/15 text-primary" : "text-[#D4D4D8] hover:bg-white/[0.08]"}`}
            >
              {date.getDate()}
            </button>
          ),
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          onChange(dateValue(today));
          onClose();
        }}
        className="mt-3 w-full rounded-[8px] border border-white/[0.08] py-2 text-[11px] font-medium text-[#A1A1AA] hover:border-primary/50 hover:text-primary"
      >
        Today
      </button>
    </div>
  );
}

function DateTrigger({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-full items-center gap-2 rounded-[10px] border border-white/[0.08] bg-[#0D0D0D] px-3 text-left text-[12px] text-[#FAFAFA] transition-colors hover:border-primary/40 focus:border-primary/60"
      >
        <CalendarDays className="h-3.5 w-3.5 text-primary" />
        <span className={value ? "" : "text-[#71717A]"}>
          {dateLabel(value)}
        </span>
      </button>
      {open && (
        <CalendarPopover
          value={value}
          onChange={onChange}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

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
      <DateTrigger value={value} onChange={onChange} />
    </label>
  );
}

function TimePopover({
  value,
  onChange,
  onClose,
}: {
  value?: string;
  onChange: (value: string) => void;
  onClose: () => void;
}) {
  const [hour, minute] = (value || "09:00").split(":").map(Number);
  const [period, setPeriod] = useState(hour >= 12 ? "PM" : "AM");
  const [selectedHour, setSelectedHour] = useState(hour % 12 || 12);
  const [selectedMinute, setSelectedMinute] = useState(minute);
  const emit = (nextHour: number, nextMinute: number, nextPeriod: string) => {
    const hours24 = (nextHour % 12) + (nextPeriod === "PM" ? 12 : 0);
    onChange(`${pad(hours24)}:${pad(nextMinute)}`);
  };
  return (
    <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[292px] rounded-[16px] border border-white/[0.1] bg-[#161616] p-3 shadow-2xl shadow-black/50">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] font-semibold text-[#FAFAFA]">Choose time</p>
        <div className="flex rounded-[8px] border border-white/[0.08] p-0.5">
          {["AM", "PM"].map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => {
                setPeriod(item);
                emit(selectedHour, selectedMinute, item);
              }}
              className={`rounded-[6px] px-2 py-1 text-[10px] font-semibold ${period === item ? "bg-primary text-white" : "text-[#71717A]"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[#71717A]">
            Hour
          </p>
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 12 }, (_, index) => index + 1).map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => {
                  setSelectedHour(item);
                  emit(item, selectedMinute, period);
                }}
                className={`rounded-[7px] py-1.5 text-[11px] ${selectedHour === item ? "bg-primary text-white" : "bg-white/[0.04] text-[#D4D4D8] hover:bg-white/[0.1]"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[#71717A]">
            Minute
          </p>
          <div className="grid grid-cols-3 gap-1">
            {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => {
                  setSelectedMinute(item);
                  emit(selectedHour, item, period);
                }}
                className={`rounded-[7px] py-1.5 text-[11px] ${selectedMinute === item ? "bg-primary text-white" : "bg-white/[0.04] text-[#D4D4D8] hover:bg-white/[0.1]"}`}
              >
                {pad(item)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-3 w-full rounded-[8px] border border-white/[0.08] py-2 text-[11px] font-medium text-[#A1A1AA] hover:border-primary/50 hover:text-primary"
      >
        Done
      </button>
    </div>
  );
}

function timeLabel(value?: string) {
  if (!value) return "Select time";
  const [hour, minute] = value.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${pad(minute)} ${period}`;
}

export function BrandedDateTimePicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value?: string) => void;
}) {
  const date = dateFromValue(value) ? value?.slice(0, 10) : undefined;
  const time = value
    ? `${pad(new Date(value).getHours())}:${pad(new Date(value).getMinutes())}`
    : undefined;
  const [timeOpen, setTimeOpen] = useState(false);
  const update = (nextDate = date, nextTime = time) =>
    onChange(
      nextDate && nextTime
        ? new Date(`${nextDate}T${nextTime}`).toISOString()
        : undefined,
    );
  return (
    <div className="rounded-[12px] border border-white/[0.08] bg-[#0D0D0D] p-2">
      <div className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-medium text-[#A1A1AA]">
        <CalendarDays className="h-3.5 w-3.5 text-primary" />
        Publishing schedule
      </div>
      <div className="grid grid-cols-2 gap-2">
        <DateTrigger
          value={date}
          onChange={(nextDate) => update(nextDate, time)}
        />
        <div className="relative">
          <button
            type="button"
            onClick={() => setTimeOpen(!timeOpen)}
            className="flex h-10 w-full items-center gap-2 rounded-[10px] border border-white/[0.08] bg-[#161616] px-3 text-left text-[12px] text-[#FAFAFA] hover:border-primary/40"
          >
            <Clock3 className="h-3.5 w-3.5 text-primary" />
            <span className={time ? "" : "text-[#71717A]"}>
              {timeLabel(time)}
            </span>
          </button>
          {timeOpen && (
            <TimePopover
              value={time}
              onChange={(nextTime) => update(date, nextTime)}
              onClose={() => setTimeOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
