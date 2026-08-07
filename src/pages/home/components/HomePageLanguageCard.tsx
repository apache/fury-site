import React, { useEffect, useState } from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import "../css/tailwind.css";
import { imageUrls } from "../../../constants";
import styles from "../css/HomePageLanguageCard.module.css";
import Translate from "@docusaurus/Translate";

export default function HomePageLanguageCard() {
  const [locale, setLocale] = useState("en-US");
  const [processedImageUrls, setProcessedImageUrls] = useState([]);

  //用useBaseUrl处理一遍图像，防止本地资源不部署
  const processedImages = imageUrls.map((item) => ({
    ...item,
    src: useBaseUrl(item.src),
  }));

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setLocale(navigator.language || "en-US");
    }
    setProcessedImageUrls(processedImages);
  }, []);

  const getLanguageUrl = (language) => {
    const guidePaths = {
      java: "java",
      python: "python",
      golang: "go",
      javascript: "javascript",
      rust: "rust",
      more: "",
    };
    const baseUrl = locale.startsWith("zh-CN")
      ? "https://fory.apache.org/zh-CN/docs/object-serialization/"
      : "https://fory.apache.org/docs/object-serialization/";
    return `${baseUrl}${guidePaths[language]}/`;
  };

  return (
    <div className="text-center p-8">
      <h2 className="text-3xl font-bold mb-4 dark:text-white">
        <Translate
          id="homepage.quickStart.title"
          description="The title for the homepage quick start language picker"
        >
          Quick Start
        </Translate>
      </h2>
      <p className="text-lg mb-8 text-gray-600 dark:text-gray-400">
        <Translate
          id="homepage.quickStart.description"
          description="The description for the homepage quick start language picker"
        >
          Choose a runtime to open the matching quick start guide.
        </Translate>
      </p>
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 sm:grid-cols-1 gap-6">
          {processedImageUrls.map(({ key, src, label }) => (
            <div
              key={key}
              className={styles.languageCard}
              onClick={() =>
                (window.location.href = getLanguageUrl(key))
              }
            >
              <img
                src={src}
                className="w-16 h-16 mb-4"
                alt={`${label} logo`}
              />
              <span className="text-xl font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
