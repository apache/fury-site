import React from 'react';
import cx from 'classnames';
import { ic } from '../hooks';
import { IC } from '../../types';
import styles from './FeatureCard.module.less';

interface FeatureProps {
  icon: string;
  title: IC;
  description: string;
}

const FeatureCard: React.FC<FeatureProps> = ({ icon, title, description }) => {
  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <img
          className={cx(styles.icon, 'feature-logo')}
          src={icon}
          alt='advantage'
        />
        <p className={styles.title}>{ic(title)}</p>
        <p className={styles.description}>{ic(description)}</p>
      </div>
    </div>
  );
};

export default FeatureCard;
