import './styles.css';
import React, { useContext, useEffect, useState } from 'react';
import BlockContent from '@sanity/block-content-to-react';
import { urlFor } from '../../../data/sanity/api';
import PostCode from './PostCode';
import { MdOutlineContentCopy } from "react-icons/md";
import { ToastContext } from '../../../context/ToastContext';

const copyToClipboard = (text, showToast) => {
  navigator.clipboard.writeText(text)
    .then(() => {
      showToast('Código copiado para a área de transferência!');
    })
    .catch(err => {
      console.error('Erro ao copiar código: ', err);
    });
};


const serializers = {
  types: {
    code: ({ node: { language, code, filename } }) => {
      const { showToast } = useContext(ToastContext);

      return (
        <>
          <div className="code-container">
            <PostCode lang={language} code={code} />
            <button
              className="copy-button"
              onClick={() => copyToClipboard(code, showToast)}
            >
              <MdOutlineContentCopy/>
            </button>
          </div>
          <div className="code-filename">{filename}</div>
        </>
      );
    },
    image: ({ node: { asset, alt, position = 'center' } }) => (
      <div className={`blog-image blog-image-${position}`}>
        <img src={urlFor(asset).height(600).fit('max').url()} />
        <div className="image-alt">{alt}</div>
      </div>
    )
  }
};

export default function PostContent({content}) {
  return (
    <BlockContent
      serializers={serializers}
      blocks={content}
    />
  );
}
