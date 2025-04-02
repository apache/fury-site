import React from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import "../css/tailwind.css";

export default function HomepageFoot() {
  const catImageUrl = useBaseUrl("/home/cat.svg");
  return (
    <div className="flex justify-center items-center w-full h-24">
      <img src={catImageUrl} className="w-24 h-24" />
    </div>
  );
}
