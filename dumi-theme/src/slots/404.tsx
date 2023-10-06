import React from 'react';
import { HomeOutlined } from '@ant-design/icons';
import { Result, Button } from 'antd';
import { Link } from 'react-router-dom';

export const NotFound = () => (
  <>
    <Result
      status={'404' as any}
      title="404"
      subTitle="Sorry, the page you visited does not exist."
      extra={
        <Link to="/">
          <Button type="primary">
            <HomeOutlined />
            Back Home
          </Button>
        </Link>
      }
    />
  </>
);
