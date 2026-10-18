import { useTranslations } from 'next-intl';
import { FaArrowRightLong } from 'react-icons/fa6';

import { Link } from '@/i18n/navigation';
import Contributions from './Contributions';

/**
 * One card for "what I do" and "what I think": the year of GitHub
 * contributions on top, the call to the blog underneath.
 *
 * The call-out is rendered on the server and is always there. The heat map is
 * a client component that appears above it once the calendar arrives, and
 * never appears if the calendar does not; the card then is just the call-out.
 * The card sits well below the fold, so the late arrival shifts nothing the
 * visitor is looking at.
 *
 * Borders use the same pair of greys as the home page `<hr>`s and the "Agora"
 * strip, so the card reads as part of that family rather than a new surface.
 */
export default function ActivityCallout() {
    const t = useTranslations('home.vision');

    // The button takes GitHub's green so it reads as part of the heat map
    // above it rather than a second accent competing with it.
    return (
        <section className="mx-auto flex w-full max-w-7xl items-center justify-center px-4 pb-16">
            <div className="w-full">
                <hr className="mb-5 mt-3 dark:border-[#2f3031]" />

                <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-card dark:border-[#2f3031]">
                    <Contributions />

                    <div className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center sm:px-7 sm:py-6">
                        <div>
                            <h2 className="type-h3 text-foreground">{t('link-title')}</h2>
                            <p className="type-small mt-1 text-muted-foreground">{t('link-content')}</p>
                        </div>

                        <Link
                            href="/blog"
                            className="group inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-[#1f883d] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1a7f37] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2ea043] sm:w-auto dark:bg-[#238636] dark:hover:bg-[#2ea043]"
                        >
                            {t('link-button')}
                            <FaArrowRightLong
                                aria-hidden="true"
                                className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
                            />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
