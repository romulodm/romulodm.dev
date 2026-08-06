'use client';

import { useEffect, useState, type ReactElement } from 'react';

/**
 * Equivalente sem dependencias ao `react-responsive` usado no exemplo
 * (/Catalyst/src/components/Responsive.tsx). Os breakpoints sao os mesmos.
 *
 * O valor inicial e sempre `false` — no servidor e no primeiro render do
 * cliente — para nao gerar mismatch de hidratacao. O `useEffect` corrige o
 * valor imediatamente apos a montagem.
 */
function useMedia(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);

  return matches;
}

export const useDesktopMode = () => useMedia('(min-width: 992px)');
export const useTabletMode = () => useMedia('(min-width: 768px) and (max-width: 991px)');
export const useMobileMode = () => useMedia('(max-width: 767px)');
export const useNonMobileMode = () => !useMedia('(max-width: 767px)');
export const useNonDesktopMode = () => useMedia('(max-width: 991px)');

export interface ResponsiveProps {
  children: ReactElement | null;
}

export function Desktop({ children }: ResponsiveProps) {
  return useDesktopMode() ? children : null;
}

export function Tablet({ children }: ResponsiveProps) {
  return useTabletMode() ? children : null;
}

export function Mobile({ children }: ResponsiveProps) {
  return useMobileMode() ? children : null;
}

export function Default({ children }: ResponsiveProps) {
  return useNonMobileMode() ? children : null;
}
