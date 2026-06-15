import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

type DateRangePickerProps = {
  checkIn: string;
  checkOut: string;
  onChange: (range: { checkIn: string; checkOut: string }) => void;
  onDone?: () => void;
  className?: string;
};

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function parseDate(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function isSameDate(a: Date | null, b: Date | null) {
  return Boolean(a && b && toISODate(a) === toISODate(b));
}

function isBeforeDate(a: Date, b: Date) {
  return toISODate(a) < toISODate(b);
}

function isBetweenDate(date: Date, start: Date | null, end: Date | null) {
  if (!start || !end) return false;
  const value = toISODate(date);
  return value > toISODate(start) && value < toISODate(end);
}

function getMonthDays(month: Date) {
  const days = [];
  const firstDay = startOfMonth(month);
  const offset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  for (let i = 0; i < offset; i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(new Date(month.getFullYear(), month.getMonth(), day));
  }

  return days;
}

export function formatShortDate(value: string) {
  const date = parseDate(value);
  if (!date) return 'Add date';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

export function formatDateRangeLabel(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 'Select dates';
  return `${formatShortDate(checkIn)} - ${formatShortDate(checkOut)}`;
}

export default function DateRangePicker({ checkIn, checkOut, onChange, onDone, className = '' }: DateRangePickerProps) {
  const selectedStart = parseDate(checkIn);
  const selectedEnd = parseDate(checkOut);
  const today = useMemo(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }, []);
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(selectedStart || today));
  const monthDays = useMemo(() => getMonthDays(visibleMonth), [visibleMonth]);

  function selectDate(date: Date) {
    const value = toISODate(date);

    if (!selectedStart || selectedEnd || isBeforeDate(date, selectedStart) || isSameDate(date, selectedStart)) {
      onChange({ checkIn: value, checkOut: '' });
      return;
    }

    onChange({ checkIn, checkOut: value });
  }

  return (
    <div className={`rounded-xl border border-outline-variant/30 bg-surface p-5 shadow-2xl ${className}`}>
      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setVisibleMonth((month) => addMonths(month, -1))}
          className="h-10 w-10 rounded-full hover:bg-surface-container flex items-center justify-center text-primary"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="font-body text-body-lg font-semibold text-primary">
          {new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(visibleMonth)}
        </div>
        <button
          type="button"
          onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
          className="h-10 w-10 rounded-full hover:bg-surface-container flex items-center justify-center text-primary"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdays.map((weekday) => (
          <div key={weekday} className="py-2 font-body text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant">
            {weekday}
          </div>
        ))}
        {monthDays.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} className="h-11" />;

          const disabled = isBeforeDate(date, today);
          const selected = isSameDate(date, selectedStart) || isSameDate(date, selectedEnd);
          const inRange = isBetweenDate(date, selectedStart, selectedEnd);

          return (
            <button
              key={toISODate(date)}
              type="button"
              disabled={disabled}
              onClick={() => selectDate(date)}
              className={`h-11 rounded-full font-body text-body-md transition-colors ${
                selected
                  ? 'bg-primary text-on-primary'
                  : inRange
                    ? 'bg-primary/10 text-primary'
                    : disabled
                      ? 'cursor-not-allowed text-on-surface-variant/30'
                      : 'text-on-surface hover:bg-surface-container'
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-outline-variant/30 pt-4">
        <div className="font-body text-sm text-on-surface-variant">
          {checkIn ? formatShortDate(checkIn) : 'Check-in'} / {checkOut ? formatShortDate(checkOut) : 'Check-out'}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChange({ checkIn: '', checkOut: '' })}
            className="font-body text-label-caps uppercase tracking-widest text-on-surface-variant hover:text-primary"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onDone}
            className="rounded bg-primary px-4 py-2 font-body text-label-caps uppercase tracking-widest text-on-primary"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
