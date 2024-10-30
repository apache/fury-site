import React from "react";
import { Card } from "antd";
import useBaseUrl from "@docusaurus/useBaseUrl";

export const HomePageLanguageCard = () => {
  const locale = "zh-CN"; 

  const getLanguageUrl = (language) => {
    const baseUrl = locale === "zh-CN" 
      ? "https://fury.apache.org/zh-CN/docs/start/usage/#" 
      : "https://fury.apache.org/docs/start/usage/#";
    return `${baseUrl}${language}`;
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
          <img src={useBaseUrl("/home/java.svg")} style={imageStyle} alt="Java logo" />
          Java
        </Card.Grid>
        <Card.Grid
          style={gridStyle}
          onClick={() => {
            window.location.href = getLanguageUrl("python");
          }}
        >
          <img src={useBaseUrl("/home/python.svg")} style={imageStyle} alt="Python logo" />
          Python
        </Card.Grid>
        <Card.Grid
          style={gridStyle}
          onClick={() => {
            window.location.href = getLanguageUrl("golang");
          }}
        >
          <img src={useBaseUrl("/home/golang.svg")} style={imageStyle} alt="Golang logo" />
          Golang
        </Card.Grid>
        <Card.Grid
          style={gridStyle}
          onClick={() => {
            window.location.href = getLanguageUrl("javascript");
          }}
        >
          <img src={useBaseUrl("/home/JavaScript.svg")} style={imageStyle} alt="JavaScript logo" />
          JavaScript
        </Card.Grid>
        <Card.Grid
          style={gridStyle}
          onClick={() => {
            window.location.href = getLanguageUrl("rust");
          }}
        >
          <img src={useBaseUrl("/home/Rust.svg")} style={imageStyle} alt="Rust logo" />
          Rust
        </Card.Grid>
        <Card.Grid
          style={gridStyle}
          onClick={() => {
            window.location.href = getLanguageUrl("crosslanguage-serialization");
          }}
        >
          <img src={useBaseUrl("/home/more.svg")} style={imageStyle} alt="More languages" />
          More
        </Card.Grid>
      </Card>
    </div>
  );
};

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
