export interface IThemeConfig {
  [key: string]: any;
}

export type Status = 'responded' | 'error' | 'timeout';

/**
 * 配置文件中的国际化配置
 */
export type IC = string | {
  zh: string;
  en: string;
}

export interface TreeNode {
  /**
   * id
   */
  id: string;

  /**
   * 孩子节点 key
   */
  childrenKey?: string;

  /**
   * 标题（支持国际化）
   */
  title: {
    zh: string;
    en: string;
  };

  [key: string]: any;
}

/** 案例 DEMO */
export interface Demo extends TreeNode {
  /**
   * 截图
   */
  screenshot: string;

  /**
   * TypeScript 源码文件
   */
  source: string;

  /**
   * DEMO 代码文件名称
   */
  filename: string;

  /**
   * 衍生属性，通过 topic.id + example.id + demo.id 可以计算获取
   */
  relativePath?: string;

  /**
   * 是否为新品
   */
  isNew?: boolean;

  /**
   * 目标 example
   */
  targetExample?: Example;

  /**
   * 目标主题
   */
  targetTopic?: ExampleTopic;
}

/** 示例 */
export interface Example extends TreeNode {
  /**
   * 图标
   */
  icon: string;

  /**
   * DEMO
   */
  demos: Demo[];
}

/** 案例主题 */
export interface ExampleTopic extends TreeNode {
  /**
   * 图标
   */
  icon: string;

  /**
   * slug 和 id 一样，兼容旧配置
   */
  slug?: string;

  /**
   * 所有案例
   */
  examples: Example[];
}
