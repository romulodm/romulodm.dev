'use client';

import { useEffect, useState } from 'react';

/**
 * The owner's local time (Rio Grande, BR), not the visitor's, as "HH:MM" plus
 * the hour as a number. Shown in the contact comment (ContactComment.tsx) so a
 * visitor writing in the middle of the night there knows why the reply may
 * take a while.
 */

const TIME_ZONE = 'America/Sao_Paulo';

function readClock(): { label: string; hour: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());

  const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return { label: `${hour}:${minute}`, hour: Number(hour) };
}

/**
 * The clock starts empty and is filled after mount. Rendering the time on the
 * server would produce a hydration mismatch whenever the minute changes
 * between the HTML being generated and the page being hydrated.
 */
export function useOwnerClock() {
  const [clock, setClock] = useState<{ label: string; hour: number } | null>(null);

  useEffect(() => {
    const update = () => setClock(readClock());
    update();
    const id = setInterval(update, 20_000);
    return () => clearInterval(id);
  }, []);

  return clock;
}
