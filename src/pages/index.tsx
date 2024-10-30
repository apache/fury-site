import React, { useEffect } from "react";
import Layout from "@theme/Layout";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import useIsBrowser from "@docusaurus/useIsBrowser";
import Home from "./home";
import { translate } from "@docusaurus/Translate";

export default function () {
  const isBrowser = useIsBrowser();
  const { siteConfig } = useDocusaurusContext();

  const pathname = isBrowser && location.pathname;

  useEffect(() => {
    if (isBrowser) {
      const nav = document.getElementsByTagName("nav")[0];
      const classList = nav && nav.classList;
      if (!classList) return;
      if (pathname === "/" || pathname === "/zh-CN/") {
        classList.add("index-nav");
      } else {
        classList.remove("index-nav");
      }
    }
  }, [isBrowser, pathname]);

  return (
    <Layout
      title={`${siteConfig.title}`}
      description={translate({
        id: "homepage.metaDescription",
        message: siteConfig.tagline,
        description: "The meta description of the homepage",
      })}
    >
      <main>
        <Home />
      </main>
    </Layout>
  );
}
