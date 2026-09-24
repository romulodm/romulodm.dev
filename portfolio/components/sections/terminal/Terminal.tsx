import { getLocale } from 'next-intl/server';
import { getResumeData } from '@/data/resume';
import TerminalClient from './TerminalClient';
import TerminalExperience from './TerminalExperience';

export default async function Terminal() {
    const locale = await getLocale();
    const data = getResumeData(locale);

    return (
        <section>
            <div className="hidden sm:block mt-4">
                <TerminalClient data={data} locale={locale} />
            </div>

            {/* Below `sm` there is no terminal (and no scroll box around the
                list), so each experience starts collapsed. */}
            <div className="block sm:hidden">
                <TerminalExperience data={data} collapsible />
            </div>
        </section>

    )

}
