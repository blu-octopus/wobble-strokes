import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Wobble',
  description: 'Variable-width hand-drawn SVG paths. Deterministic, dependency-free, web and React Native.',
  lang: 'en-US',
  head: [
    ['meta', { name: 'theme-color', content: '#c2a783' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'en' }],
    ['meta', { name: 'og:site_name', content: 'Wobble' }],
  ],
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Wobble',
    nav: [
      { text: 'Docs', link: '/getting-started' },
      { text: 'API', link: '/api' },
      { text: 'Examples', link: '/examples' },
      { text: 'Roadmap', link: '/roadmap' },
      {
        text: 'Links',
        items: [
          { text: 'GitHub', link: 'https://github.com/blu-octopus/wobble-strokes' },
          { text: 'npm', link: 'https://www.npmjs.com/package/wobble-svg' },
        ],
      },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'API Reference', link: '/api' },
          { text: 'Examples', link: '/examples' },
          { text: 'FAQ', link: '/faq' },
          { text: 'Roadmap', link: '/roadmap' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/blu-octopus/wobble-strokes' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/wobble-svg' },
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 blu-octopus',
    },
    editLink: {
      pattern: 'https://github.com/blu-octopus/wobble-strokes/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
  markdown: {
    codeTransformers: [
      {
        preprocess(code) {
          return code
        },
      },
    ],
  },
})