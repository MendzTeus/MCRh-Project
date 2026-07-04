import { useState, useRef } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import DateRangePicker, { formatDateRangeLabel } from './DateRangePicker';
import { useClickOutside } from '../hooks/useClickOutside';

type AvailabilityWidgetProps = {
  propertyName: string;
  maxGuests?: number;
  floating?: boolean;
  onDatesChange?: (checkIn: string, checkOut: string) => void;
  mode?: 'enquiry' | 'availability';
  onCheckAvailability?: () => void;
};

export default function AvailabilityWidget({ propertyName, maxGuests = 8, floating = true, onDatesChange, mode = 'enquiry', onCheckAvailability }: AvailabilityWidgetProps) {
  const [datesOpen, setDatesOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const datesRef = useRef<HTMLDivElement>(null);
  const guestsRef = useRef<HTMLDivElement>(null);
  // datesOpen is closed via the DateRangePicker portal backdrop (no useClickOutside needed)
  useClickOutside(guestsRef, () => setGuestsOpen(false), guestsOpen);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const dateLabel = formatDateRangeLabel(checkIn, checkOut);
  const datesSelected = Boolean(checkIn && checkOut);

  function handleCheckAvailability() {
    if (!checkIn || !checkOut) {
      setDatesOpen(true);
      return;
    }
    setDatesOpen(false);
    setGuestsOpen(false);
  }

  return (
    <div className={`relative z-50 px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto${floating ? ' -mt-12' : ' mt-8'}`}>
      <div className="bg-surface border border-outline-variant/30 rounded-lg p-4 md:p-6 flex flex-col md:flex-row items-center gap-4 md:gap-6 shadow-lg bg-opacity-95 backdrop-blur">
        <div className="flex-1 w-full">
          <label className="font-body text-[10px] mb-1 block uppercase tracking-widest text-on-surface">Property</label>
          <div className="font-body text-on-surface border-b border-outline-variant/30 pb-2 bg-transparent w-full pt-1">
            {propertyName}
          </div>
        </div>
        <div className="flex-1 w-full relative" ref={datesRef}>
          <label className="font-body text-[10px] mb-1 block uppercase tracking-widest text-on-surface">Dates</label>
          <button
            type="button"
            onClick={() => {
              setDatesOpen((open) => !open);
              setGuestsOpen(false);
            }}
            className="font-body text-on-surface border-b border-outline-variant/30 pb-2 flex justify-between items-center cursor-pointer pt-1 hover:border-primary transition-colors w-full text-left"
          >
            <span className={checkIn && checkOut ? '' : 'opacity-70'}>{dateLabel}</span>
            <Calendar className="w-4 h-4 text-on-surface" />
          </button>
          {datesOpen && (
            <DateRangePicker
              checkIn={checkIn}
              checkOut={checkOut}
              onChange={({ checkIn: nextCheckIn, checkOut: nextCheckOut }) => {
                setCheckIn(nextCheckIn);
                setCheckOut(nextCheckOut);
                onDatesChange?.(nextCheckIn, nextCheckOut);
              }}
              onDone={() => setDatesOpen(false)}
            />
          )}
        </div>
        <div className="flex-1 w-full relative" ref={guestsRef}>
          <label className="font-body text-[10px] mb-1 block uppercase tracking-widest text-on-surface">Guests</label>
          <button
            type="button"
            onClick={() => {
              setGuestsOpen((open) => !open);
              setDatesOpen(false);
            }}
            className="font-body text-on-surface border-b border-outline-variant/30 pb-2 flex justify-between items-center cursor-pointer pt-1 hover:border-primary transition-colors w-full text-left"
          >
            <span>{guests} {guests === 1 ? 'Guest' : 'Guests'}</span>
            <ChevronDown className="w-4 h-4 text-on-surface" />
          </button>
          {guestsOpen && (
            <div className="absolute left-0 right-0 top-full mt-3 rounded-lg border border-outline-variant/30 bg-surface p-4 shadow-xl z-[500]">
              <div className="flex items-center justify-between">
                <span className="font-body text-body-md text-primary">Guests</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setGuests((value) => Math.max(1, value - 1))}
                    className="h-9 w-9 rounded-full border border-outline-variant/50 text-primary"
                  >
                    -
                  </button>
                  <span className="min-w-6 text-center font-body text-body-md">{guests}</span>
                  <button
                    type="button"
                    onClick={() => setGuests((value) => Math.min(maxGuests, value + 1))}
                    className="h-9 w-9 rounded-full border border-outline-variant/50 text-primary"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col items-center md:items-end gap-2 w-full md:w-auto">
          {mode === 'availability' ? (
            <button
              type="button"
              onClick={() => { if (!checkIn || !checkOut) { setDatesOpen(true); return; } onCheckAvailability?.(); }}
              className="bg-primary-container text-[#C8A45C] border border-[#C8A45C] px-8 py-3 font-body text-label-caps tracking-widest uppercase hover:bg-primary transition-all w-full md:w-auto rounded"
            >
              {datesSelected ? 'See Availability ↓' : 'Check Dates'}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCheckAvailability}
                className="bg-primary-container text-[#C8A45C] border border-[#C8A45C] px-8 py-3 font-body text-label-caps tracking-widest uppercase hover:bg-primary transition-all w-full md:w-auto rounded"
              >
                {datesSelected ? 'Enquire Now' : 'Check Dates'}
              </button>
              {datesSelected && (
                <span className="font-body text-label-caps text-on-surface-variant tracking-widest uppercase">
                  Contact us to confirm
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
