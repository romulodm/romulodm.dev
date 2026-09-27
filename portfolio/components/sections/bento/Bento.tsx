'use client';

import { useTranslations } from 'next-intl';
import BentoCard from './BentoCard';
import LocationTile from './LocationTile';
import MailAppsStrip from './MailAppsStrip';
import { GuestbookArt } from './illustrations';

export default function Bento() {
  const t = useTranslations('bento');

  return (
    /* Ocupa a largura toda do container da secao (max-w-7xl), alinhando borda
       com borda com o FAQ logo acima. */
    <section className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <BentoCard
          href="/wall"
          eyebrow={t('guestbook.eyebrow')}
          title={t('guestbook.title')}
          align="bottom"
          contentClassName="-mx-2"
        >
          <GuestbookArt className="w-[16.5rem]" />
        </BentoCard>

        <LocationTile />

        <BentoCard
          href="/newsletter"
          eyebrow={t('newsletter.eyebrow')}
          title={t('newsletter.title')}
          align="bottom"
          dots
          /* a fita precisa vazar pelas laterais: o padding do card e desfeito
             aqui e o corte fica por conta do `overflow-hidden` do BentoCard */
          contentClassName="-mx-6"
        >
          <MailAppsStrip />
        </BentoCard>
      </div>

    </section>
  );
}
