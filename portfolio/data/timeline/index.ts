import { PT_TIMELINE } from './pt';
import { EN_TIMELINE } from './en';

export type TimelineData = typeof EN_TIMELINE;

export function getTimelineData(locale: string): TimelineData {
    if (locale === 'en') return EN_TIMELINE;
    return PT_TIMELINE;
}
