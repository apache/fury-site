import { defineConfig } from 'dumi';

export default defineConfig({
  themeConfig: {
    name: 'home',
  },
  runtimePublicPath: {},
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
  scripts: [
    `
    if (window.location.hostname === 'alipay.github.io' ) {
      window.publicPath = '/fury-sites/';
    } else {
      window.publicPath = '/';
    }
    `
  ]
});
