import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// Pictographic emojis/symbols to strip from output — keeps arrows (→), math
// operators, bullets and dashes intact so equations and mappings are unharmed.
const EMOJI_RE = /([\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0E}\u{FE0F}\u{200D}\u{20E3}])[ \t]*/gu;

// Clean + normalize model output before rendering:
//  • remove decorative emojis,
//  • normalize \( \) and \[ \] LaTeX delimiters to $ / $$ so remark-math
//    (KaTeX) renders them no matter which style the model used.
function cleanContent(s) {
  if (!s) return s;
  return s
    .replace(EMOJI_RE, '')
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => `\n$$${m.trim()}$$\n`)
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, m) => `$${m.trim()}$`);
}

function ImageRenderer({ src, alt }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) return null;

  return (
    <div className="my-3">
      {!loaded && (
        <div className="w-full h-40 bg-gray-50 rounded-xl animate-pulse flex items-center justify-center">
          <span className="text-xs text-gray-400">Loading image...</span>
        </div>
      )}
      <img
        src={src}
        alt={alt || 'illustration'}
        className={`rounded-xl max-w-full max-h-72 object-contain border border-gray-200 shadow-sm ${loaded ? '' : 'hidden'}`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
      {loaded && alt && (
        <p className="text-xs text-gray-400 mt-1 text-center italic">{alt}</p>
      )}
    </div>
  );
}

export default function ChatMarkdown({ content }) {
  return (
    <div className="chat-markdown text-sm text-gray-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          img: ({ src, alt }) => <ImageRenderer src={src} alt={alt} />,
        }}
      >
        {cleanContent(content)}
      </ReactMarkdown>
    </div>
  );
}
