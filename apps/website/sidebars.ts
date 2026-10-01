import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  installation: [
    {
      type: 'category',
      label: 'Installation',
      link: { type: 'doc', id: 'installation/index' },
      collapsible: false,
      items: ['installation/requirements', 'installation/desktop', 'installation/docker', 'installation/quick-start']
    }
  ],
  guides: [
    {
      type: 'category',
      label: 'Guides',
      link: { type: 'doc', id: 'guides/index' },
      collapsible: false,
      items: [
        'guides/getting-started',
        'guides/settings',
        'guides/common-patterns',
        'guides/businesses',
        'guides/banks',
        'guides/presets',
        'guides/clients',
        'guides/categories',
        'guides/units',
        'guides/currencies',
        'guides/items',
        'guides/style-profiles',
        'guides/layouts-screen',
        'guides/quotes',
        'guides/invoices',
        'guides/reports',
        'guides/e-invoices',
        'guides/LAYOUT',
        'guides/layouts/index'
      ]
    }
  ],
  development: [
    {
      type: 'category',
      label: 'Development',
      link: { type: 'doc', id: 'development/index' },
      collapsible: false,
      items: [
        'development/running-locally',
        'development/project-structure',
        'development/core-stack',
        'development/database-schema',
        'development/environment-variables',
        'development/contributing'
      ]
    }
  ]
};

export default sidebars;
