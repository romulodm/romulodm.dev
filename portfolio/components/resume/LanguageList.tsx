import type { LanguageItem } from '@/data/resume';
import { cn } from '@/lib/utils';

interface LanguageListProps {
  languages: LanguageItem[];
  nativeLabel: string;
}

const colorMap: Record<string, { badge: string; text: string }> = {
  blue: {
    badge: 'bg-blue-500/20 text-blue-500 dark:bg-blue-400/20 dark:text-blue-400',
    text: 'text-blue-600 dark:text-blue-400',
  },
  yellow: {
    badge: 'bg-amber-500/20 text-amber-600 dark:bg-amber-400/20 dark:text-amber-400',
    text: 'text-amber-600 dark:text-amber-400',
  },
  green: {
    badge: 'bg-emerald-500/20 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-400',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  red: {
    badge: 'bg-red-500/20 text-red-600 dark:bg-red-400/20 dark:text-red-400',
    text: 'text-red-600 dark:text-red-400',
  },
};

export function LanguageList({ languages, nativeLabel }: LanguageListProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {languages.map((lang, index) => (
        <LanguageBadge key={index} language={lang} nativeLabel={nativeLabel} />
      ))}
    </div>
  );
}

function LanguageBadge({
  language,
  nativeLabel,
}: {
  language: LanguageItem;
  nativeLabel: string;
}) {
  const colors = colorMap[language.color] || colorMap.blue;

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'inline-flex items-center justify-center rounded p-1.5 text-xs font-bold',
          colors.badge
        )}
      >
        {language.level}
      </span>
      <span className={cn('text-sm font-medium', colors.text)}>
        {language.name}
        {language.native && ` (${nativeLabel})`}
      </span>
    </div>
  );
}
