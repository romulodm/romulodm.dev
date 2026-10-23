'use client';

import React, { type CSSProperties, type ElementType, type ReactNode } from 'react';

/**
 * `as` aceita tanto tags nativas quanto componentes de terceiros (o
 * `animated.div` do react-spring, por exemplo). `ElementType` puro faz o TS
 * intersectar os props de todas as tags possiveis e o resultado colapsa para
 * `never`, entao o repasse e feito por um tipo com index signature.
 */
type PolymorphicComponent = React.FC<Record<string, unknown>>;

export type Tone = 'primary' | 'neutral' | 'danger' | 'success' | 'warning' | 'info';

function cx(...values: (string | false | undefined | null)[]) {
  return values.filter(Boolean).join(' ');
}

/* -------------------------------------------------------------------------- */
/*                                    Card                                    */
/* -------------------------------------------------------------------------- */

export function Card({
  as,
  variant = 'outlined',
  color = 'neutral',
  className,
  style,
  children,
  ...props
}: {
  as?: ElementType;
  variant?: 'outlined' | 'plain';
  color?: Tone;
  className?: string;
  style?: CSSProperties | Record<string, unknown>;
  children?: ReactNode;
} & Record<string, unknown>) {
  const Component = (as || 'div') as PolymorphicComponent;
  return (
    <Component
      className={cx('vs-card', `vs-card--${variant}`, `vs-color-${color}`, className)}
      style={style}
      {...props}
    >
      {children}
    </Component>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Button                                   */
/* -------------------------------------------------------------------------- */

export function Button({
  as,
  variant = 'solid',
  color = 'primary',
  startDecorator,
  className,
  children,
  ...props
}: {
  as?: ElementType;
  variant?: 'solid' | 'soft' | 'outlined';
  color?: Tone;
  startDecorator?: ReactNode;
  className?: string;
  children?: ReactNode;
} & Record<string, unknown>) {
  const Component = (as || 'button') as PolymorphicComponent;
  return (
    <Component
      className={cx('vs-btn', `vs-btn--${variant}`, `vs-color-${color}`, className)}
      {...props}
    >
      {startDecorator}
      {children}
    </Component>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Chip                                    */
/* -------------------------------------------------------------------------- */

export function Chip({
  as,
  variant = 'solid',
  color = 'primary',
  className,
  style,
  children,
  ...props
}: {
  as?: ElementType;
  variant?: 'solid' | 'soft' | 'outlined';
  color?: Tone;
  className?: string;
  style?: CSSProperties | Record<string, unknown>;
  children?: ReactNode;
} & Record<string, unknown>) {
  const Component = (as || 'div') as PolymorphicComponent;
  return (
    <Component
      className={cx('vs-chip', `vs-chip--${variant}`, `vs-color-${color}`, className)}
      style={style}
      {...props}
    >
      {children}
    </Component>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Avatar                                   */
/* -------------------------------------------------------------------------- */

export function Avatar({
  variant = 'soft',
  color = 'neutral',
  size = 'md',
  className,
  style,
  children,
  ...props
}: {
  variant?: 'soft' | 'solid' | 'outlined';
  color?: Tone;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
} & Record<string, unknown>) {
  return (
    <div
      className={cx('vs-avatar', `vs-avatar--${size}`, `vs-avatar--${variant}`, `vs-color-${color}`, className)}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}
