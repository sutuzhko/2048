import type { Lang } from '../types/game';
import { DICTIONARY, type Strings } from './dictionary';

export type { Strings };

/** Возвращает словарь строк для языка (по умолчанию — русский). */
export const getStrings = (lang: Lang): Strings => DICTIONARY[lang] ?? DICTIONARY.ru;
