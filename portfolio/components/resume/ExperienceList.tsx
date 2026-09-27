'use client';

import { useId, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { getDuration } from '@/lib/resume-duration';
import type { ExperienceItem } from '@/data/resume';

interface ExperienceListProps {
  experiences: ExperienceItem[];
  /**
   * Show each card as header plus a clamped summary, with a "show more"
   * button for the skills and the numbered list. Used on the home page on
   * small screens, where the list is not inside the terminal's scroll box and
   * every card would otherwise take several screens. Leave it off on /resume:
   * that page is exported to PDF and must print everything.
   */
  collapsible?: boolean;
}

export function ExperienceList({ experiences, collapsible = false }: ExperienceListProps) {
  return (
    <div className="flex flex-col">
      {experiences.map((exp, index) => (
        <ExperienceCard
          key={index}
          experience={exp}
          collapsible={collapsible}
          isLast={index === experiences.length - 1}
        />
      ))}
    </div>
  );
}

/** "(1 ano e 8 meses)" / "(1 year 8 months)", or nothing if the dates don't parse. */
function DurationLabel({ start, end }: { start: string; end: string }) {
  const t = useTranslations('experienceList.duration');
  const duration = getDuration(start, end);
  if (!duration) return null;

  const years = duration.years > 0 ? t('years', { count: duration.years }) : null;
  const months = duration.months > 0 ? t('months', { count: duration.months }) : null;
  const label = years && months ? t('both', { years, months }) : (years ?? months);

  return (
    // Ongoing roles are measured against today, so the server and the client
    // can disagree when a render straddles the turn of a month.
    <span className="text-muted-foreground/70" suppressHydrationWarning>
      ({label})
    </span>
  );
}

function ExperienceCard({
  experience,
  collapsible,
  isLast,
}: {
  experience: ExperienceItem;
  collapsible: boolean;
  isLast: boolean;
}) {
  const t = useTranslations('experienceList');
  const detailsId = useId();
  const [expanded, setExpanded] = useState(false);

  const description =
    'description' in experience &&
    Array.isArray((experience as Record<string, unknown>).description)
      ? ((experience as Record<string, unknown>).description as string[])
      : [];
  const hasSkills = !!experience.skills && experience.skills.length > 0;
  const hasDetails = hasSkills || description.length > 0;

  /** Collapsed: the skills and the numbered list are hidden, the summary is clamped. */
  const collapsed = collapsible && hasDetails && !expanded;

  return (
    <article
      className={cn(
        'relative flex gap-3 pb-4 mb-2',
        isLast ? 'timeline-connector-last' : 'timeline-connector'
      )}
    >
      <div className="relative z-10 flex-shrink-0 pt-[1px]">
        <a
          href={experience.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Image
            src={experience.icon}
            alt={`${experience.company} logo`}
            width={45}
            height={45}
            className="rounded-md object-cover border border-border"
          />
        </a>
      </div>
      <div className="flex flex-col gap-2 min-w-0">
        <div className="flex flex-col">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <a
              href={experience.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground hover:underline"
            >
              {experience.company}
            </a>
            <span className="text-sm text-muted-foreground">
              {experience.contract} - {experience.location}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <span className="font-medium text-chart-1">{experience.position}</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">
              {experience.start} - {experience.end}
            </span>
            <DurationLabel start={experience.start} end={experience.end} />
          </div>
        </div>

        {!collapsed && hasSkills && (
          <div id={detailsId} className="flex flex-wrap gap-1.5">
            {experience.skills!.map((skill, i) => (
              <span
                key={i}
                className="rounded-md bg-gray-200 dark:bg-muted px-2 py-0.5 text-xs font-medium text-secondary-foreground"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {experience.about && (
          <p
            className={cn(
              'text-sm text-muted-foreground leading-relaxed',
              collapsed && 'line-clamp-3'
            )}
          >
            {experience.about}
          </p>
        )}

        {!collapsed && description.length > 0 && (
          <ul
            id={hasSkills ? undefined : detailsId}
            className="flex flex-col gap-1 pl-5 text-sm text-muted-foreground leading-relaxed list-disc marker:text-muted-foreground/60"
          >
            {description.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        )}

        {collapsible && hasDetails && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls={expanded ? detailsId : undefined}
            className="self-start text-sm font-medium text-chart-1 hover:underline"
          >
            {expanded ? t('showLess') : t('showMore')}
          </button>
        )}
      </div>
    </article>
  );
}
