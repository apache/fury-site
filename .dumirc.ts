import { defineConfig } from 'dumi';

export default defineConfig({
  locales: [{ id: 'en', name: 'English' }],
  title: '',                                       
  favicons: ['/favicon.ico'], // 网站 favicon
  metas: [                                                              // 自定义 meta 标签  
    { name: 'keywords', content: 'fury' },
    { name: 'description', content: 'fury site' },
  ],
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
      link: '/logo.png',
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
        slug: 'docs/guide/guide',
        title: {
          zh: '',
          en: 'Guide',
        },
        order: 3,
      },
      {
        slug: 'docs/doc/crosslang',
        title: {
          zh: '',
          en: 'Doc',
        },
        order: 4,
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
        slug: 'guide/',
        title: {
          zh: '',
          en: '',
        },
        order: 1,
      },
      {
        slug: 'doc/',
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
      image: '/right.gif',
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
        icon: '/performance.svg',
        title: {
          en: 'High performance',
        },
        description: {
          en: 'Compared to other serial number methods in different scenarios, there is a 20~200 times speed up',
        },
      },
      {
        icon: '/happy.svg',
        title: {
          en: 'Ease to use',
        },
        description: {
          en: 'No need for DSL, with your intuition, you can use Fury effectively',
        },
      },
      {
        icon: '/multi.svg',
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
        logo: '/rocket.svg',
        title: {
          en: 'very high deserialization performance',
        },
        description: {
          en: 'Base on efficient JIT inlining, in struct deserialization scenarios, fury can achieve a 165x speed up compared to traditional serialization frameworks'
        },
        image: '/benchmarks/deserialization/bench_deserialize_STRUCT_from_directBuffer_time.png',
        link: '/guide/benchmark#java-deserialization',
      },
      {
        logo: '/rocket.svg',
        title: {
          en: 'very high serialization performance',
        },
        description: {
          en: 'In deserialization scenarios, Fury can achieve a 70x speed up compared to traditional serialization frameworks. If you use Java clusters on a large scale, this will save a lot of computing resources'
        },
        image: '/benchmarks/serialization/bench_serialize_STRUCT2_to_directBuffer_time.png',
        link: '/guide/benchmark#java-serialization',
      },
      {
        logo: '/rocket.svg',
        title: {
          en: 'high performance on Node.js',
        },
        description: {
          en: 'Code that extremely friendly to V8 improves performance by 15 times compared to JSON.parse and JSON.stringify'
        },
        image: '/benchmarks/javascript/complex_object.jpg',
        link: '/guide/benchmark#javascript',
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
