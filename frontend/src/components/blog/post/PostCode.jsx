import React from "react";
import hljs from "highlight.js";
import 'highlight.js/styles/atom-one-dark.css'

export default function PostCode({ code, lang }) {
  const highlighted = hljs.highlight(code, { language: lang, ignoreIllegals: true });

  return (
    <pre className="hljs">
      <code
        className={`hljs ${lang}`}
        dangerouslySetInnerHTML={{ __html: highlighted.value }}
      />
    </pre>
  );
}
