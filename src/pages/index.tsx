import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import HomepageFeatures from "@site/src/components/HomepageFeatures";
import Heading from "@theme/Heading";
import styles from "./index.module.css";
import Translate, { translate } from "@docusaurus/Translate";
import React from "react";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          <Translate id="homepage.hero.title">{siteConfig.title}</Translate>
        </Heading>
        <p className="hero__subtitle">
          <Translate id="homepage.hero.subtitle">
            {siteConfig.tagline}
          </Translate>
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="https://github.com/apache/fury"
          >
            <Translate
              id="homepage.githubButton"
              description="The GitHub button label on the homepage"
            >
              GitHub
            </Translate>
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/docs/start/install"
          >
            <Translate
              id="homepage.getStartedButton"
              description="The Get Started button label on the homepage"
            >
              Get Started
            </Translate>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <>
      <Layout
        title={`${siteConfig.title}`}
        description={translate({
          id: "homepage.metaDescription",
          message: siteConfig.tagline,
          description: "The meta description of the homepage",
        })}
      >
        <HomepageHeader />
        <main>
          <HomepageFeatures />
        </main>
      </Layout>
    </>
  );
}
