import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

type DateRangePickerProps = {
  checkIn: string;
  checkOut: string;
  onChange: (range: { checkIn: string; checkOut: string }) => void;
  onDone?: () => void;
  className?: string;
};

const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

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
  const days: (Date | null)[] = [];
  const firstDay = startOfMonth(month);
  const offset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  for (let i = 0; i < offset; i++) days.push(null);
  for (let day = 1; day <= daysInMonth; day++) days.push(new Date(month.getFullYear(), month.getMonth(), day));
  return days;
}

export function formatShortDate(value: string) {
  const date = parseDate(value);
  if (!date) return 'Add date';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(date);
}

export function formatDateRangeLabel(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 'Select dates';
  return `${formatShortDate(checkIn)} – ${formatShortDate(checkOut)}`;
}

function MonthGrid({
  month,
  selectedStart,
  selectedEnd,
  today,
  hovered,
  onSelect,
  onHover,
}: {
  month: Date;
  selectedStart: Date | null;
  selectedEnd: Date | null;
  today: Date;
  hovered: Date | null;
  onSelect: (date: Date) => void;
  onHover: (date: Date | null) => void;
}) {
  const days = useMemo(() => getMonthDays(month), [month]);
  const rangeEnd = selectedEnd || hovered;

  return (
    <div className="flex-1 min-w-0">
      <div className="text-center font-body font-semibold text-primary mb-4 text-sm tracking-wide">
        {new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(month)}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {weekdays.map((d) => (
          <div key={d} className="text-center font-body text-[10px] text-on-surface-variant/60 tracking-widest uppercase py-1">{d}</div>
        ))}
        {days.map((date, i) => {
          if (!date) return <div key={`e-${i}`} />;
          const disabled = isBeforeDate(date, today);
          const isStart = isSameDate(date, selectedStart);
          const isEnd = isSameDate(date, selectedEnd);
          const inRange = isBetweenDate(date, selectedStart, rangeEnd);
          const isStartOfRange = isStart && rangeEnd && !isSameDate(date, rangeEnd);
          const isEndOfRange = isEnd || (isSameDate(date, hovered) && selectedStart && !selectedEnd);

          return (
            <div
              key={toISODate(date)}
              className={`relative flex items-center justify-center ${
                inRange ? 'bg-primary/8' : ''
              } ${isStartOfRange ? 'rounded-l-full' : ''} ${isEndOfRange && !isStart ? 'rounded-r-full' : ''}`}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(date)}
                onMouseEnter={() => onHover(date)}
                onMouseLeave={() => onHover(null)}
                className={`w-9 h-9 rounded-full font-body text-sm transition-colors relative z-10 ${
                  isStart || isEnd
                    ? 'bg-primary text-white font-semibold'
                    : disabled
                      ? 'text-on-surface-variant/25 cursor-not-allowed'
                      : 'text-primary hover:bg-surface-container-high'
                }`}
              >
                {date.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DateRangePicker({ checkIn, checkOut, onChange, onDone, className = '' }: DateRangePickerProps) {
  const selectedStart = parseDate(checkIn);
  const selectedEnd = parseDate(checkOut);
  const today = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);
  const [leftMonth, setLeftMonth] = useState(startOfMonth(selectedStart || today));
  const [hovered, setHovered] = useState<Date | null>(null);
  const rightMonth = addMonths(leftMonth, 1);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onDone?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onDone]);

  function selectDate(date: Date) {
    const value = toISODate(date);
    if (!selectedStart || selectedEnd || isBeforeDate(date, selectedStart) || isSameDate(date, selectedStart)) {
      onChange({ checkIn: value, checkOut: '' });
    } else {
      onChange({ checkIn, checkOut: value });
      onDone?.();
    }
  }

  const nights = selectedStart && selectedEnd
    ? Math.round((selectedEnd.getTime() - selectedStart.getTime()) / 86400000)
    : null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[400] bg-black/20 backdrop-blur-[2px]" onClick={onDone} />

      {/* Modal */}
      <div className={`fixed z-[401] rounded-2xl shadow-2xl ${className}`}
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'min(92vw, 720px)', background: '#ffffff' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-outline-variant/20">
          <div className="flex gap-4 flex-1">
            <div className={`flex-1 border rounded-xl px-4 py-2.5 cursor-pointer transition-colors ${!checkOut ? 'border-primary ring-1 ring-primary' : 'border-outline-variant/40 hover:border-outline-variant'}`}>
              <div className="font-body text-[10px] uppercase tracking-widest text-on-surface-variant mb-0.5">Check-in</div>
              <div className="font-body text-sm font-medium text-primary">{checkIn ? formatShortDate(checkIn) : 'Add date'}</div>
            </div>
            <div className={`flex-1 border rounded-xl px-4 py-2.5 cursor-pointer transition-colors ${checkIn && !checkOut ? 'border-primary ring-1 ring-primary' : 'border-outline-variant/40 hover:border-outline-variant'}`}>
              <div className="font-body text-[10px] uppercase tracking-widest text-on-surface-variant mb-0.5">Check-out</div>
              <div className="font-body text-sm font-medium text-primary">{checkOut ? formatShortDate(checkOut) : 'Add date'}</div>
            </div>
          </div>
          <button type="button" onClick={onDone} className="ml-4 p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Calendars */}
        <div className="flex gap-8 px-6 py-5">
          <button type="button" onClick={() => setLeftMonth((m) => addMonths(m, -1))}
            className="absolute left-4 top-[4.5rem] p-2 rounded-full hover:bg-surface-container transition-colors text-primary">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <MonthGrid month={leftMonth} selectedStart={selectedStart} selectedEnd={selectedEnd}
            today={today} hovered={hovered} onSelect={selectDate} onHover={setHovered} />
          <div className="w-px bg-outline-variant/20 self-stretch" />
          <MonthGrid month={rightMonth} selectedStart={selectedStart} selectedEnd={selectedEnd}
            today={today} hovered={hovered} onSelect={selectDate} onHover={setHovered} />
          <button type="button" onClick={() => setLeftMonth((m) => addMonths(m, 1))}
            className="absolute right-4 top-[4.5rem] p-2 rounded-full hover:bg-surface-container transition-colors text-primary">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-5 pt-2 border-t border-outline-variant/20">
          <div className="font-body text-sm text-on-surface-variant">
            {nights !== null ? `${nights} night${nights !== 1 ? 's' : ''}` : checkIn ? 'Select check-out date' : 'Select check-in date'}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => onChange({ checkIn: '', checkOut: '' })}
              className="font-body text-sm text-on-surface-variant underline hover:text-primary transition-colors">
              Clear dates
            </button>
            <button type="button" onClick={onDone}
              className="bg-primary text-white px-6 py-2.5 rounded-xl font-body text-sm font-semibold hover:bg-primary/90 transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
