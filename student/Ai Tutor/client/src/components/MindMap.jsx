import { useMemo } from 'react';

// Parses the strict nested-bullet "mind map" the AI returns and draws it as a
// real branching map (central node → colour-coded branches → sub-branches with
// elbow connectors) instead of plain indented text.

// A rotating palette for the top-level branches. Each branch keeps its colour
// all the way down so the eye can follow a limb of the map.
const PALETTE = [
  { ring: '#2E86C1', bg: '#EAF2FB', text: '#1B4F72', line: '#AED1EC' },
  { ring: '#16A34A', bg: '#E9F8EF', text: '#14532D', line: '#B7E4C7' },
  { ring: '#D97706', bg: '#FEF4E6', text: '#7C4A03', line: '#F5D7A6' },
  { ring: '#9333EA', bg: '#F5ECFD', text: '#5B219E', line: '#DCC4F5' },
  { ring: '#DC2626', bg: '#FCEBEB', text: '#7F1D1D', line: '#F2B8B8' },
  { ring: '#0891B2', bg: '#E6F6FA', text: '#0E4F5C', line: '#A8E0EC' },
  { ring: '#DB2777', bg: '#FCEAF3', text: '#831843', line: '#F4B8D6' },
];

function stripMarkdown(text) {
  return String(text || '')
    .replace(/`/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^[•◦▪]/, '')
    .trim();
}

// Turn the bullet block into a tree using indentation depth.
function parseMindMap(markdown) {
  if (!markdown) return null;
  const lines = markdown.split('\n');
  const nodes = [];

  for (const raw of lines) {
    // Skip headings, blank lines, and the "## 🗺️ Mind Map" title itself.
    if (!raw.trim()) continue;
    if (/^\s*#{1,6}\s/.test(raw)) continue;
    const m = raw.match(/^(\s*)[-*]\s+(.*)$/);
    if (!m) continue;
    const label = stripMarkdown(m[2]);
    if (!label) continue;
    const indent = m[1].replace(/\t/g, '  ').length;
    nodes.push({ indent, label, children: [] });
  }

  if (nodes.length === 0) return null;

  // Build the tree from the flat, indentation-tagged list.
  const root = { label: null, children: [], indent: -1 };
  const stack = [root];
  for (const node of nodes) {
    while (stack.length > 1 && node.indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }
    stack[stack.length - 1].children.push(node);
    stack.push(node);
  }

  // If the AI produced a single top bullet, that's the central node.
  // Otherwise synthesise a central node holding all top-level bullets.
  if (root.children.length === 1) return root.children[0];
  return { label: null, children: root.children, indent: -1 };
}

function SubNode({ node, color, depth }) {
  const hasKids = node.children && node.children.length > 0;
  return (
    <div className="flex items-center">
      {/* elbow connector into this node */}
      <span
        className="flex-shrink-0"
        style={{ width: 18, height: 2, background: color.line }}
      />
      <div className="flex items-center">
        <div
          className="rounded-lg px-3 py-1.5 text-[12.5px] font-medium whitespace-nowrap shadow-sm"
          style={{
            background: depth === 1 ? color.bg : '#fff',
            color: color.text,
            border: `1px solid ${color.line}`,
          }}
        >
          {node.label}
        </div>
        {hasKids && (
          <div
            className="flex flex-col gap-2 pl-3 ml-1"
            style={{ borderLeft: `2px solid ${color.line}` }}
          >
            {node.children.map((child, i) => (
              <SubNode key={i} node={child} color={color} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MindMap({ markdown, fallback = null }) {
  const tree = useMemo(() => parseMindMap(markdown), [markdown]);

  if (!tree || !tree.children || tree.children.length === 0) return fallback;

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-center min-w-min py-4">
        {/* Central node */}
        <div className="flex-shrink-0">
          <div className="rounded-2xl px-5 py-3 text-white font-display font-bold text-[15px] text-center max-w-[200px] shadow-[0_12px_30px_-10px_rgba(46,134,193,0.6)] bg-gradient-to-br from-primary-500 to-primary-600">
            {tree.label || 'Mind Map'}
          </div>
        </div>

        {/* Trunk line into the branch column */}
        <span className="flex-shrink-0" style={{ width: 22, height: 2, background: '#CBD5E1' }} />

        {/* Branches */}
        <div className="flex flex-col gap-3 border-l-2 border-gray-200 pl-3">
          {tree.children.map((branch, i) => {
            const color = PALETTE[i % PALETTE.length];
            return <SubNode key={i} node={branch} color={color} depth={1} />;
          })}
        </div>
      </div>
    </div>
  );
}
