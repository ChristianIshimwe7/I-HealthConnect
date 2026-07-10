import { useState, useCallback } from 'react';
import en from './en.json';
import rw from './rw.json';

type Lang = 'en' | 'rw';
const translations = { en, rw };

let currentLang: Lang = 'en';
const listeners: Array<() => void> = [];

export const setLanguage = (lang: Lang) => {
  currentLang = lang;
  listeners.forEach(l => l());
};

export const useTranslation = () => {
  const [, forceUpdate] = useState(0);

  const subscribe = useCallback(() => {
    const handler = () => forceUpdate(n => n + 1);
    listeners.push(handler);
    return () => {
      const idx = listeners.indexOf(handler);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let val: any = translations[currentLang];
    for (const k of keys) val = val?.[k];
    if (typeof val !== 'string') val = key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        val = val.replace(`{{${k}}}`, String(v));
      });
    }
    return val;
  }, []);

  return { t, lang: currentLang, setLanguage, subscribe };
};
