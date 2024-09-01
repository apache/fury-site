import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";

export const HomepageCodeDisplay = () => {
  const codeString = `import java.util.List;
import java.util.Arrays;
import io.fury.*;

public class Example {
  public static void main(String[] args) {
    SomeClass object = new SomeClass();
    // Note that Fury instances should be reused between
    // multiple serializations of different objects.
    Fury fury = Fury.builder().withLanguage(Language.JAVA)
      // Allow to deserialize objects unknown types,
      // more flexible but less secure.
      // .withSecureMode(false)
      .build();
    // Registering types can reduce class name serialization
    // overhead but not mandatory.
    // If secure mode enabled
    //all custom types must be registered.
    fury.register(SomeClass.class);
    byte[] bytes = fury.serialize(object);
    System.out.println(fury.deserialize(bytes));
  }
}
  `;

  return (
    <>
      <div
        style={{
          display: "flex",
          margin: "12%",
          borderRadius: "10px",
        }}
      >
        <div
          style={{
            width: "50%",
            justifyContent: "flex-start",
            margin: "50px",
            height: "auto",
          }}
        >
          <img src="/programming.svg" alt="programming-coding" />
        </div>
        <div
          style={{
            padding: "12px",
            justifyContent: "flex-end",
            backgroundColor: "#2d2d2d",
            borderRadius: "5px",
            width: "50%", 
            height: "auto", 
          }}
        >
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
