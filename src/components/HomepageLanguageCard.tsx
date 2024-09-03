import React from "react";
import { Card } from "antd";

export const HomepageLanguageCard = () => (
  <div>
    <div style={{ textAlign: "center" }}>
      <h2>Quick Start!</h2>
      <p>Choose a language to get started .</p>
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
          window.location.href =
            "https://fury.apache.org/docs/start/usage/#java-serialization";
        }}
      >
        <img src="..//java.svg" style={imageStyle} />
        Java
      </Card.Grid>
      <Card.Grid
        style={gridStyle}
        onClick={() => {
          window.location.href =
            "https://fury.apache.org/docs/start/usage/#python";
        }}
      >
        <img src="..//python.svg" style={imageStyle} />
        Python
      </Card.Grid>
      <Card.Grid
        style={gridStyle}
        onClick={() => {
          window.location.href =
            "https://fury.apache.org/docs/start/usage/#golang";
        }}
      >
        <img src="..//golang.svg" style={imageStyle} />
        Golang
      </Card.Grid>
      <Card.Grid
        style={gridStyle}
        onClick={() => {
          window.location.href =
            "https://fury.apache.org/docs/start/usage/#javascript";
        }}
      >
        <img src="..//JavaScript.svg" style={imageStyle} />
        JavaScript
      </Card.Grid>
      <Card.Grid
        style={gridStyle}
        onClick={() => {
          window.location.href =
            "https://fury.apache.org/docs/start/usage/#rust";
        }}
      >
        <img src="..//Rust.svg" style={imageStyle} />
        Rust
      </Card.Grid>
      <Card.Grid
        style={gridStyle}
        onClick={() => {
          window.location.href =
            "https://fury.apache.org/docs/start/usage/#crosslanguage-serialization";
        }}
      >
        <img src="..//more.svg" style={imageStyle} />
        More
      </Card.Grid>
    </Card>
  </div>
);

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
