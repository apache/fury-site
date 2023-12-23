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

  const apacheFooter = <div>
    <img
      src="/apache-incubator.svg" 
      alt="The Apache Software Foundation Incubator"
      width="256"
      style={{margin:10}}
    ></img>
    <p>
      Apache Fury is an effort undergoing incubation at The Apache Software Foundation (ASF), sponsored by the Apache Incubator.
      Incubation is required of all newly accepted projects until a further review indicates that the infrastructure, communications, 
      and decision making process have stabilized in a manner consistent with other successful ASF projects. 
      While incubation status is not necessarily a reflection of the completeness or stability of the code, 
      it does indicate that the project has yet to be fully endorsed by the ASF.
    </p>
    <p>
      Copyright © {new Date().getFullYear()} The Apache Software Foundation, Licensed under the Apache License, Version 2.0.<br/>
      Apache, the names of Apache projects, and the feather logo are either registered trademarks or trademarks of the Apache Software Foundation in the United States and/or other countries.
    </p>
  </div>

  return (
    <RCFooter
      maxColumnsPerRow={5}
      theme={theme}
      columns={columns || getColumns()}
      className={classnames(styles.footer, className, {
        [styles.withMenu]: isDynamicFooter,
      })}
      bottom={apacheFooter}
    />
  );
};
