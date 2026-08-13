import { useEffect, type ReactNode } from 'react';

export default function NotFoundContent(): ReactNode {
  useEffect(() => {
    // Docusaurus' catch-all route and missing-doc fallback both render this
    // theme slot; a src/pages/404.tsx file only creates a normal /404 route.
    window.location.replace('https://fory.apache.org/');
  }, []);

  return null;
}
