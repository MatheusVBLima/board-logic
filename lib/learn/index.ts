// Teaching texts per language: a one-line summary per part for the "Learn" sidebar,
// and the complete guide shown on the /[lang]/learn page.

import type { Locale } from '../i18n/config.ts';
import en from './en.ts';
import pt from './pt.ts';
import type { LearnContent } from './types.ts';

export { GROUPS, type Basic, type Group, type Lesson, type LearnContent } from './types.ts';

const CONTENT: Record<Locale, LearnContent> = { en, pt };
export const getLearn = (locale: Locale) => CONTENT[locale];
