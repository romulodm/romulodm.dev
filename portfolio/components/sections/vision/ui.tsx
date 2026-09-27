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
  loading = false,
  className,
  children,
  ...props
}: {
  as?: ElementType;
  variant?: 'solid' | 'soft' | 'outlined';
  color?: Tone;
  startDecorator?: ReactNode;
  loading?: boolean;
  className?: string;
  children?: ReactNode;
} & Record<string, unknown>) {
  const Component = (as || 'button') as PolymorphicComponent;
  return (
    <Component
      className={cx('vs-btn', `vs-btn--${variant}`, `vs-color-${color}`, className)}
      {...props}
    >
      {loading ? <Spinner /> : startDecorator}
      {children}
    </Component>
  );
}

/** Spinner em SVG puro, usado no estado de loading do Button. */
export function Spinner({ size = '1.25rem' }: { size?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'vs-spin 1s linear infinite' }}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
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

/* -------------------------------------------------------------------------- */
/*                               Input / Textarea                             */
/* -------------------------------------------------------------------------- */

export function Input({
  startDecorator,
  className,
  style,
  ...props
}: {
  startDecorator?: ReactNode;
  className?: string;
  style?: CSSProperties;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cx('vs-input', className)} style={style}>
      {startDecorator && <span className="vs-input-decorator">{startDecorator}</span>}
      <input {...props} />
    </div>
  );
}

export function Textarea({
  className,
  style,
  minRows = 3,
  ...props
}: {
  className?: string;
  style?: CSSProperties;
  minRows?: number;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={cx('vs-input', 'vs-textarea', className)} style={style}>
      <textarea rows={minRows} {...props} />
    </div>
  );
}
