'use client';

/**
 * Contact section of the home page as a pinned comment on the board.
 *
 * <Software /> is a collaborative canvas: cards, a manager's comment and a
 * cursor named after the owner. This layout ends that canvas with one more
 * comment, the owner's, instead of switching to a new metaphor: his photo,
 * his local time, what he is open to talk about and how soon he answers.
 *
 * Under it sits the row of profile links (LinkCarousel), at the same width
 * as the comment. There is no inline form on purpose: clicking the comment
 * opens the contact modal, the same modal the FAQ's "send a message"
 * link and the other contextual shortcuts open, so the home page has one way
 * in and the form, its Turnstile challenge and its topic picker live in one
 * place (components/modals/ContactModal).
 *
 * The comment carries `data-cursor-target="contact"`: the board's cursor
 * (<Software />) measures it and lands on it at step 4.
 *
 */

import { useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { animated, useSpringValue } from '@react-spring/web';

import { ContactTrigger } from '@/components/modals/ContactTrigger';
import LinkCarousel, { LINK_CARROUSEL_WIDTH } from '../contact/ContactLinkCarrousel';
import { useOwnerClock } from './useOwnerClock';
import { useMobileMode } from './Responsive';

const OWNER_PHOTO = '/assets/romulo.webp';

/** Scroll step of <Software /> at which the section appears: when the cursor moves down to it. */
const REVEAL_STEP = 4;
/** How far the section slides while it fades in, in px. */
const REVEAL_OFFSET = 48;

export default function ContactComment({ step }: { step: number }) {
  const t = useTranslations('vision.contactComment');
  const mobile = useMobileMode();

  /*
   * Reveal: on desktop the section fades in and rises when the board's scroll
   * animation reaches the step where the cursor moves down to it; on mobile
   * there is no cursor to wait for, so it is simply there.
   */
  const visible = mobile || step >= REVEAL_STEP;
  const opacity = useSpringValue(0);
  const offset = useSpringValue(REVEAL_OFFSET);

  useEffect(() => {
    opacity.start(visible ? 1 : 0);
    offset.start(visible ? 0 : REVEAL_OFFSET);
  }, [visible, opacity, offset]);

  return (
    <animated.div
      id="lets-connect"
      // In the flow of <Software />'s column, under the board. The board's
      // last element (the manager's comment) overflows its 40rem box by a
      // few px on desktop, so 5rem there still leaves a clear gap; on mobile
      // the stacked board ends flush with its box and keeps the larger 8rem.
      className="mt-32 w-full px-4 md:mt-20 md:px-0"
      style={{
        opacity,
        transform: offset.to((y) => `translateY(${y}px)`),
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      {/* One width for the comment and the link row: the row's natural
          width, so the two line up as a single column. `min-w-0` lets the
          column shrink below it on phones, where the row is clipped instead
          of pushing the page sideways. */}
      <div className="flex w-full min-w-0 flex-col" style={{ maxWidth: LINK_CARROUSEL_WIDTH }}>
        <h2 className="type-h2 vs-t-primary">{t('title')}</h2>
        <div className="w-full overflow-hidden mb-2">
          <LinkCarousel />
        </div>
        <OwnerComment />
      </div>
    </animated.div>
  );
}

/**
 * The owner's comment, in the same shape as the manager's comment on the
 * board (<Comment /> in Software.tsx): small avatar, "name • time" on top,
 * one sentence under it, and the bubble's top-left corner left square. The
 * border is the neutral one of the board's cards rather than the manager's
 * red, and turns to the site's primary colour on hover or keyboard focus,
 * which is the only hint that the whole bubble is a button.
 *
 * The time is the owner's local time. It renders as `--:--` on the server
 * and fills in after mount, so there is no hydration mismatch when the
 * minute turns in between.
 */
function OwnerComment() {
  const t = useTranslations('vision.contactComment');
  const clock = useOwnerClock();

  return (
    // Block-level wrapper so the board's cursor measures the bubble itself
    // (see CURSOR_TARGETS in Software.tsx).
    <div data-cursor-target="contact" className="w-full">
      <ContactTrigger
        topic="OTHER"
        className="vs-card vs-card--outlined vs-color-neutral vs-contact-comment w-full"
      >
        <Image
          src={OWNER_PHOTO}
          alt=""
          width={32}
          height={32}
          className="size-8 shrink-0 rounded-full object-cover"
        />
        <span className="flex flex-col">
          <span className="vs-body3 vs-t-secondary font-semibold">
            Romulo
            {' • '}
            <span className="vs-t-tertiary">
              <time className="tabular-nums">{clock?.label ?? '--:--'}</time> {t('inCity')}
            </span>
          </span>
          <span className="vs-body2 vs-t-secondary mr-2">{t('body')}</span>
        </span>
      </ContactTrigger>
    </div>
  );
}
