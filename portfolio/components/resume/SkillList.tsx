import type { SkillGroup } from '@/data/resume';

export function SkillList({ skills }: { skills: SkillGroup[] }) {
  return (
    <div className="flex flex-col gap-4">
      {skills.map((group) => (
        <div key={group.category} className="flex flex-col gap-0.5">
          <h3 className="text-base font-semibold text-foreground">{group.category}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{group.items}</p>
        </div>
      ))}
    </div>
  );
}

export function InterestList({ interests }: { interests: string[] }) {
  return (
    <ul className="flex flex-col gap-1.5 list-disc pl-5">
      {interests.map((item) => (
        <li key={item} className="text-sm text-muted-foreground leading-relaxed">
          {item}
        </li>
      ))}
    </ul>
  );
}
