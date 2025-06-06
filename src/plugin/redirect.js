export default function (context, options) {
  return {
    name: 'redirect-plugin',
    injectHtmlTags({content}) {
      return {
        headTags: [
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