import useBaseUrl from "@docusaurus/useBaseUrl";
import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  CODE_STRING,
  COPY_FAIL_MSG,
  COPY_SUCCESS_MSG,
  COPY_TIMEOUT,
} from "../../../constants";

export default function HomepageCodeDisplay() {
  const [copySuccess, setCopySuccess] = useState("");
  const programmingImageUrl = useBaseUrl("/home/programming.svg");

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(CODE_STRING)
      .then(() => {
        setCopySuccess(COPY_SUCCESS_MSG);
        setTimeout(() => setCopySuccess(""), COPY_TIMEOUT);
      })
      .catch((err) => {
        console.error("复制代码时出错:", err);
        setCopySuccess(COPY_FAIL_MSG);
      });
  };

  return (
    <div className="flex flex-col m-10 md:flex-row md:m-40 items-center justify-center">
      <div className="md:w-1/2 md:justify-start md:m-6 h-auto hidden md:block">
        <img
          src={programmingImageUrl}
          alt="programming-coding"
          className="w-full h-auto max-w-md max-h-md"
        />
      </div>
      <div className="relative bg-gray-800 rounded-md md:w-1/2 w-full">
        <button
          onClick={copyToClipboard}
          className="absolute top-2 right-2 bg-gray-600 text-white border-none rounded-md px-1 py-0.5 text-xs"
        >
          {copySuccess ? copySuccess : "Copy"}
        </button>
        <SyntaxHighlighter
          language="java"
          style={dracula}
          showLineNumbers
          customStyle={{ fontSize: "12px" }}
        >
          {CODE_STRING}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
