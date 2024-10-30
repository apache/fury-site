import { useEffect } from "react";
import AOS from "aos";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import React from "react";
import Heading from "@theme/Heading";
import styles from "../css/index.module.css";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import Translate from "@docusaurus/Translate";

export const HomepageHeader = () => {
  const { siteConfig } = useDocusaurusContext();

  useEffect(() => {
    AOS.init({
      offset: 100,
      duration: 700,
      easing: "ease-out-quad",
      once: true,
    });
    window.addEventListener("load", AOS.refresh);
  }, []);

  return (
    <header
      className={clsx("hero hero--primary", styles.heroBanner)}
      data-aos="fade-up"
    >
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
          <Link
            className="button button--secondary button--lg"
            to="/docs/start/install"
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