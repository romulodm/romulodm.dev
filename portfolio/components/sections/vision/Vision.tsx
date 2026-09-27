'use client';

import './Vision.css';

import { useTranslations } from 'next-intl';
import { TbHeartHandshake } from 'react-icons/tb';

import SectionHeader from '../SectionHeader';
import Software from './Software';

export default function Vision() {
  const t = useTranslations('home.software');

  return (
    <section className="vs-scope w-full overflow-hidden pb-20">
      {/*
       * `pb-20` e folga para o formulario do <Reach />: ele e absoluto, fica a
       * 67% de um board de altura fixa e passa um pouco do fim dele. Com
       * `pb-10` o `overflow-hidden` desta section cortava o aviso de
       * privacidade. No mobile o <Software /> termina 2.5rem acima do fim
       * do formulario e conta com este `pb-20` para fechar a secao logo abaixo
       * dele (ver REACH_TOP_MOBILE).
       */}
      {/*
       * `items-center` aqui NAO pode existir: o <Software /> e uma arvore de
       * elementos posicionados em porcentagem dentro de um board com largura
       * relativa. Centralizar os itens faz o container encolher para o tamanho
       * do conteudo e todo o board colapsa junto. A centralizacao acontece com
       * `mx-auto` no proprio bloco, que continua ocupando 100% da faixa.
       */}
      {/* `px-4` e o mesmo gutter da section do FAQ logo abaixo: o formulario
          encosta na borda esquerda deste bloco, entao os dois alinham. */}
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
    </section>
  );
}
