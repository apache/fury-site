import clsx from "clsx";
import Heading from "@theme/Heading";
import Translate from "@docusaurus/Translate";
import React from "react";

type FeatureItem = {
  title: React.ReactNode;
  Svg: React.ComponentType<React.ComponentProps<"svg">>;
  description: React.ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: (
      <Translate
        id="feature.highPerformance.title"
        description="The title for the high performance feature"
      >
        High performance
      </Translate>
    ),
    Svg: require("@site/static/img/performance.svg").default,
    description: (
      <Translate
        id="feature.highPerformance.description"
        description="Description for the high performance feature"
      >
        Compared to other serialization frameworks, there is a 20~170x speed up.
      </Translate>
    ),
  },
  {
    title: (
      <Translate
        id="feature.easyToUse.title"
        description="The title for the easy to use feature"
      >
        Easy to use
      </Translate>
    ),
    Svg: require("@site/static/img/happy.svg").default,
    description: (
      <Translate
        id="feature.easyToUse.description"
        description="Description for the easy to use feature"
      >
        No need for DSL, you can use Fory effectively with your intuition.
      </Translate>
    ),
  },
  {
    title: (
      <Translate
        id="feature.multiLanguages.title"
        description="The title for the multi-languages feature"
      >
        Multi-languages
      </Translate>
    ),
    Svg: require("@site/static/img/multi.svg").default,
    description: (
      <Translate
        id="feature.multiLanguages.description"
        description="Description for the multi-languages feature"
      >
        Supports popular programming languages such as Java, Python, C++,
        Golang, Javascript, Rust, and more will be added in the future.
      </Translate>
    ),
  },
];

const styles = {
  features: {
    display: "flex",
    alignItems: "center",
    padding: "2rem 0",
    width: "100%",
  },
  featureSvg: {
    height: "120px",
    width: "120px",
    fill: "var(--ifm-color-primary)",
  },
};

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <Svg style={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

const HomepageFeatures: React.FC = () => {
  return (
    <section style={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
};
export default HomepageFeatures;
