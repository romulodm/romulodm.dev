import { getLocale } from 'next-intl/server';
import { getResumeData } from '@/data/resume';
import { ResumePageClient } from '@/components/resume/ResumePageClient';
import Navbar from '@/components/navigation/Navbar';
import { Footer } from '@/components/Footer';

export default async function Resume() {
    const locale = await getLocale();
    const data = getResumeData(locale);

    return (
        <main className="min-h-screen default-scroll bg-background">
            <div className="no-pdf">
                <Navbar />
            </div>

            <div className="py-6 no-pdf" />

            <ResumePageClient data={data} locale={locale} />

            <div className="no-pdf">
                <Footer />
            </div>

        </main>
    )

}
