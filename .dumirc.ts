import { defineConfig } from 'dumi';

export default defineConfig({
  locales: [{ id: 'en', name: 'English' }, { id: 'zh', name: 'Chinese' }],
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
    siteUrl: {
      en: '/',
      zh: '/zh'
    },
    showSearch: true,                                                   // 是否显示搜索框
    showGithubCorner: true,                                             // 是否显示头部的 GitHub icon
    showGithubStars: true,                                              // 是否显示 GitHub star 数量
    showLanguageSwitcher: true,                                         // 是否显示官网语言切换
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
          zh: '开始',
          en: 'Start',
        },
        order: 2,
      },
      {
        slug: 'docs/introduction/introduction',
        title: {
          zh: '简介',
          en: 'Introduction',
        },
        order: 3,
      },
      {
        slug: 'docs/guide',
        title: {
          zh: 'Guide',
          en: 'Guide',
        },
        order: 4,
      },
      {
        slug: 'docs/blog',
        title: {
          zh: '博客',
          en: 'Blog',
        },
        order: 5,
      },
    ],
    navsCn: [                                                             // 头部的菜单列表
      {
        slug: 'docs/start/install',
        title: {
          zh: '开始',
          en: 'Start',
        },
        order: 2,
      },
      {
        slug: 'docs/introduction/introduction',
        title: {
          zh: '简介',
          en: 'Introduction',
        },
        order: 3,
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
        zh: 'Fury',
        en: 'Fury',
      },
      description: {
        zh: 'Fury是一个基于JIT动态编译和零拷贝的高性能多语言序列化框架',
        en: 'Fury is a blazing fast multi-language serialization framework powered by jit(just-in-time compilation) and zero-copy.',
      },
      image: 'https://mdn.alipayobjects.com/huamei_s7kka1/afts/img/A*7P08RJm4noUAAAAAAAAAAAAADpJ-AQ/original',
      buttons: [
        {
          text: {
            zh: '开始',
            en: 'Start',
          },
          link: {
            en: `/start/install`,
            zh: `zh/start/install`
          },
          type: 'primary',
        },
        {
          text: {
            zh: 'Github',
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
          zh: '高性能'
        },
        description: {
          en: 'Compared to other serialization frameworks, there is a 20~170x speed up',
          zh: '和其他序列号框架相比，实现了20~170倍加速'
        },
      },
      {
        icon: 'https://mdn.alipayobjects.com/huamei_s7kka1/afts/img/A*8GF5QJxZ3UoAAAAAAAAAAAAADpJ-AQ/original',
        title: {
          en: 'Easy to use',
          zh: '使用便捷'
        },
        description: {
          en: 'No need for DSL, with your intuition, you can use Fury effectively',
          zh: '无需DSL，开箱即用'
        },
      },
      {
        icon: 'https://mdn.alipayobjects.com/huamei_s7kka1/afts/img/A*MDCKSLfeVPkAAAAAAAAAAAAADpJ-AQ/original',
        title: {
          en: 'Multi-languages',
          zh: '多语言支持'
        },
        description: {
          en: 'Supports mainstream programming languages, including Java/Python/C++/Golang/Javascript/Rust, and more languages will be added in the future',
          zh: '支持主流编程语言，包括Java/Python/C++/Golang/Javascript/Rust等，更多语言将会在未来加入支持'
        }
      },
    ],
    /** 首页案例 */
    cases: [
      {
        logo: 'https://mdn.alipayobjects.com/huamei_s7kka1/afts/img/A*lUa0RqV3srIAAAAAAAAAAAAADpJ-AQ/original',
        title: {
          en: 'Extremely fast deserialization',
          zh: "极致反序列化性能"
        },
        description: {
          en: 'Base on efficient JIT, struct deserialization can get 170x speed up compared other serialization frameworks',
          zh: "基于JIT，struct反序列化相比其他框架能提升最多170倍"
        },
        image: '/case2.png',
        link: {
          en: '/introduction/benchmark#java-deserialization',
          zh: 'zh/introduction/benchmark#java-deserialization'
        },
      },
      {
        logo: 'https://mdn.alipayobjects.com/huamei_s7kka1/afts/img/A*lUa0RqV3srIAAAAAAAAAAAAADpJ-AQ/original',
        title: {
          en: 'Extremely fast serialization',
          zh: '超强序列化性能'
        },
        description: {
          en: 'In deserialization scenarios, Fury can achieve a 100x speed up compared to traditional serialization frameworks. If you use Java clusters on a large scale, this will save a lot of computing resources',
          zh: '在反序列化场景中，相比传统序列号框架Fury能最多提升100倍速度，如果你使用Java集群，可以节省很多计算资源'
        },
        image: '/case1.png',
        link: {
          en: '/introduction/benchmark#java-serialization',
          zh: 'zh/introduction/benchmark#java-serialization'
        },
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
