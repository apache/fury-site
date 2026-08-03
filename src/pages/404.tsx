import React, { useEffect } from "react";
import { useHistory } from "@docusaurus/router";

export default function NotFound() {
  const history = useHistory();
  useEffect(() => {
    const pathname = window.location.pathname;
    const locale =
      pathname.match(/^\/[a-z]{2}-[A-Z]{2}(?:\/|$)/)?.[0].replace(/\/$/, "") ??
      "";
    const docs = pathname.match(
      /^((?:\/[a-z]{2}-[A-Z]{2})?\/docs)(\/next)?(?:\/|$)/,
    );
    const start = docs
      ? `${docs[1]}${docs[2] ?? ""}/start`
      : `${locale}/docs/start`;
    history.replace(
      pathname === start || pathname === `${start}/` ? `${locale}/` : start,
    );
  }, [history]);
  return null;
}
