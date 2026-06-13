import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

type AvailabilityWidgetProps = {
  propertyName: string;
  maxGuests?: number;
};

function formatDate(value: string) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(`${value}T00:00:00`));
}

export default function AvailabilityWidget({ propertyName, maxGuests = 8 }: AvailabilityWidgetProps) {
  const [datesOpen, setDatesOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [status, setStatus] = useState('Available');

  const dateLabel = checkIn && checkOut ? `${formatDate(checkIn)} - ${formatDate(checkOut)}` : 'Select dates';

  function checkAvailability() {
    if (!checkIn || !checkOut) {
      setDatesOpen(true);
      setStatus('Select dates');
      return;
    }

    setDatesOpen(false);
    setGuestsOpen(false);
    setStatus('Available');
  }

  return (
    <div className="relative z-50 -mt-12 px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
      <div className="bg-surface border border-outline-variant/30 rounded-lg p-4 md:p-6 flex flex-col md:flex-row items-center gap-4 md:gap-6 shadow-lg bg-opacity-95 backdrop-blur">
        <div className="flex-1 w-full">
          <label className="font-body text-[10px] mb-1 block uppercase tracking-widest text-on-surface">Property</label>
          <div className="font-body text-on-surface border-b border-outline-variant/30 pb-2 bg-transparent w-full pt-1">
            {propertyName}
          </div>
        </div>
        <div className="flex-1 w-full relative">
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
            <div className="absolute left-0 right-0 top-full mt-3 rounded-lg border border-outline-variant/30 bg-surface p-4 shadow-xl z-50">
              <div className="grid grid-cols-1 gap-4">
                <label className="font-body text-[10px] uppercase tracking-widest text-on-surface-variant">
                  Check-in
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(event) => setCheckIn(event.target.value)}
                    className="mt-2 w-full border border-outline-variant/40 bg-transparent px-3 py-2 font-body text-body-md text-primary focus:outline-none focus:border-primary"
                  />
                </label>
                <label className="font-body text-[10px] uppercase tracking-widest text-on-surface-variant">
                  Check-out
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn}
                    onChange={(event) => setCheckOut(event.target.value)}
                    className="mt-2 w-full border border-outline-variant/40 bg-transparent px-3 py-2 font-body text-body-md text-primary focus:outline-none focus:border-primary"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 w-full relative">
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
            <div className="absolute left-0 right-0 top-full mt-3 rounded-lg border border-outline-variant/30 bg-surface p-4 shadow-xl z-50">
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
          <button
            type="button"
            onClick={checkAvailability}
            className="bg-primary-container text-[#C8A45C] border border-[#C8A45C] px-8 py-3 font-body text-label-caps tracking-widest uppercase hover:bg-primary transition-all w-full md:w-auto rounded"
          >
            Check availability
          </button>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            <span className="font-body text-[10px] text-primary tracking-widest uppercase">{status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
