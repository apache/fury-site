import type { ISearchResult } from './SearchResult';

/**
 * dumi 搜索结果转页面 UI 的数据结构，默认取 30 条
 * @param dumiResult
 * @param limit
 * @returns 
 */
export function getSearchResults(dumiResults: any[], limit = 30): ISearchResult[] {
  const hints = dumiResults.map(r => r.hints).flat();

  return hints.slice(0, limit).map(({ pageTitle = '', highlightTitleTexts, highlightTexts, link }) => {
    return {
      link,
      subject: pageTitle,
      tilte: highlightTitleTexts,
      description: highlightTexts,
    };
  });
}