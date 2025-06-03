import React from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Heading from "@theme/Heading";
import styles from "../css/index.module.css";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import Translate from "@docusaurus/Translate";
import useAOS from "../../../hooks/useAOS";

export default function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();

  useAOS();

  return (
    <header
      className={clsx("hero hero--primary", styles.heroBanner)}
      data-aos="fade-up"
    >
      <div className="container">
        {/* 页面标题 */}
        <Heading as="h1" className="hero__title">
          <Translate id="homepage.hero.title">{siteConfig.title}</Translate>
        </Heading>
        {/* 页面副标题 */}
        <p className="hero__subtitle">
          <Translate id="homepage.hero.subtitle">
            {siteConfig.tagline}
          </Translate>
        </p>
        <div className={styles.buttons}>
          {/* GitHub 按钮 */}
          <Link
            className="button button--secondary button--lg"
            to="https://github.com/apache/fury"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            <Translate
              id="homepage.githubButton"
              description="The GitHub button label on the homepage"
            >
              GitHub
            </Translate>
          </Link>
          {/* 开始使用按钮 */}
          <Link
            className="button button--secondary button--lg"
            to="/docs/docs/start/install"
            data-aos="fade-up"
            data-aos-delay="400"
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
