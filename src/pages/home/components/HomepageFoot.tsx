import React from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
export default function HomepageFoot() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100px",
      }}
    >
      <img
        src={useBaseUrl("/home/cat.svg")}
        style={{ width: "100px", height: "100px" }}
      />
    </div>
  );
}
