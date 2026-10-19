import { PT_TIMELINE } from './pt';
import { EN_TIMELINE } from './en';
import { ES_TIMELINE } from './es';

export type TimelineData = typeof EN_TIMELINE;

export function getTimelineData(locale: string): TimelineData {
    if (locale === 'en') return EN_TIMELINE;
    if (locale === 'es') return ES_TIMELINE;
    return PT_TIMELINE;
}
