import React from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";

export default function HomepageFoot() {
  const catImageUrl = useBaseUrl("/home/cat.svg");
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
      <img src={catImageUrl} style={{ width: "100px", height: "100px" }} />
    </div>
  );
}
