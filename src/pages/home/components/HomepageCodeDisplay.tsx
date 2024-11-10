import useBaseUrl from "@docusaurus/useBaseUrl";
import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function HomepageCodeDisplay() {
  const [copySuccess, setCopySuccess] = useState("");
  const codeString = `import java.util.List;
import java.util.Arrays;
import org.apache.fury.*;

public class Example {
  // Note that Fury instances should be reused between
  // multiple serializations of different objects.
  static ThreadSafeFury fury = Fury.builder().withLanguage(Language.JAVA)
    // Allow to deserialize objects unknown types,
    // more flexible but less secure.
    // .withSecureMode(false)
    .buildThreadSafeFury();

  static {
    // Registering types can reduce class name serialization
    // overhead but not mandatory.
    // If secure mode enabled
    //all custom types must be registered.
    fury.register(SomeClass.class);
  }

  public static void main(String[] args) {
    SomeClass object = new SomeClass();
    byte[] bytes = fury.serialize(object);
    System.out.println(fury.deserialize(bytes));
  }
}
  `;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(codeString).then(
      () => {
        setCopySuccess("Copied!");
        setTimeout(() => setCopySuccess(""), 2000); // 清除复制成功的提示
      },
      (err) => {
        setCopySuccess("Failed to copy!");
      }
    );
  };

  const programmingImageUrl = useBaseUrl("/home/programming.svg");
  
  //媒体查询
  const mediaQueryStyles = `
  @media (max-width: 768px) {
    .desktop-only {
      display: none !important;
    }
    .code-display {
      width: 100% !important;
    }
    .code-display pre {
      font-size: 8px !important; 
    } 
  }
  `;
  return (
    <>
      <style>{mediaQueryStyles}</style>
      <div
        style={{
          display: "flex",
          margin: "10%",
          borderRadius: "10px",
          flexDirection: "row",
        }}
      >
        <div
          className="desktop-only"
          style={{
            width: "50%",
            justifyContent: "flex-start",
            margin: "50px",
            height: "auto",
            display: "block",
          }}
        >
          <img src={programmingImageUrl} alt="programming-coding" />
        </div>
        <div
          className="code-display"
          style={{
            position: "relative",
            padding: "12px",
            justifyContent: "flex-end",
            backgroundColor: "#2d2d2d",
            borderRadius: "5px",
            width: "50%",
            height: "0 auto",
          }}
        >
          {/* 复制按钮 */}
          <button
            onClick={copyToClipboard}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              backgroundColor: "#444",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              padding: "5px 10px",
              cursor: "pointer",
            }}
          >
            {copySuccess ? copySuccess : "Copy"}
          </button>
          <SyntaxHighlighter
            language="java"
            style={dracula}
            showLineNumbers
            customStyle={{ fontSize: "12px" }}
          >
            {codeString}
          </SyntaxHighlighter>
        </div>
      </div>
    </>
  );
};
