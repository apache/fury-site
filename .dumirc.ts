import { defineConfig } from 'dumi';

export default defineConfig({
  themeConfig: {
    name: 'home',
  },
  runtimePublicPath: {},
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/'
});
