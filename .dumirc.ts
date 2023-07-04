import { defineConfig } from 'dumi';

export default defineConfig({
  themeConfig: {
    name: '',
    footer: false,
    socialLinks: {
      github: 'https://github.com/alipay/fury',
    },
  },
  favicons: [
    '/favicon.ico'
  ],
  locales: [
    { id: 'en-US', name: 'EN' },
    { id: 'zh-CN', name: '中文' },
  ],
  logo: "/logo.png",
  runtimePublicPath: {},
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
});
