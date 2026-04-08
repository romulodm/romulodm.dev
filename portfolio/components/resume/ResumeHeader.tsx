import type { ResumeData } from '@/data/resume';

interface ResumeHeaderProps {
  data: ResumeData;
}

export function ResumeHeader({ data }: ResumeHeaderProps) {
  const { infos, contact, labels } = data;

  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-foreground tracking-tight text-balance">
          {infos.name}
        </h1>
        <p className="text-lg font-semibold text-muted-foreground">{infos.position}</p>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{infos.bio}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-border">
        <ContactItem
          label={labels.address}
          value={contact.address}
        />
        <ContactItem
          label={labels.email}
          value={contact.email}
          href={`mailto:${contact.email}`}
        />
        <ContactItem
          label={labels.linkedinLabel}
          value={labels.linkedinText}
          href={contact.linkedin}
          external
        />
        <ContactItem
          label={labels.githubLabel}
          value={labels.githubText}
          href={contact.github}
          external
        />
      </div>
    </header>
  );
}

function ContactItem({
  label,
  value,
  href,
  external,
}: {
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5 text-sm font-medium">
        {label}
      </div>
      {href ? (
        <a
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          className="text-sm text-chart-1 underline text-blue-500 dark:text-blue-400"
        >
          {value}
        </a>
      ) : (
        <span className="text-sm text-muted-foreground">{value}</span>
      )}
    </div>
  );
}
