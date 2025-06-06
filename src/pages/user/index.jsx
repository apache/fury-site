import React from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";
import useIsBrowser from "@docusaurus/useIsBrowser";
import useBaseUrl from "@docusaurus/useBaseUrl";
import config from "./languages";
import "./index.css";
import companies from "./companies.json";
import nologo_companies from "./nologo_companies.json";
import Layout from "@theme/Layout";

export default function UserPage() {
  const isBrowser = useIsBrowser();
  const language =
    isBrowser && location.pathname.indexOf("/zh-CN/") === 0 ? "zh-CN" : "en";
  const dataSource = config?.[language];

  const ourUsers = dataSource.common.ourUsers;
  const tip = dataSource.common.tip;

  return (
    <Layout>
      <BrowserOnly>
        {() => (
          <div className="block user_page container">
            <div className="user-main" style={{ padding: "10px 0 30px" }}>
              <h3
                className="fs-2 mb-4 fw-bold text-center"
                style={{ padding: "10px 0 30px", textAlign: "center" }}
              >
                {ourUsers}
              </h3>
              <hr
                className="divider my-4 mx-auto"
                style={{ maxWidth: "10rem" }}
              ></hr>
              <div
                className="desc"
                dangerouslySetInnerHTML={{ __html: tip }}
              ></div>
              <div className="user_case home_block">
                {companies.map((item, i) => (
                  <div
                    key={i}
                    className="company-item"
                  >
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="case_item case_hover">
                        <img
                          src={useBaseUrl("/user/" + item.imgUrl)}
                          alt={item.name}
                        />
                      </div>
                    </a>
                  </div>
                ))}
                {nologo_companies.map((item, i) => (
                  <div
                    key={i}
                    className="company-item"
                  >
                    <a className="company_name ">
                      <div className="case_item case_hover">{item.name}</div>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </BrowserOnly>
    </Layout>
  );
}
