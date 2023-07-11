import React from 'react';
import { ManualContent } from '../../slots/ManualContent';
import { Header } from '../../slots/Header';
import { Footer } from '../../slots/Footer';

export type ManualProps = {
  readonly children: any;
}

/**
 * Manual 路由下的入口
 */
export const Manual: React.FC<ManualProps> = ({ children }) => {
  return (
    <>
      <Header isHomePage={false} />
      <ManualContent> {children} </ManualContent>
    </>
  );
}
