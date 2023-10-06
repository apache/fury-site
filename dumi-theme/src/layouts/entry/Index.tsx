import React from 'react';
import { useLocale, useSiteData, FormattedMessage } from 'dumi';
import { Header } from '../../slots/Header';
import { Features } from '../../slots/Features';
import { Cases } from '../../slots/Cases';
import { Companies } from '../../slots/Companies';
import { Footer } from '../../slots/Footer';
import size from 'lodash-es/size';
import { Detail } from '../../slots/Detail';

/**
 * Index 路由下的入口
 * - 获取数据
 * - 组合 slots 下的木偶组件
 */
export const Index = () => {
  const locale = useLocale()
  const { themeConfig } = useSiteData();  
  const {
    title, siteUrl, githubUrl,
    showSearch, showGithubCorner, showGithubStars, showLanguageSwitcher, defaultLanguage,
    versions, ecosystems, navs,
    detail, news, companies, features, cases, className,
    style,
    id
  } = themeConfig;

  const detailProps = {
    githubUrl,
    showGithubStars,
    news,
    ...detail,
  }

  const featuresProps = {
    features,
    className,
    style,
    id,
  }

  const casesProps = {
    cases, style, className
  }

  const metaTitle = detailProps.title
  
  return (
    <>
      <Header />
      { size(detail) ? <Detail { ...detailProps } /> : null }
      { size(cases) ? <Cases { ...casesProps } /> : null }
      { size(features) ? <Features { ...featuresProps } /> : null }
      { size(companies) ? <Companies title={<FormattedMessage id={ "感谢信赖"} />} companies={companies} /> : null }
      <Footer />
    </>
  );
};
