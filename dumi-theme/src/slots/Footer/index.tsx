import React from 'react';
import { default as RCFooter, FooterProps as RcFooterProps } from 'rc-footer';
import {
  GithubOutlined,
  TwitterOutlined,
} from '@ant-design/icons';
import classnames from 'classnames';
import { useLocale, FormattedMessage } from 'dumi';
import Popover from 'antd/lib/popover';
import 'rc-footer/assets/index.less';
import styles from './index.module.less';

interface FooterProps extends RcFooterProps {
  rootDomain?: string;
  language?: string;
  githubUrl?: string;
  /**
   * 是否为动态 footer
   */
  isDynamicFooter?: boolean;
}

/**
 * 底部菜单
 * @returns
 */
export const Footer: React.FC<FooterProps> = (props) => {
  const {
    columns,
    bottom,
    theme = 'dark',
    language,
    isDynamicFooter,
    rootDomain = '',
    className,
    ...restProps
  } = props;
  const locale = useLocale();
  const lang = locale.id;

  const getColumns = () => {
    const col1 = {
      title: 'Resources',
      items: [
        {
          icon: <TwitterOutlined />,
          title: 'Twitter',
          url: 'https://twitter.com/fury_community',
          openExternal: true,
        },
      ],
    };


    const col2 = {
      title: <FormattedMessage id="Help" />,
      items: [
        {
          icon: <GithubOutlined />,
          title: 'GitHub',
          url: 'https://github.com/alipay/fury',
          openExternal: true,
        },
      ],
    };

    return [col1, col2];
  };

  return (
    <RCFooter
      maxColumnsPerRow={5}
      theme={theme}
      columns={columns || getColumns()}
      className={classnames(styles.footer, className, {
        [styles.withMenu]: isDynamicFooter,
      })}
    />
  );
};
