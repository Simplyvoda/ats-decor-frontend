import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs/intro">
            Read the Docs
          </Link>
        </div>
      </div>
    </header>
  );
}

type FeatureCard = {
  title: string;
  description: string;
  to: string;
};

const cards: FeatureCard[] = [
  {
    title: 'Architecture',
    description:
      'Navigation, state management, and the API/services layer — how the app is actually put together.',
    to: '/docs/architecture/overview',
  },
  {
    title: 'Screens & Features',
    description:
      'Every screen and feature area, grouped and cross-referenced against the navigators and services that back them.',
    to: '/docs/screens/overview',
  },
  {
    title: 'Native Bridge Deep-Dive',
    description:
      'A ground-up, mechanism-level explanation of the React Native ↔ Swift bridge — how a prop, a command, and an event each actually cross that boundary.',
    to: '/docs/native-bridge/overview-and-mental-model',
  },
];

function HomepageCards() {
  return (
    <section className={styles.cards}>
      <div className="container">
        <div className="row">
          {cards.map((card) => (
            <div className="col col--4" key={card.title}>
              <Link to={card.to} className={styles.card}>
                <Heading as="h3">{card.title}</Heading>
                <p>{card.description}</p>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <HomepageHeader />
      <main>
        <HomepageCards />
      </main>
    </Layout>
  );
}
