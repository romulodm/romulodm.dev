'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

/**
 * Status pieces of the "Let's connect" scene (large screens only — see
 * <Reach /> for where each one is placed):
 *
 *   - <ReachReadout />: the LAT / LON / SIG readout next to the form;
 *   - <ReachStatusCards />: the local-time and reply-time cards, against the
 *     right edge of the scene.
 *
 * It answers the two questions a visitor has right before sending a message:
 * "is anyone awake over there?" and "how long until I hear back?". The local
 * clock is the owner's (Rio Grande, BR), not the visitor's, and when it is
 * the middle of the night there the tile says so, so that a slow reply is
 * expected instead of surprising.
 *
 * The LAT / LON / SIG readout is decoration that ties the panel to the
 * satellite illustration above it.
 */

const TIME_ZONE = 'America/Sao_Paulo';

/** Hours (local, 24h) treated as "late night": the reply may take longer. */
const LATE_NIGHT_END = 7;
const WORK_START = 9;
const WORK_END = 19;

const SIGNAL_BARS = [5, 8, 11, 14];

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
function useOwnerClock() {
  const [clock, setClock] = useState<{ label: string; hour: number } | null>(null);

  useEffect(() => {
    const update = () => setClock(readClock());
    update();
    const id = setInterval(update, 20_000);
    return () => clearInterval(id);
  }, []);

  return clock;
}

const TILE =
  'min-w-0 flex-1 border border-border p-3 rounded-md backdrop-blur-sm';
const TILE_LABEL =
  'block truncate text-xs font-medium uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400';

/** Decorative readout that ties the form to the satellite illustration. */
export function ReachReadout() {
  const t = useTranslations('vision.lastConnect');

  return (
    <div aria-hidden className="font-mono text-xs leading-relaxed text-neutral-500">
      <div>
        LAT <span className="text-neutral-700 dark:text-neutral-300">-32.03</span>
      </div>
      <div>
        LON <span className="text-neutral-700 dark:text-neutral-300">-52.10</span>
      </div>
      <div className="flex items-end gap-2">
        SIG
        <span className="inline-flex items-end gap-[2px] pb-[3px]">
          {SIGNAL_BARS.map((h) => (
            <span
              key={h}
              className="w-[3px] bg-neutral-600 dark:bg-neutral-300"
              style={{ height: h }}
            />
          ))}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2 whitespace-nowrap text-neutral-600 dark:text-neutral-400">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
        </span>
        {t('uplinkReady')}
      </div>
    </div>
  );
}

export function ReachStatusCards() {
  const t = useTranslations('vision.lastConnect');
  const clock = useOwnerClock();

  const hour = clock?.hour;
  const isLate = hour !== undefined && hour < LATE_NIGHT_END;
  const note =
    hour === undefined
      ? '\u00a0'
      : isLate
        ? t('statusLateNight')
        : hour >= WORK_START && hour < WORK_END
          ? t('statusWorkHours')
          : t('statusOffHours');

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className={TILE}>
        <span className={TILE_LABEL}>{t('statusTimezone')}</span>
        {/* The server renders the placeholder and the real time only appears
            after mount, so there is nothing to reconcile on hydration. */}
        <time className="mt-1 block text-3xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
          {clock?.label ?? '--:--'}
        </time>
        <p
          className={`mt-0.5 text-xs leading-snug text-neutral-500 dark:text-neutral-400`}
        >
          {note}
        </p>
      </div>

      <div className={TILE}>
        <span className={TILE_LABEL}>{t('responseLabel')}</span>
        <span className="mt-1 block text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
          {t('responseValue')}
        </span>
        <p className="mt-0.5 text-xs leading-snug text-neutral-500 dark:text-neutral-400">
          {t('responseNote')}
        </p>
      </div>
    </div>
  );
}
