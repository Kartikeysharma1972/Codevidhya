import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

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
        {content}
      </ReactMarkdown>
    </div>
  );
}
