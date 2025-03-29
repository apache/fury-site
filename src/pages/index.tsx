import React, { useEffect } from "react";
import Layout from "@theme/Layout";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import useIsBrowser from "@docusaurus/useIsBrowser";
import { translate } from "@docusaurus/Translate";
import HomepageHeader from "./home/components/HomepageHeader";
import HomepageFeatures from "./home/components/HomepageFeatures";
import HomePageLanguageCard from "./home/components/HomePageLanguageCard";
import HomepageCodeDisplay from "./home/components/HomepageCodeDisplay";
import HomepageFoot from "./home/components/HomepageFoot";
import useAOS from "../hooks/useAOS";

export default function App() {
  const isBrowser = useIsBrowser();
  const { siteConfig } = useDocusaurusContext();
  const pathname = isBrowser && window.location.pathname;

  const handleNavClass = () => {
    if (isBrowser) {
      try {
        const nav = document.getElementsByTagName("nav")[0];
        if (!nav) return;
        const classList = nav.classList;
        if (pathname === "/" || pathname === "/zh-CN/") {
          classList.add("index-nav");
        } else {
          classList.remove("index-nav");
        }
      } catch (error) {
        console.error("处理导航栏类名时出错:", error);
      }
    }
  };

  useEffect(() => {
    handleNavClass();
  }, [isBrowser, pathname]);

  useAOS();

  const metaDescription = translate({
    id: "homepage.metaDescription",
    message: siteConfig.tagline,
    description: "The meta description of the homepage",
  });

  return (
    <Layout title={`${siteConfig.title}`} description={metaDescription}>
      <main>
        <HomepageHeader />
        <div data-aos="fade-up" data-aos-delay="10">
          <HomepageFeatures />
        </div>
        <div data-aos="fade-up" data-aos-delay="10">
          <HomePageLanguageCard />
        </div>
        <div data-aos="fade-up" data-aos-delay="10">
          <HomepageCodeDisplay />
        </div>
        <div data-aos="fade-up" data-aos-delay="10">
          <HomepageFoot />
        </div>
      </main>
    </Layout>
  );
}
