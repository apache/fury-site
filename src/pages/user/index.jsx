import React from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";
import useIsBrowser from "@docusaurus/useIsBrowser";
import useBaseUrl from "@docusaurus/useBaseUrl";
import config from "./languages";
import "./index.css";
import companies from "./companies.json";
import nologo_companies from "./nologo_companies.json";
import Layout from "@theme/Layout";
import AOS from "aos";
import "aos/dist/aos.css";

export default function UserPage() {
  const isBrowser = useIsBrowser();
  const language =
    isBrowser && location.pathname.indexOf("/zh-CN/") === 0 ? "zh-CN" : "en";
  const dataSource = config?.[language];

  React.useEffect(() => {
    AOS.init({
      offset: 80,
      duration: 500,
      easing: "ease-out-quad",
      once: true,
    });
    window.addEventListener("load", AOS.refresh);
  }, []);

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
                {dataSource.common.ourUsers}
              </h3>
              <hr
                className="divider my-4 mx-auto"
                style={{ maxWidth: "10rem" }}
              ></hr>
              <div
                className="desc"
                dangerouslySetInnerHTML={{ __html: dataSource.common.tip }}
              ></div>
              <div className="user_case home_block">
                {companies.map((company, i) => (
                  <div
                    key={i}
                    data-aos="fade-up"
                    data-aos-delay={i * 50}
                    className="company-item"
                  >
                    <a
                      href={company.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="case_item case_hover">
                        <img
                          src={useBaseUrl("/" + company.imgUrl)}
                          alt={company.name}
                        />
                      </div>
                    </a>
                  </div>
                ))}
                {nologo_companies.map((company, i) => (
                  <div
                    key={i}
                    data-aos="fade-up"
                    data-aos-delay={i * 50}
                    className="company-item"
                  >
                    <a className="company_name ">
                      {" "}
                      <div className="case_item case_hover">{company.name}</div>
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
