import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

const repositoryUrl = 'https://github.com/piratuks/invoice-builder';

const config: Config = {
  title: 'Invoice Builder',
  tagline:
    'Offline-first, open-source invoicing for freelancers and small businesses who want full control of their data.',
  favicon: 'img/icon.png',
  url: 'https://piratuks.github.io',
  baseUrl: '/invoice-builder/',
  stylesheets: [
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Roboto:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap'
  ],
  trailingSlash: true,
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  future: { v4: true },
  i18n: { defaultLocale: 'en', locales: ['en'] },
  markdown: {
    format: 'detect',
    hooks: { onBrokenMarkdownLinks: 'throw', onBrokenMarkdownImages: 'throw' }
  },
  customFields: { repositoryUrl },
  organizationName: 'piratuks',
  projectName: 'Invoice Builder',
  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: 'filename',
        docsDir: '../../docs',
        docsRouteBasePath: 'docs',
        indexBlog: false,
        highlightSearchTermsOnTargetPage: true
      }
    ]
  ],
  presets: [
    [
      'classic',
      {
        docs: {
          path: '../../docs',
          routeBasePath: 'docs',
          sidebarPath: './sidebars.ts',
          showLastUpdateTime: true
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' }
      } satisfies Preset.Options
    ]
  ],
  themeConfig: {
    image: 'img/invoice-form.jpg',
    colorMode: { defaultMode: 'dark', disableSwitch: false, respectPrefersColorScheme: false },
    navbar: {
      title: 'Invoice Builder',
      logo: { alt: '', src: 'img/icon.png' },
      style: 'dark',
      items: [
        { type: 'docSidebar', sidebarId: 'installation', label: 'Installation', position: 'left' },
        { type: 'docSidebar', sidebarId: 'guides', label: 'Guides', position: 'left' },
        { type: 'docSidebar', sidebarId: 'development', label: 'Development', position: 'left' },
        { to: '/docs/changelog/', label: 'Changelog', position: 'left' },
        { href: repositoryUrl, position: 'right', className: 'navbar__github', 'aria-label': 'GitHub repository' }
      ]
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            { label: 'Installation', to: '/docs/installation/' },
            { label: 'Getting started', to: '/docs/guides/' },
            { label: 'Development', to: '/docs/development/' },
            { label: 'Changelog', to: '/docs/changelog/' }
          ]
        },
        {
          title: 'Legal',
          items: [
            { label: 'Licence', href: `${repositoryUrl}/blob/main/LICENSE` },
            { label: 'Privacy Policy', to: '/docs/privacy-policy' },
            { label: 'Terms of Use', to: '/docs/terms-of-use' }
          ]
        },
        {
          title: 'Project',
          items: [
            { label: 'Features', to: '/#features' },
            { label: 'Releases', href: `${repositoryUrl}/releases` },
            { label: 'Issues', href: `${repositoryUrl}/issues` },
            { label: 'Discussions', href: `${repositoryUrl}/discussions` },
            { label: 'Source code', href: repositoryUrl },
            { label: 'Supporters', to: '/docs/supporters' },
            { label: 'Contact us', href: 'https://github.com/piratuks' }
          ]
        }
      ],
      copyright: `© Invoice Builder · MIT.`
    },
    prism: { theme: prismThemes.github, darkTheme: prismThemes.dracula, additionalLanguages: ['json', 'bash'] }
  } satisfies Preset.ThemeConfig
};

export default config;
