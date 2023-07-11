import insertCss from 'insert-css';

// 挂载一些全局变量
if (window) {
  (window as any).insertCss = insertCss;
}
