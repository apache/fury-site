import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Apache Fory™',
  tagline: 'A blazingly-fast multi-language serialization framework for idiomatic domain objects, schema IDL, and cross-language data exchange',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://fory.apache.org/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  future: {
    v4: {
      removeLegacyPostBuildHeadAttribute: true,
    },
    faster: true,
  },
  i18n: {
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
    path: 'i18n',
    localeConfigs: {
      'en-US': {
        path: "en-US",
        label: 'English',
        htmlLang: 'en-US',
      },
      'zh-CN': {
        path: "zh-CN",
        label: '简体中文',
        htmlLang: 'zh-CN',
      },
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          // Internal security models and the retired shared image tree must not become website pages.
          exclude: ['security/**', 'images/**'],
          sidebarCollapsible: true,
          lastVersion: '1.6.0',
          versions: {
            current: {
              label: 'dev',
            },
            '0.13': {
              label: '0.13',
            },
            '0.12': {
              label: '0.12',
            },
            '0.11': {
              label: '0.11',
            },
            '0.10': {
              label: '0.10',
            },
          },
          sidebarPath: './sidebars.ts',
          editUrl: ({ locale, version, docPath }) => {
            var editUrl = "";
            if (locale === "en-US") {
              editUrl = `https://github.com/apache/fory-site/tree/main/docs/${docPath}`;
            } else if (locale === "zh-CN") {
              version = version === "current" ? "current" : "version-" + version
              editUrl = `https://github.com/apache/fory-site/tree/main/i18n/${locale}/docusaurus-plugin-content-docs/${version}/${docPath}`;
            } else {
              editUrl = `https://github.com/apache/fory-site/tree/main`
            }
            return editUrl;
          },
        },
        blog: {
          blogSidebarCount: 'ALL',
          blogSidebarTitle: 'All our posts',
          onUntruncatedBlogPosts: 'ignore',
          showReadingTime: true,
          editUrl: ({ blogPath, locale }) => {
            var editUrl = "";
            if (locale === "en-US") {
              editUrl = `https://github.com/apache/fory-site/tree/main/blog/${blogPath}`;
            } else if (locale === "zh-CN") {
              editUrl = `https://github.com/apache/fory-site/tree/main/i18n/${locale}/docusaurus-plugin-content-blog/${blogPath}`;
            } else {
              editUrl = `https://github.com/apache/fory-site/tree/main`
            }
            return editUrl;
          },
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  plugins: [
    require.resolve('docusaurus-lunr-search'),
    require.resolve('./src/plugin/redirect')
  ],

  themeConfig: {
    metadata: [
      { 'http-equiv': 'Content-Security-Policy', content: "frame-src 'self' https://ghbtns.com/;" },
      { property: 'og:image', content: 'https://fory.apache.org/img/logo.png' },
      { property: 'og:image:width', content: '1500' },
      { property: 'og:image:height', content: '1500' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:image', content: 'https://fory.apache.org/img/logo.png' },
    ],
    image: 'img/logo.png',
    navbar: {
      title: '',
      logo: {
        alt: 'Apache Fory™ Logo',
        src: 'img/fory-logo-light.png',
        srcDark: 'img/fory-logo-dark.png',
      },
      items: [
        // {
        //   type: 'docSidebar',
        //   sidebarId: 'tutorialSidebar',
        //   position: 'left',
        //   label: 'Tutorial',
        // },
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          type: 'docSidebar',
          sidebarId: 'specificationSidebar',
          position: 'left',
          label: 'Specification',
        },
        {
          type: 'docSidebar',
          sidebarId: 'communitySidebar',
          position: 'left',
          label: 'Community',
        },
        {
          to: '/user',
          label: 'Users',
          position: "left",
        },
        {
          position: 'left',
          to: '/download',
          label: 'Download',
        },
        { to: '/blog', label: 'Blog', position: 'left' },
        {
          type: 'dropdown',
          label: 'ASF',
          position: 'right',
          items: [
            {
              label: 'Foundation',
              to: 'https://www.apache.org/'
            },
            {
              label: 'License',
              to: 'https://www.apache.org/licenses/'
            },
            {
              label: 'Events',
              to: 'https://www.apache.org/events/current-event.html'
            },
            {
              label: 'Privacy',
              to: 'https://privacy.apache.org/policies/privacy-policy-public.html'
            },
            {
              label: 'Security',
              to: 'https://www.apache.org/security/'
            },
            {
              label: 'Sponsorship',
              to: 'https://www.apache.org/foundation/sponsorship.html'
            },
            {
              label: 'Thanks',
              to: 'https://www.apache.org/foundation/thanks.html'
            },
            {
              label: 'Code of Conduct',
              to: 'https://www.apache.org/foundation/policies/conduct.html'
            }
          ]
        },
        {
          type: 'docsVersionDropdown',
          position: 'right',
          dropdownActiveClassDisabled: true,
        },
        {
          href: 'https://github.com/apache/fory',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Community',
          items: [
            {
              label: 'Mailing list',
              href: 'https://lists.apache.org/list.html?dev@fory.apache.org',
            },
            {
              label: 'Slack',
              href: 'https://join.slack.com/t/fory-project/shared_invite/zt-1u8soj4qc-ieYEu7ciHOqA2mo47llS8A',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/ApacheFory',
            },
          ],
        },
        {
          title: 'Docs',
          items: [
            {
              label: 'Install',
              to: '/docs/start/',
            },
            {
              label: 'Usage',
              to: '/docs/start/',
            },
            {
              label: 'Benchmark',
              to: '/docs/benchmarks/',
            },
          ],
        },
        {
          title: 'Repositories',
          items: [
            {
              label: 'Apache Fory™',
              href: 'https://github.com/apache/fory',
            },
            {
              label: 'Website',
              href: 'https://github.com/apache/fory-site',
            },
          ],
        },
      ],
      logo: {
        width: 200,
        src: "/img/asf_logo.svg",
        href: "https://apache.org/",
        alt: "ASF Logo"
      },
      copyright: `<div>
      <p>
        Copyright © ${new Date().getFullYear()} The Apache Software Foundation, Licensed under the Apache License, Version 2.0. <br/>
        Apache Fory, Fory, Apache, the Apache Logo and the Apache Fory logo are either registered trademarks or trademarks of the Apache Software Foundation in the United States and/or other countries.
      </p>
      </div>`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["java", "javascript", "rust", "cpp", "c", "bash", "scala", "python", "protobuf", "json", "csharp", "dart"]
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
