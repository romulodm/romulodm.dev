'use client';

import { useLocale } from 'next-intl';
import type { ResumeData } from '@/data/resume';
import { ResumeHeader } from './ResumeHeader';
import { ExperienceList } from './ExperienceList';
import { EducationList } from './EducationList';
import { LanguageList } from './LanguageList';
import { CollapsibleSection } from './CollapsibleSection';
import { Briefcase, GraduationCap, Languages } from 'lucide-react';
import { ResumePDFButton } from './ResumePDFButton';

interface ResumePageClientProps {
  data: ResumeData;
  locale: string;
}

export function ResumePageClient({ data, locale }: ResumePageClientProps) {
  const intlLocale = useLocale();

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4">

          <div id="resume-content">
            <ResumeHeader data={data} />

            <CollapsibleSection
              title={data.labels.experiences}
              icon={<Briefcase className="h-5 w-5 text-muted-foreground" />}
            >
              <ExperienceList experiences={data.experience} />
            </CollapsibleSection>

            <CollapsibleSection
              title={data.labels.education}
              icon={<GraduationCap className="h-5 w-5 text-muted-foreground" />}
            >
              <EducationList education={data.education} />
            </CollapsibleSection>

            <CollapsibleSection
              title={data.labels.languages}
              icon={<Languages className="h-5 w-5 text-muted-foreground" />}
            >
              <LanguageList
                languages={data.languages}
                nativeLabel={data.labels.native}
              />
            </CollapsibleSection>
          </div>

          <div className="flex justify-center mt-4">
            <ResumePDFButton />
          </div>

        </div>
      </div>
    </main>
  );
}
