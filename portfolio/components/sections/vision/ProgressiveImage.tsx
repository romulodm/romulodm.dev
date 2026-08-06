'use client';

import React, { useEffect, useMemo, useState, type CSSProperties, type ComponentProps } from 'react';
import { animated } from '@react-spring/web';

/**
 * Porte sem Joy UI de /Catalyst/src/components/ProgressiveImage.tsx.
 * Carrega o placeholder minificado com blur e faz a troca pela imagem cheia
 * assim que ela termina de baixar, com a transicao proporcional ao tempo
 * gasto no download.
 */
function isCached(src: string) {
  if (typeof window === 'undefined') return false;
  const image = new Image();
  image.src = src;
  if (image.complete) return true;
  image.src = '';
  return false;
}

export default function ProgressiveImage({
  src,
  placeholder,
  alt,
  animate = false,
  style,
  onLoad,
}: {
  src: string;
  placeholder: string;
  alt: string;
  animate?: boolean;
  style?: ComponentProps<typeof animated.img>['style'];
  onLoad?: () => void;
}) {
  const start = useMemo(() => Date.now(), []);

  const hasCache = useMemo(() => isCached(src), [src]);

  const [loading, setLoading] = useState(!hasCache);
  const [elapsed, setElapsed] = useState<number | undefined>(hasCache ? 0 : undefined);
  const [currentSrc, setCurrentSrc] = useState(hasCache ? src : placeholder);

  useEffect(() => {
    if (!loading) return;
    const imageToLoad = new Image();
    imageToLoad.src = src;
    imageToLoad.onload = () => {
      setElapsed(Date.now() - start);
      setCurrentSrc(src);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const loadingStyle: CSSProperties = loading
    ? {
      transition: `filter ${Math.round((elapsed || 0) / 4)}ms`,
      filter: `${(style?.filter as string) || ''} blur(20px)`,
    }
    : {};

  const handleLoad = () => {
    onLoad?.();
    if (currentSrc === src) setLoading(false);
  };

  if (animate) {
    return (
      <animated.img
        src={currentSrc}
        alt={alt}
        style={{ ...style, ...loadingStyle }}
        onLoad={handleLoad}
      />
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      style={{ ...(style as CSSProperties), ...loadingStyle }}
      onLoad={handleLoad}
    />
  );
}
