import { PT_INFOS } from './pt';
import { EN_INFOS } from './en';
import { ES_INFOS } from './es';

export type ResumeData = typeof EN_INFOS;
export type ExperienceItem = ResumeData['experience'][number];
export type EducationItem = ResumeData['education'][number];
export type LanguageItem = ResumeData['languages'][number];
export type SkillGroup = ResumeData['skills'][number];

export function getResumeData(locale: string): ResumeData {
  if (locale === 'en') return EN_INFOS;
  if (locale === 'es') return ES_INFOS;
  return PT_INFOS;
}
