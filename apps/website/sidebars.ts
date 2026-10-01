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
      items: []
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
