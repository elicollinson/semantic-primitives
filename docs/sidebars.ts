import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    'getting-started',
    'configuration',
    {
      type: 'category',
      label: 'Primitives',
      items: [
        'primitives/overview',
        'primitives/semantic-string',
        'primitives/semantic-number',
        'primitives/semantic-boolean',
        'primitives/semantic-bigint',
        'primitives/semantic-symbol',
        'primitives/semantic-null-undefined',
        'primitives/semantic-void',
      ],
    },
    {
      type: 'category',
      label: 'Types',
      items: [
        'types/overview',
        'types/semantic-array',
        'types/semantic-object',
        'types/semantic-map',
        'types/semantic-set',
        'types/semantic-record',
        'types/semantic-date',
        'types/semantic-error',
        'types/semantic-promise',
        'types/semantic-url',
        'types/semantic-fetch',
        'types/semantic-regexp',
        'types/semantic-tuple',
        'types/semantic-callable',
        'types/semantic-unknown-never',
      ],
    },
    'llm-client',
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/shared-types',
        'api/interfaces',
      ],
    },
  ],
};

export default sidebars;
