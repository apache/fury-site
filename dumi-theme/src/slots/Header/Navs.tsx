import React from 'react';
import cx from 'classnames';
import { isEqual, size } from 'lodash-es';
import { useLocale } from 'dumi';
import { Link } from 'react-router-dom';
import { Dropdown, Menu } from 'antd';
import { DownOutlined, LinkOutlined } from '@ant-design/icons';
import { getNavCategory } from './utils';
import styles from './index.module.less';

type dropdownItem = {
  name: {
    [key: string]: string;
  };
  url: string;
  target?: '_blank';
};

export type INav = {
  slug?: string;
  order: number;
  title: {
    [key: string]: string;
  };
  target?: '_blank';
  notPage?: boolean,
  dropdownItems?: dropdownItem[]
}

export type NavProps = {
  navs: INav[];
  path: string;
}

/**
 * Header 中的导航菜单
 */
export const Navs: React.FC<NavProps> = ({ navs, path }) => {
  const locale = useLocale();
  return (
    <>
      {navs.map((nav: INav) => {
        const title = nav.title[locale.id];
        let href = ''
        let className = ''
        if (nav.slug) {
          href = nav.slug.startsWith('http')
            ? nav.slug
            : ( locale.id === 'zh' ? `/zh/${nav.slug.replace('docs/', '')}` : `/${nav.slug.replace('docs/', '')}` );
          // 去除 docs  防止二次点击相同 nav 跳转出现04
          className = cx('header-menu-item-active', {
            [styles.activeItem]: getNavCategory(path) === getNavCategory(href)
          });
        }
        return (
          size(nav.dropdownItems) ? 
            (
          <li key={title} className={className}>
            <Dropdown
              className={styles.ecoSystems}
              placement="bottom"
              overlay={
                <Menu>
                  {nav.dropdownItems.map(({ name, url, target }) => {
                    const displayName = name[locale.id];
                    return (
                      <Menu.Item key={url}>
                        {target === '_blank' || url.startsWith('http') ? (
                          <a href={url} target="_blank" rel="noreferrer">
                            {displayName}
                            <LinkOutlined />
                          </a>
                        ) : (
                          <Link to={url}>{displayName}</Link>
                        )}
                      </Menu.Item>
                    );
                  })}
                </Menu>
              }
            >
              <span>
                {title}
                <DownOutlined />
              </span>
            </Dropdown>
          </li>
            )
            :
           ( <li key={title} className={className}>
            {nav.target === '_blank' || href.startsWith('http') ? (
              <a href={href} target='_blank' rel='noreferrer'>
                {title}
                <LinkOutlined />
              </a>
            ) : (
              <Link to={href}>{title}</Link>
            )}
          </li>
            )
          )
      })}
    </>
  );
};
