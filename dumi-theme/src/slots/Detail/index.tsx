import React, { useState, useEffect } from 'react';
import cx from 'classnames';
import gh from 'parse-github-url';
import GitHubButton from 'react-github-button';
import { useLocale } from 'dumi/dist/client/theme-api';

import { ic } from '../hooks';
import { IC } from '../../types';
import { News, NewsProps } from './News';

import styles from './index.module.less';

type DetailButtonProps = {
  text: IC;
  link: string;
  style?: React.CSSProperties;
  type?: string;
  shape?: 'round' | 'square';
}

type DetailProps = {
  className?: string;
  style?: React.CSSProperties;
  title: IC;
  description: IC;
  image?: string;
  buttons?: DetailButtonProps[];
  githubUrl: string;
  showGithubStars?: boolean;
  news: NewsProps[];
}


/**
 * Index.技术栈的描述区域！
 * 各自配置
 */
export const Detail: React.FC<DetailProps> = ({
  className,
  style,
  title,
  description,
  image,
  githubUrl,
  buttons = [],
  news,
}) => {
  const [remoteNews] = useState<NewsProps[]>([
    {
      "type": {
        "zh": "",
        "en": "Open Source"
      },
      "title": {
        "zh": "",
        "en": "at GitHub"
      },
      "date": "2023.07.12",
      "link": "https://github.com/alipay/fury"
    },
  ]);
  const lang = useLocale().id

  return (
    <section className={cx(styles.wrapper, className)} style={style}>
      <div className={styles.content}>
        <div className={styles.text}>
          <div className={cx(styles.title, 'detail-title')}>
            {ic(title)}
          </div>
          <div className={cx(styles.description, 'detail-description')}>
            {ic(description)}
          </div>
          {/** buttons  */}
          <div className={cx(styles.buttons, 'detail-buttons')}>
            {
              buttons.map(({ type, style, text, link, shape }) => {
                return (
                  <a
                    key={ic(text)}
                    className={cx(
                      styles.buttonLink,
                      styles[type || ''],
                      type === 'primary' ? 'primary-button' : 'common-button'
                    )}
                    style={{
                      borderRadius: shape === 'square' ? '4px' : '1000px',
                      ...style,
                    }}
                    href={link[lang] ? link[lang] : link}
                  >
                    <span className={styles.button}>{ic(text)}</span>
                  </a>
                )
              })
            }
          </div>
        </div>
        {/** 新闻公告 */}
        <div className={cx(styles.news, 'news')}>
          {
            (news || remoteNews).slice(0, 2).map((n, i) => (<News key={i} index={i} {...n} />))
          }
        </div>
        {/** image */}
        <div className={cx(styles.teaser, 'teaser')}>
          <div className={cx(styles.teaserimg, 'teaser-img')}>
            <img width="100%" style={{ marginLeft: '0px', marginTop: '0px', transform: 'scale(0.8)' }} src={image} />
          </div>
        </div>
        <img
          className={styles.backLeftBottom}
          src="https://gw.alipayobjects.com/zos/basement_prod/441d5eaf-e623-47cd-b9b9-2a581d9ce1e3.svg"
          alt="back"
        />
      </div>
    </section>
  );
};
