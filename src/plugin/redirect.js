export default function (context, options) {
  return {
    name: 'redirect-plugin',
    injectHtmlTags({content}) {
      return {
        headTags: [
          {
            tagName: 'meta',
            attributes: {
              'http-equiv':  'Content-Security-Policy',
              'content': `frame-src 'self' https://ghbtns.com/; img-src 'self' https://github.com/ data:;`
            }
          },
          {
            tagName: 'script',
            attributes: {
              type: 'text/javascript',
            },
            innerHTML: `
              if (window.location.host === 'fury.apache.org') {
                window.location.href = 'https://fory.apache.org';
              }
            `
          },
        ],
      };
    },
  };
}