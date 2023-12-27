import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'High performance',
    Svg: require('@site/static/img/performance.svg').default,
    description: (
      <>
        Compared to other serialization frameworks, there is a 20~170x speed up.
      </>
    ),
  },
  {
    title: 'Easy to use',
    Svg: require('@site/static/img/happy.svg').default,
    description: (
      <>
        No need for DSL, you can use Fury effectively with your intuition.
      </>
    ),
  },
  {
    title: 'Multi-languages',
    Svg: require('@site/static/img/multi.svg').default,
    description: (
      <>
        Supports popular programming languages such as Java, Python, C++, Golang, Javascript, Rust, and more will be added in the future.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
