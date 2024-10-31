import React from "react";
import { Card } from "antd";
import useBaseUrl from "@docusaurus/useBaseUrl";
import BrowserOnly from "@docusaurus/BrowserOnly";

export default function HomePageLanguageCard() {
  return (
    <BrowserOnly>
      {() => {
        const locale = navigator.language || "en-US";

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
                style={gridStyle}
                onClick={() => {
                  window.location.href = getLanguageUrl("java-serialization");
                }}
              >
                <img src={imageUrls.java} style={imageStyle} alt="Java logo" />
                Java
              </Card.Grid>
              <Card.Grid
                style={gridStyle}
                onClick={() => {
                  window.location.href = getLanguageUrl("python");
                }}
              >
                <img
                  src={imageUrls.python}
                  style={imageStyle}
                  alt="Python logo"
                />
                Python
              </Card.Grid>
              <Card.Grid
                style={gridStyle}
                onClick={() => {
                  window.location.href = getLanguageUrl("golang");
                }}
              >
                <img
                  src={imageUrls.golang}
                  style={imageStyle}
                  alt="Golang logo"
                />
                Golang
              </Card.Grid>
              <Card.Grid
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
                JavaScript
              </Card.Grid>
              <Card.Grid
                style={gridStyle}
                onClick={() => {
                  window.location.href = getLanguageUrl("rust");
                }}
              >
                <img src={imageUrls.rust} style={imageStyle} alt="Rust logo" />
                Rust
              </Card.Grid>
              <Card.Grid
                style={gridStyle}
                onClick={() => {
                  window.location.href = getLanguageUrl(
                    "crosslanguage-serialization"
                  );
                }}
              >
                <img
                  src={imageUrls.more}
                  style={imageStyle}
                  alt="More languages"
                />
                More
              </Card.Grid>
            </Card>
          </div>
        );
      }}
    </BrowserOnly>
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
};
const imageStyle: React.CSSProperties = {
  width: "38px",
  height: "38px",
  marginRight: "8px",
};
