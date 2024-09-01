import React, { useEffect } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import HomepageFeatures from "@site/src/components/HomepageFeatures";
import Heading from "@theme/Heading";
import styles from "./index.module.css";
import Translate, { translate } from "@docusaurus/Translate";
import AOS from "aos";
import "aos/dist/aos.css";
import PhotoSlider from "../components/PhotoSlider/PhotoSlider";

function HomepageHeader() {
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

export default function Home(): JSX.Element {
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
          <div data-aos="fade-up" data-aos-delay="600">
            <HomepageFeatures />
            <PhotoSlider />
          </div>
        </main>
      </Layout>
    </>
  );
}
