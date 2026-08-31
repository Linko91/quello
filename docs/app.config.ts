export default defineAppConfig({
  // `violet` is the closest Nuxt UI palette to the brand's #7c5cff.
  ui: {
    colors: {
      primary: 'violet',
      neutral: 'zinc',
    },
  },
  site: {
    name: 'quello',
    description:
      'A visual element picker for AI coding agents. Click elements in your running app; quello writes them to .quello/picks.json so your agent knows exactly which component you mean.',
  },
  header: {
    title: 'quello',
    logo: { alt: 'quello', light: '/quello-logo.svg', dark: '/quello-logo.svg' },
  },
  // Only `github`, not `socials.github` — the footer concatenates both, so setting
  // the two produced a duplicate icon. This one also drives the header link and the
  // "Edit this page" / "Report an issue" links, which need branch and rootDir.
  github: {
    url: 'https://github.com/Linko91/quello',
    branch: 'main',
    rootDir: 'docs',
  },
  toc: {
    title: 'On this page',
  },
})
