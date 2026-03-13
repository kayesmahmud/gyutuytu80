'use client';

import { useEffect, useState } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  label?: string;
}

export default function TableOfContents({ content, label = 'Table of Contents' }: TableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([]);

  useEffect(() => {
    // Parse headings from HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = doc.querySelectorAll('h2, h3');

    const tocItems: TocItem[] = [];
    headings.forEach((heading, index) => {
      const id = heading.id || `heading-${index}`;
      tocItems.push({
        id,
        text: heading.textContent || '',
        level: parseInt(heading.tagName.charAt(1)),
      });
    });

    setItems(tocItems);
  }, [content]);

  if (items.length < 3) return null;

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="bg-gray-50 rounded-xl p-5 border border-gray-200 mb-8">
      <h2 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">{label}</h2>
      <ol className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item.id}
            className={item.level === 3 ? 'ml-4' : ''}
          >
            <button
              onClick={() => scrollTo(item.id)}
              className="text-sm text-gray-600 hover:text-rose-600 transition-colors text-left"
            >
              {item.text}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
