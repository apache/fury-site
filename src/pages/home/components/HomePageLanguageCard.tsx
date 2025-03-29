import React, { useEffect, useState } from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import "../css/tailwind.css";
import { imageUrls } from "../../../constants";

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
    const baseUrl = locale.startsWith("zh-CN")
      ? "https://fury.apache.org/zh-CN/docs/start/usage/#"
      : "https://fury.apache.org/docs/start/usage/#";
    return `${baseUrl}${language}`;
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-5">Quick Start!</h2>
      <p className="text-lg mb-5">Choose a language to get started.</p>
      <div className="w-3/5 mx-auto rounded-md">
        <div className="grid md:grid-cols-2 sm:grid-cols-1 min-w-0 border-gray-400 rounded-md">
          {processedImageUrls.map(({ key, src, label }) => (
            <div
              key={key}
              className="flex items-center justify-center h-24 text-lg font-bold border border-gray-400 rounded-md cursor-pointer transition-transform duration-300 transform hover:scale-105 active:scale-100 hover:bg-gray-100 hover:border-gray-200"
              onClick={() =>
                (window.location.href = getLanguageUrl(
                  key === "java"
                    ? "java-serialization"
                    : key === "more"
                    ? "crosslanguage-serialization"
                    : key
                ))
              }
            >
              <img src={src} className="w-10 h-10 mr-2" alt={`${label} logo`} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
