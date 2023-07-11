import React from 'react';
import { default as RCFooter, FooterProps as RcFooterProps } from 'rc-footer';
import {
  GithubOutlined,
  WeiboOutlined,
  SlackOutlined,
  TwitterOutlined,
  YoutubeOutlined,
  ZhihuOutlined,
  WechatOutlined,
  DingdingOutlined
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
          icon: <YoutubeOutlined />,
          title: 'Youtube',
          url: 'https://www.youtube.com/@FurySerialization',
          openExternal: true,
        },
        {
          icon: <TwitterOutlined />,
          title: 'Twitter',
          url: 'https://twitter.com/fury_community',
          openExternal: true,
        },
        {
          icon: <SlackOutlined />,
          title: 'Slack',
          url: 'https://join.slack.com/t/fury-project/shared_invite/zt-1u8soj4qc-ieYEu7ciHOqA2mo47llS8A',
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
        {
          icon: <Popover
            trigger="hover"
            content={
              <img width="100%" height="100%" src="/wechat.jpg" alt="wx-qrcode" />
            }
            title="微信扫一扫关注"
            overlayClassName="wx-qrcode-popover"
            overlayStyle={{ width: 128, height: 128 }}
            overlayInnerStyle={{ padding: 2 }}
          >
            <WechatOutlined />
          </Popover>,
          title: <Popover
            trigger="hover"
            content={
              <img width="100%" height="100%" src="/wechat.jpg" alt="wx-qrcode" />
            }
            title="微信扫一扫关注"
            overlayClassName="wx-qrcode-popover"
            overlayStyle={{ width: 128, height: 128 }}
            overlayInnerStyle={{ padding: 2 }}
          >
            Wechat
          </Popover>,
          url: '/wechat.jpg',
          openExternal: true,
        },
        {
          icon: <Popover
            trigger="hover"
            content={
              <img width="100%" height="100%" src="/dingtalk.png" alt="wx-qrcode" />
            }
            title="钉钉扫一扫关注"
            overlayClassName="wx-qrcode-popover"
            overlayStyle={{ width: 128, height: 128 }}
            overlayInnerStyle={{ padding: 2 }}
          >
            <DingdingOutlined />
          </Popover>,
          title: <Popover
            trigger="hover"
            content={
              <img width="100%" height="100%" src="/dingtalk.png" alt="wx-qrcode" />
            }
            title="钉钉扫一扫关注"
            overlayClassName="wx-qrcode-popover"
            overlayStyle={{ width: 128, height: 128 }}
            overlayInnerStyle={{ padding: 2 }}
          >Dingtalk</Popover>,
          url: '/dingtalk.png',
          openExternal: true,
        }
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
