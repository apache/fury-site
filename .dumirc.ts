import { defineConfig } from 'dumi';

export default defineConfig({
  locales: [{ id: 'en', name: 'English' }],
  title: '',                                       
  favicons: ['/favicon.ico'], // 网站 favicon
  metas: [                                                              // 自定义 meta 标签  
    { name: 'keywords', content: 'fury' },
    { name: 'description', content: 'fury site' },
  ],
  logo: 'https://mdn.alipayobjects.com/huamei_s7kka1/afts/img/A*V_oxQYSTdLQAAAAAAAAAAAAADpJ-AQ/original',
  themeConfig: {
    title: '',
    description: 'Blazing Fast Binary Serialization',
    defaultLanguage: 'en',
    siteUrl: 'https://www.furyio.org',
    showSearch: true,                                                   // 是否显示搜索框
    showGithubCorner: true,                                             // 是否显示头部的 GitHub icon
    showGithubStars: true,                                              // 是否显示 GitHub star 数量
    showLanguageSwitcher: false,                                         // 是否显示官网语言切换
    showChartResize: true,                                              // 是否在 demo 页展示图表视图切换
    showAPIDoc: true,   
    githubUrl: 'https://github.com/alipay/fury',
    showSpecTab: true,                                                // 是否在 demo 页展示API文档
    es5: false,
    logo: {
      link: 'https://mdn.alipayobjects.com/huamei_s7kka1/afts/img/A*V_oxQYSTdLQAAAAAAAAAAAAADpJ-AQ/original',
    } as any,
    /**
     *  tips: 文档列表类型的路由导航(nav) 请以 docs/* 格式命名
     */
    navs: [                                                             // 头部的菜单列表
      {
        slug: 'docs/start/install',
        title: {
          zh: '',
          en: 'Start',
        },
        order: 2,
      },
      {
        slug: 'docs/introduction/introduction',
        title: {
          zh: '',
          en: 'Introduction',
        },
        order: 3,
      },
      {
        slug: 'docs/guide',
        title: {
          zh: '',
          en: 'Guide',
        },
        order: 4,
      },
      {
        slug: 'docs/blog',
        title: {
          zh: '',
          en: 'Blog',
        },
        order: 5,
      },
    ],
    docs: [
      {
        slug: 'start/',
        title: {
          zh: '',
          en: '',
        },
        order: 1,
      },
      {
        slug: 'introduction/',
        title: {
          zh: '',
          en: '',
        },
        order: 1,
      },
      {
        slug: 'guide/',
        title: {
          zh: '',
          en: '',
        },
        order: 1,
      },
      {
        slug: 'blog/',
        title: {
          zh: '',
          en: '',
        },
        order: 1,
      },
    ],
    /** 首页技术栈介绍 */
    detail: {
      title: {
        zh: '',
        en: 'Fury',
      },
      description: {
        zh: '',
        en: 'Fury is a blazing fast multi-language serialization framework powered by jit(just-in-time compilation) and zero-copy.',
      },
      image: 'https://mdn.alipayobjects.com/huamei_s7kka1/afts/img/A*7P08RJm4noUAAAAAAAAAAAAADpJ-AQ/original',
      buttons: [
        {
          text: {
            zh: '',
            en: 'Start',
          },
          link: `/start/install`,
          type: 'primary',
        },
        {
          text: {
            zh: '',
            en: 'Github',
          },
          link: `https://github.com/alipay/fury`,
        },
      ],
    },
    features: [
      {
        icon: 'https://mdn.alipayobjects.com/huamei_s7kka1/afts/img/A*TIgXS5t2NOAAAAAAAAAAAAAADpJ-AQ/original',
        title: {
          en: 'High performance',
        },
        description: {
          en: 'Compared to other serialization frameworks, there is a 20~170x speed up',
        },
      },
      {
        icon: 'https://mdn.alipayobjects.com/huamei_s7kka1/afts/img/A*8GF5QJxZ3UoAAAAAAAAAAAAADpJ-AQ/original',
        title: {
          en: 'Easy to use',
        },
        description: {
          en: 'No need for DSL, with your intuition, you can use Fury effectively',
        },
      },
      {
        icon: 'https://mdn.alipayobjects.com/huamei_s7kka1/afts/img/A*MDCKSLfeVPkAAAAAAAAAAAAADpJ-AQ/original',
        title: {
          en: 'Multi-languages',
        },
        description: {
          en: 'Supports mainstream programming languages, including Java/Python/C++/Golang/Javascript, and more languages will be added in the future',
        }
      },
    ],
    /** 首页案例 */
    cases: [
      {
        logo: 'https://mdn.alipayobjects.com/huamei_s7kka1/afts/img/A*lUa0RqV3srIAAAAAAAAAAAAADpJ-AQ/original',
        title: {
          en: 'Extremely fast deserialization',
        },
        description: {
          en: 'Base on efficient JIT, struct deserialization can get 170x speed up compared other serialization frameworks'
        },
        image: '/case2.png',
        link: '/introduction/benchmark#java-deserialization',
      },
      {
        logo: 'https://mdn.alipayobjects.com/huamei_s7kka1/afts/img/A*lUa0RqV3srIAAAAAAAAAAAAADpJ-AQ/original',
        title: {
          en: 'Extremely fast serialization',
        },
        description: {
          en: 'In deserialization scenarios, Fury can achieve a 100x speed up compared to traditional serialization frameworks. If you use Java clusters on a large scale, this will save a lot of computing resources'
        },
        image: '/case1.png',
        link: '/introduction/benchmark#java-serialization',
      },
    ],
    /** 首页合作公司 */
    companies: [
      // { name: '支付宝', img: 'https://gw.alipayobjects.com/mdn/rms_2274c3/afts/img/A*lYDrRZvcvD4AAAAAAAAAAABkARQnAQ', },
    ],
    // 代码编辑器设置
    editor: {
      size: 0.4,   // 代码区占比
      playgroundSize: 0.38, // 文档中的代码区占比
    }
  },
  // tnpm 安装的目录会导致 webpack 缓存快照 OOM，暂时禁用
  // 只有主题包开发需要用，其他技术栈使用的时候，不需要！
  chainWebpack(memo) { memo.delete('cache'); return memo },
  plugins: [],
  links: [
  ],
  scripts: [
  ],
});
