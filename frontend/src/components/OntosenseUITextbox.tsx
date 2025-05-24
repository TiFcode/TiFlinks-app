import React, { useState, useEffect } from 'react';

export interface WikipediaSuggestion {
  title: string;
  snippet: string;
  pageId: number;
}

interface OntosenseUITextboxProps {
  value: string;
  onChange: (value: string) => void;
  onSenseSelect?: (suggestion: WikipediaSuggestion | null) => void;
}

const fetchWikipediaSuggestions = async (query: string): Promise<WikipediaSuggestion[]> => {
  if (!query) return [];
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.query?.search || []).slice(0, 3).map((item: any) => ({
    title: item.title,
    snippet: item.snippet,
    pageId: item.pageid,
  }));
};

const OntosenseUITextbox: React.FC<OntosenseUITextboxProps> = ({ value, onChange, onSenseSelect }) => {
  const [suggestions, setSuggestions] = useState<WikipediaSuggestion[]>([]);
  const [selected, setSelected] = useState<WikipediaSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lastWord = words[words.length - 1] || '';

  useEffect(() => {
    if (lastWord.length === 0) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    fetchWikipediaSuggestions(lastWord)
      .then(setSuggestions)
      .finally(() => setLoading(false));
  }, [value]);

  const handleSelect = (s: WikipediaSuggestion) => {
    setSelected(s);
    if (onSenseSelect) onSenseSelect(s);
  };

  return (
    <div className="w-full max-w-xl mx-auto my-4">
      {suggestions.length > 0 && (
        <div className="mb-2 bg-gray-50 border rounded p-2">
          {loading && <div className="text-xs text-gray-400">Loading...</div>}
          {suggestions.map((s) => (
            <div
              key={s.pageId}
              className={`cursor-pointer p-1 rounded hover:bg-blue-100 ${selected?.pageId === s.pageId ? 'bg-blue-200 font-bold' : ''}`}
              onClick={() => handleSelect(s)}
            >
              <div className="text-sm">{s.title}</div>
              <div className="text-xs text-gray-500" dangerouslySetInnerHTML={{ __html: s.snippet }} />
            </div>
          ))}
        </div>
      )}
      <input
        type="text"
        className="border p-2 rounded w-full"
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setSelected(null);
          if (onSenseSelect) onSenseSelect(null);
        }}
        placeholder="Type here..."
      />
      {words.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {words.map((word, idx) => (
            <span
              key={idx}
              style={{
                display: 'inline-block',
                backgroundColor: word === lastWord ? '#10B981' : '#D1FAE5',
                color: word === lastWord ? '#FFFFFF' : '#065F46',
                border: word === lastWord ? '2px solid #047857' : '2px solid #A7F3D0',
                borderRadius: '9999px',
                padding: '2px 12px',
                fontSize: '0.875rem',
                fontWeight: '500',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              }}
              className={
                ''
              }
            >
              {word}
            </span>
          ))}
        </div>
      )}
      {selected && (
        <div className="mt-1 text-xs text-blue-700">Selected: {selected.title}</div>
      )}
    </div>
  );
};

export default OntosenseUITextbox; 