import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { ExperienceItem } from '@/data/resume';

interface ExperienceListProps {
  experiences: ExperienceItem[];
}

export function ExperienceList({ experiences }: ExperienceListProps) {
  return (
    <div className="flex flex-col">
      {experiences.map((exp, index) => (
        <ExperienceCard
          key={index}
          experience={exp}
          isLast={index === experiences.length - 1}
        />
      ))}
    </div>
  );
}

function ExperienceCard({
  experience,
  isLast,
}: {
  experience: ExperienceItem;
  isLast: boolean;
}) {
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
          </div>
        </div>

        {experience.skills && experience.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {experience.skills.map((skill, i) => (
              <span
                key={i}
                className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {experience.about && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {experience.about}
          </p>
        )}

        {'description' in experience &&
          Array.isArray((experience as Record<string, unknown>).description) && (
            <ul className="flex flex-col gap-1 text-sm text-muted-foreground leading-relaxed list-none">
              {((experience as Record<string, unknown>).description as string[]).map(
                (item, i) => (
                  <li key={i}>
                    {i + 1} - {item}
                  </li>
                )
              )}
            </ul>
          )}
      </div>
    </article>
  );
}
