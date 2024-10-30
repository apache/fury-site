import React, { useEffect } from "react";
import HomepageFeatures from "@site/src/pages/home/components/HomepageFeatures";
import AOS from "aos";
import "aos/dist/aos.css";
import HomePageLanguageCard from "./components/HomePageLanguageCard";
import HomepageCodeDisplay from "./components/HomepageCodeDisplay";
import HomepageFoot from "./components/HomepageFoot";
import HomepageHeader from "./components/HomepageHeader";


export default function Home() {
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
    </>
  );
};
