'use client';

import './Vision.css';

import { useTranslations } from 'next-intl';
import { TbHeartHandshake } from 'react-icons/tb';

import SectionHeader from '../SectionHeader';
import Software from './Software';

export default function Vision() {
  const t = useTranslations('home.software');

  return (
    <section className="vs-scope w-full overflow-hidden pb-10">
      {/*
       * `items-center` aqui NAO pode existir: o <Software /> e uma arvore de
       * elementos posicionados em porcentagem dentro de um board com largura
       * relativa. Centralizar os itens faz o container encolher para o tamanho
       * do conteudo e todo o board colapsa junto. A centralizacao acontece com
       * `mx-auto` no proprio bloco, que continua ocupando 100% da faixa.
       */}
      <div className="mx-auto w-full max-w-[1200px] px-5">
        <SectionHeader
          accent="vision"
          icon={<TbHeartHandshake />}
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
        />

        <Software />
      </div>
    </section>
  );
}
