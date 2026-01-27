import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  emoji: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Semantic Comparison',
    emoji: '🔍',
    description: (
      <>
        Compare values by meaning, not just characters. "Hello" equals "Hi"
        when you need semantic understanding.
      </>
    ),
  },
  {
    title: 'Natural Language Parsing',
    emoji: '📝',
    description: (
      <>
        Parse "twenty-five", "next Friday", and "yes please" into their
        proper types automatically.
      </>
    ),
  },
  {
    title: 'Intelligent Validation',
    emoji: '✅',
    description: (
      <>
        Validate data against semantic rules like "must be a valid email"
        or "must not contain profanity".
      </>
    ),
  },
  {
    title: 'Multi-Provider Support',
    emoji: '🤖',
    description: (
      <>
        Works with Google Gemini, OpenAI, and Anthropic Claude.
        Switch providers with a single line of code.
      </>
    ),
  },
  {
    title: 'Full TypeScript Support',
    emoji: '📦',
    description: (
      <>
        Complete TypeScript definitions with generics.
        Get full type safety and IntelliSense support.
      </>
    ),
  },
  {
    title: 'Comprehensive Types',
    emoji: '🧩',
    description: (
      <>
        Wrappers for all primitives plus Array, Object, Map, Set,
        Date, Error, Promise, URL, and more.
      </>
    ),
  },
];

function Feature({title, emoji, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <span style={{ fontSize: '4rem' }}>{emoji}</span>
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
