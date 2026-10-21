'use client';

import './Vision.css';

import { useTranslations } from 'next-intl';
import { TbHeartHandshake } from 'react-icons/tb';

import SectionHeader from '../SectionHeader';
import Software from './Software';
import Bento from '../bento/Bento';
import { FAQ } from '@/components/FAQ';

export default function Vision() {
  const t = useTranslations('home.software');

  return (
    <section className="vs-scope w-full overflow-x-clip">
      {/*
       * The section clips overflow on the x axis only. The board breaks out
       * to 100vw on mobile and its parallax cards drift sideways, which must
       * not widen the page. It must not be `overflow-hidden`: that turns the
       * section into a scroll container, and the FAQ inside it has a sticky
       * header (`lg:sticky`) that would then stick to this section instead
       * of to the viewport, which is to say never. `clip` cuts the overflow
       * without creating a scroll container, and `overflow-x-hidden` would
       * not do either, since it forces the y axis to `auto`.
       */}
      {/*
       * `items-center` aqui NAO pode existir: o <Software /> e uma arvore de
       * elementos posicionados em porcentagem dentro de um board com largura
       * relativa. Centralizar os itens faz o container encolher para o tamanho
       * do conteudo e todo o board colapsa junto. A centralizacao acontece com
       * `mx-auto` no proprio bloco, que continua ocupando 100% da faixa.
       */}
      {/* `px-4` is the same gutter as the FAQ section below: the contact
          comment sits against the left edge of this block, so the two line
          up. */}
      <div className="mx-auto w-full max-w-7xl px-4">
        <SectionHeader
          accent="vision"
          icon={<TbHeartHandshake />}
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
        />

        <Software />
      </div>

      <section className='w-full flex items-center justify-center pb-16 px-4 max-w-7xl mx-auto'>
        <div className="flex flex-col justify-center items-center w-full">
          <FAQ />
          <div className="mt-16 w-full">
            <Bento />
          </div>
        </div>
      </section>
    </section>
  );
}
