import React, { useEffect } from "react";

const ensureDescriptionTag = () => {
  let tag = document.querySelector('meta[name="description"]');
  if (!tag) {
    tag = document.createElement('meta');
    tag.name = 'description';
    document.head.appendChild(tag);
  }
  return tag;
};

const PageMeta = ({ title, description }) => {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
    if (typeof description === 'string') {
      ensureDescriptionTag().setAttribute('content', description);
    }
  }, [title, description]);

  return null;
};

export const AppWrapper = ({ children }) => <>{children}</>;

export default PageMeta;
