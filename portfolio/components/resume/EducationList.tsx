import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { EducationItem } from '@/data/resume';

interface EducationListProps {
  education: EducationItem[];
}

export function EducationList({ education }: EducationListProps) {
  return (
    <div className="flex flex-col">
      {education.map((edu, index) => (
        <EducationCard
          key={index}
          education={edu}
          isLast={index === education.length - 1}
        />
      ))}
    </div>
  );
}

function EducationCard({
  education,
  isLast,
}: {
  education: EducationItem;
  isLast: boolean;
}) {
  return (
    <article
      className={cn(
        'relative flex gap-3',
        isLast ? '' : 'mb-3'
      )}
    >
      <div className="relative z-10 flex-shrink-0 pt-[1px]">
        <a
          href={education.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Image
            src={education.icon}
            alt={`${education.school} logo`}
            width={45}
            height={45}
            className="rounded-md object-cover border border-border"
          />
        </a>
      </div>
      <div className="flex flex-col">
        <div className="flex flex-wrap items-baseline gap-2">
          <a
            href={education.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground hover:underline"
          >
            {education.school}
          </a>
          <span className="text-sm text-muted-foreground">
            {education.start} - {education.end}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">{education.degree}</span>
          <span className="text-muted-foreground">|</span>
          <span className="text-muted-foreground">{education.major}</span>
        </div>
      </div>
    </article>
  );
}
