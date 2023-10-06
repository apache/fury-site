import { useEffect, useState } from 'react';
import get from 'lodash-es/get';
import { useIntl, useLocale } from 'dumi';

export const useScrollToTop = () => {
  document.body.scrollTop = document.documentElement.scrollTop = 0;
}


export const usePrevAndNext = (): any[] => {
  const [prevAndNext, setPrevAndNext] = useState<any[]>([]);
  useEffect(() => {
    const menuNodes = document.querySelectorAll('aside .ant-menu-item a');
    const currentMenuNode = document.querySelector(
      'aside .ant-menu-item-selected a',
    );
    const currentIndex = Array.from(menuNodes).findIndex(
      (node) => node === currentMenuNode,
    );
    const prevNode =
      currentIndex - 1 >= 0 ? menuNodes[currentIndex - 1] : undefined;
    const nextNode =
      currentIndex + 1 < menuNodes.length
        ? menuNodes[currentIndex + 1]
        : undefined;
    const prev = prevNode
      ? {
        slug: prevNode.getAttribute('href') || undefined,
        title: prevNode.textContent || undefined,
      }
      : undefined;
    const next = nextNode
      ? {
        slug: nextNode.getAttribute('href') || undefined,
        title: nextNode.textContent || undefined,
      }
      : undefined;
    setPrevAndNext([prev, next]);
  }, []);
  return prevAndNext;
};

/**
 * i18n .umirc config
 * 如果是 object，则取 locale，否则直接用
 * @param v 
 */
export function ic(v: string | object) {
  const locale = useLocale();
  return icWithLocale(v, locale.id);
}

export function icWithLocale(v: string | object, locale) {
  return typeof v === 'object' ? get(v, [locale]) : v;
}