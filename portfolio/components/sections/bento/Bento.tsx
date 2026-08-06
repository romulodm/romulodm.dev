'use client';

import { useTranslations } from 'next-intl';
import BentoCard from './BentoCard';
import LocationTile from './LocationTile';
import { EnvelopeArt, GuestbookArt } from './illustrations';

export default function Bento() {
  const t = useTranslations('bento');

  return (
    /* `max-w-[900px]` casa com o container do <FAQ />: o bento fecha a secao
       logo abaixo do acordeao e precisa alinhar borda com borda. */
    <section className="mx-auto flex w-full max-w-[900px] flex-col gap-4 pt-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <BentoCard href="/wall" eyebrow={t('guestbook.eyebrow')} title={t('guestbook.title')} align="bottom">
          <GuestbookArt className="w-[15rem] text-neutral-500 dark:text-neutral-400" />
        </BentoCard>

        <LocationTile />

        <BentoCard
          href="/newsletter"
          eyebrow={t('newsletter.eyebrow')}
          title={t('newsletter.title')}
          align="bottom"
        >
          <EnvelopeArt className="w-[14rem] text-primary" />
        </BentoCard>
      </div>

    </section>
  );
}
