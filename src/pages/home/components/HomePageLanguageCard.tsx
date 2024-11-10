import React, { useEffect, useState } from "react";
import { Card } from "antd";
import useBaseUrl from "@docusaurus/useBaseUrl";

export default function HomePageLanguageCard() {
  const [locale, setLocale] = useState("en-US");

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setLocale(navigator.language || "en-US");
    }
  }, []);

  const getLanguageUrl = (language: string) => {
    const baseUrl = locale.startsWith("zh-CN")
      ? "https://fury.apache.org/zh-CN/docs/start/usage/#"
      : "https://fury.apache.org/docs/start/usage/#";
    return `${baseUrl}${language}`;
  };

  const imageUrls = {
    java: useBaseUrl("/home/java.svg"),
    python: useBaseUrl("/home/python.svg"),
    golang: useBaseUrl("/home/golang.svg"),
    javascript: useBaseUrl("/home/JavaScript.svg"),
    rust: useBaseUrl("/home/Rust.svg"),
    more: useBaseUrl("/home/more.svg"),
  };

  return (
    <div>
      <style>{mediaQueryStyles}</style>
      <div style={{ textAlign: "center" }}>
        <h2>Quick Start!</h2>
        <p>Choose a language to get started.</p>
      </div>
      <Card
        style={{
          width: "60%",
          margin: "0 auto",
          borderRadius: "10px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Card.Grid
          className="grid-item"
          style={gridStyle}
          onClick={() => {
            window.location.href = getLanguageUrl("java-serialization");
          }}
        >
          <img src={imageUrls.java} style={imageStyle} alt="Java logo" />
          <span>Java</span>
        </Card.Grid>
        <Card.Grid
          className="grid-item"
          style={gridStyle}
          onClick={() => {
            window.location.href = getLanguageUrl("python");
          }}
        >
          <img src={imageUrls.python} style={imageStyle} alt="Python logo" />
          <span>Python</span>
        </Card.Grid>
        <Card.Grid
          className="grid-item"
          style={gridStyle}
          onClick={() => {
            window.location.href = getLanguageUrl("golang");
          }}
        >
          <img src={imageUrls.golang} style={imageStyle} alt="Golang logo" />
          <span>Golang</span>
        </Card.Grid>
        <Card.Grid
          className="grid-item"
          style={gridStyle}
          onClick={() => {
            window.location.href = getLanguageUrl("javascript");
          }}
        >
          <img
            src={imageUrls.javascript}
            style={imageStyle}
            alt="JavaScript logo"
          />
          <span>JavaScript</span>
        </Card.Grid>
        <Card.Grid
          className="grid-item"
          style={gridStyle}
          onClick={() => {
            window.location.href = getLanguageUrl("rust");
          }}
        >
          <img src={imageUrls.rust} style={imageStyle} alt="Rust logo" />
          <span>Rust</span>
        </Card.Grid>
        <Card.Grid
          className="grid-item"
          style={gridStyle}
          onClick={() => {
            window.location.href = getLanguageUrl(
              "crosslanguage-serialization"
            );
          }}
        >
          <img src={imageUrls.more} style={imageStyle} alt="More languages" />
          <span>More</span>
        </Card.Grid>
      </Card>
    </div>
  );
}

const gridStyle: React.CSSProperties = {
  width: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100px",
  textAlign: "center",
  border: "1px solid #f0f0f0",
  borderRadius: "10px",
  fontWeight: "bold",
  fontSize: "18px",
  cursor: "pointer",
};

//添加媒体查询
const mediaQueryStyles = `
  @media (max-width: 768px) {
    .grid-item {
      width: 100% !important;
    }
    .grid-item img {
      width: 28px !important;
      height: 28px !important;
    }
    .grid-item span {
      display: none !important; 
    }
  }
`;

const imageStyle: React.CSSProperties = {
  width: "38px",
  height: "38px",
  marginRight: "8px",
};
