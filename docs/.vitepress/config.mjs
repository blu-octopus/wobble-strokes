import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'wobble svg',
  description: 'Variable-width hand-drawn SVG paths. Deterministic, dependency-free, web and React Native.',
  lang: 'en-US',
  cleanUrls: true,
  // Patched esbuild (via package overrides) rejects VitePress's old browser targets.
  vite: {
    build: {
      target: 'es2022',
    },
    esbuild: {
      target: 'es2022',
    },
  },
  head: [
    ['meta', { name: 'theme-color', content: '#f7f2ea' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'en' }],
    ['meta', { name: 'og:site_name', content: 'wobble svg' }],
    [
      'link',
      {
        rel: 'icon',
        href: 'https://blu-octopus.github.io/wobble-strokes/favicons/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
  ],
  themeConfig: {
    siteTitle: 'wobble svg',
    nav: [
      { text: 'Docs', link: '/getting-started' },
      { text: 'npm', link: 'https://www.npmjs.com/package/wobble-svg' },
      { text: 'GitHub', link: 'https://github.com/blu-octopus/wobble-strokes' },
    ],
    sidebar: [
      {
        text: 'Getting started',
        items: [
          { text: 'Install', link: '/getting-started#install' },
          { text: 'Quick start', link: '/getting-started#quick-start' },
          { text: 'Concepts', link: '/getting-started#concepts' },
        ],
      },
      {
        text: 'API',
        items: [
          { text: 'API reference', link: '/api' },
          { text: 'Examples', link: '/examples' },
        ],
      },
      {
        text: 'Reference',
        items: [
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
      message: 'MIT licensed.',
      copyright: 'Built for hand-drawn UI systems.',
    },
    editLink: {
      pattern: 'https://github.com/blu-octopus/wobble-strokes/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
    search: {
      provider: 'local',
    },
  },
})
