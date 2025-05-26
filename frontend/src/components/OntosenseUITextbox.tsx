import React, { useState, useEffect } from 'react';
import type { InformationUnitDto } from '../types/InformationUnitDto';
import type { LinkDto } from '../types/LinkDto';
import { v4 as uuidv4 } from 'uuid';

export interface WikipediaSuggestion {
  title: string;
  snippet: string;
  pageId: number;
}

interface Attribute {
  name: string;
  values: string[];
}

interface SelectedAttributes {
  [attributeName: string]: string;
}

// Mock data for attributes and values - in a real app, this would come from an API
const getAttributesForWord = (word: string): Attribute[] => {
  const attributesMap: { [key: string]: Attribute[] } = {
    'HDD': [
      { name: 'rotation speed', values: ['5400', '7200', '10000'] },
      { name: 'capacity', values: ['500GB', '1TB', '2TB'] },
      { name: 'interface', values: ['SATA', 'SAS', 'NVMe'] }
    ],
    'CPU': [
      { name: 'cores', values: ['2', '4', '8'] },
      { name: 'frequency', values: ['2.4GHz', '3.0GHz', '3.6GHz'] },
      { name: 'cache', values: ['4MB', '8MB', '16MB'] }
    ],
    'RAM': [
      { name: 'capacity', values: ['4GB', '8GB', '16GB'] },
      { name: 'type', values: ['DDR3', 'DDR4', 'DDR5'] },
      { name: 'speed', values: ['2400MHz', '3200MHz', '4800MHz'] }
    ]
  };
  
  return attributesMap[word] || [];
};

interface OntosenseUITextboxProps {
  value: string;
  onChange: (value: string) => void;
  onSenseSelect?: (suggestion: WikipediaSuggestion | null) => void;
  onAttributesSelect?: (word: string, attributes: SelectedAttributes) => void;
  onInformationUnitsChange?: (units: InformationUnitDto[], links: LinkDto[]) => void;
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

const OntosenseUITextbox: React.FC<OntosenseUITextboxProps> = ({ value, onChange, onSenseSelect, onAttributesSelect, onInformationUnitsChange }) => {
  const [suggestions, setSuggestions] = useState<WikipediaSuggestion[]>([]);
  const [wordSenses, setWordSenses] = useState<{ [word: string]: WikipediaSuggestion | null }>({});
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<{ [word: string]: SelectedAttributes }>({});
  const [informationUnits, setInformationUnits] = useState<{ [word: string]: InformationUnitDto }>({});
  const [links, setLinks] = useState<LinkDto[]>([]);
  const [meanings, setMeanings] = useState<any[]>([]);
  const [loadingMeanings, setLoadingMeanings] = useState(false);
  const words = (() => {
    const result: string[] = [];
    let currentWord = '';
    let insideQuotes = false;
    
    for (let i = 0; i < value.length; i++) {
      const char = value[i];
      
      if (char === '"') {
        if (insideQuotes) {
          // End of quoted phrase
          if (currentWord) {
            result.push(currentWord);
            currentWord = '';
          }
        }
        insideQuotes = !insideQuotes;
      } else if (char === ' ' && !insideQuotes) {
        // Space outside quotes - end of word
        if (currentWord) {
          result.push(currentWord);
          currentWord = '';
        }
      } else {
        // Add character to current word
        currentWord += char;
      }
    }
    
    // Add the last word if there is one
    if (currentWord) {
      result.push(currentWord);
    }
    
    return result.filter(Boolean);
  })();
  const currentWordForSuggestions = activeWord || words[words.length - 1] || '';

  // Only persist finalized pills (not the current word being typed)
  const isFinalized = value.endsWith(' ') || value.endsWith('"');
  const finalizedWords = isFinalized ? words : words.slice(0, -1);

  useEffect(() => {
    if (currentWordForSuggestions.length === 0) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    fetchWikipediaSuggestions(currentWordForSuggestions)
      .then(setSuggestions)
      .finally(() => setLoading(false));
  }, [currentWordForSuggestions]);

  // Helper function to save changes
  const saveChanges = async (newUnits: InformationUnitDto[], newLinks: LinkDto[], removedUnitIds: string[] = []) => {
    if (onInformationUnitsChange) {
      // Filter out any units that are being updated
      const existingUnits = Object.values(informationUnits).filter(
        existingUnit => !newUnits.some(newUnit => newUnit.id === existingUnit.id) &&
                       !removedUnitIds.includes(existingUnit.id)
      );
      onInformationUnitsChange(
        [...existingUnits, ...newUnits],
        [...links, ...newLinks]
      );

      // Persist all units (POST for new, PUT for existing)
      await Promise.all(newUnits.map(async unit => {
        const dto = {
          id: unit.id,
          title: unit.content,
          content: unit.content,
          type: unit.type === 'PILL' ? 0 : (unit.type === 'SENSE' ? 1 : 2)
        };
        if (unit.id && typeof unit.id === 'string' && unit.id.length === 36) {
          // Looks like a UUID, try PUT
          await fetch(`http://localhost:5121/api/InformationUnits/${unit.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dto)
          });
        } else {
          // No id, create new
          const res = await fetch('http://localhost:5121/api/InformationUnits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dto)
          });
          const created = await res.json();
          unit.id = created.id;
        }
      }));

      // Persist all links (POST for new, PUT for existing)
      await Promise.all(newLinks.map(async link => {
        const dto = {
          id: link.id,
          sourceId: link.sourceId,
          targetId: link.targetId,
          linkTypeId: link.type === 'Semantic Reference' ? 2 : 1,
          description: link.metadata?.attributeName || ''
        };
        if (link.id && typeof link.id === 'string' && link.id.length === 36) {
          // Looks like a UUID, try PUT
          await fetch(`http://localhost:5121/api/Links/${link.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dto)
          });
        } else {
          // No id, create new
          const res = await fetch('http://localhost:5121/api/Links', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dto)
          });
          const created = await res.json();
          link.id = created.id;
        }
      }));
    }
  };

  // Load existing units and links on mount
  useEffect(() => {
    // Fetch information units
    fetch('http://localhost:5121/api/InformationUnits')
      .then(response => response.json())
      .then(data => {
        const units: { [key: string]: InformationUnitDto } = {};
        data.forEach((unit: any) => {
          const type = unit.type === 0 ? 'PILL' : (unit.type === 1 ? 'SENSE' : 'ATTRIBUTE');
          units[unit.title] = {
            id: unit.id.toString(),
            type,
            content: unit.content,
            attributes: {}
          };
        });
        setInformationUnits(units);
      })
      .catch(error => console.error('Error fetching units:', error));

    // Fetch links
    fetch('http://localhost:5121/api/Links')
      .then(response => response.json())
      .then(data => {
        const links: LinkDto[] = data.map((link: any) => ({
          id: link.id.toString(),
          sourceId: link.sourceId.toString(),
          targetId: link.targetId.toString(),
          type: link.linkTypeId === 2 ? 'Semantic Reference' : 'HAS_ATTRIBUTE',
          metadata: {
            attributeName: link.description
          }
        }));
        setLinks(links);
      })
      .catch(error => console.error('Error fetching links:', error));
  }, []);

  // Create information units for new finalized pills
  useEffect(() => {
    const newUnits: InformationUnitDto[] = [];
    const newLinks: LinkDto[] = [];

    finalizedWords.forEach(word => {
      if (!informationUnits[word]) {
        const pillUnit: InformationUnitDto = {
          id: uuidv4(),
          type: 'PILL',
          content: word,
          attributes: {}
        };
        newUnits.push(pillUnit);
      }
    });

    // Update state with new units
    if (newUnits.length > 0) {
      const updatedUnits = { ...informationUnits };
      newUnits.forEach(unit => {
        updatedUnits[unit.content] = unit;
      });
      setInformationUnits(updatedUnits);
      saveChanges(newUnits, newLinks);
    }
  }, [finalizedWords, informationUnits, links, onInformationUnitsChange]);

  const handleSelect = (s: WikipediaSuggestion) => {
    if (activeWord) {
      setWordSenses(prev => ({ ...prev, [activeWord]: s }));
      if (onSenseSelect) onSenseSelect(s);

      // Find and remove old sense units and links
      const oldSenseLinks = links.filter(link => 
        link.sourceId === informationUnits[activeWord]?.id && 
        link.type === 'Semantic Reference'
      );
      
      const oldSenseUnitIds = oldSenseLinks.map(link => link.targetId);
      
      // Remove old links
      const updatedLinks = links.filter(link => 
        !(link.sourceId === informationUnits[activeWord]?.id && 
          link.type === 'Semantic Reference')
      );
      
      // Remove old sense units
      const updatedUnits = { ...informationUnits };
      oldSenseUnitIds.forEach(id => {
        const unitToRemove = Object.values(updatedUnits).find(u => u.id === id);
        if (unitToRemove) {
          delete updatedUnits[unitToRemove.content];
        }
      });

      // Create or update sense information unit
      const senseUnit: InformationUnitDto = {
        id: uuidv4(),
        type: 'SENSE',
        content: s.title,
        metadata: {
          pageId: s.pageId,
          snippet: s.snippet
        }
      };

      // Update existing pill information unit
      const pillUnit: InformationUnitDto = {
        id: informationUnits[activeWord]?.id,
        type: 'PILL',
        content: activeWord,
        attributes: selectedAttributes[activeWord] || {}
      };

      // Create link between pill and sense
      const senseLink: LinkDto = {
        id: uuidv4(),
        sourceId: pillUnit.id,
        targetId: senseUnit.id,
        type: 'Semantic Reference',
        metadata: {
          attributeName: 'sense'
        }
      };

      // Update state with new units and links
      const finalUnits = { 
        ...updatedUnits, 
        [activeWord]: pillUnit,
        [s.title]: senseUnit
      };
      const finalLinks = [...updatedLinks, senseLink];
      
      setInformationUnits(finalUnits);
      setLinks(finalLinks);
      
      // Save changes after state is updated
      saveChanges([pillUnit, senseUnit], [senseLink], oldSenseUnitIds);
    }
  };

  const handlePillClick = (word: string) => {
    setActiveWord(word);
    setSuggestions([]);
  };

  const handleAttributeValueSelect = (word: string, attributeName: string, value: string) => {
    setSelectedAttributes(prev => {
      const newAttributes = {
        ...prev,
        [word]: {
          ...(prev[word] || {}),
          [attributeName]: value
        }
      };
      if (onAttributesSelect) {
        onAttributesSelect(word, newAttributes[word]);
      }
      return newAttributes;
    });

    // Create or update attribute and value information units
    const attributeUnit: InformationUnitDto = {
      id: uuidv4(),
      type: 'ATTRIBUTE',
      content: attributeName,
      metadata: {
        parentId: informationUnits[word]?.id
      }
    };

    const valueUnit: InformationUnitDto = {
      id: uuidv4(),
      type: 'VALUE',
      content: value,
      metadata: {
        parentId: attributeUnit.id
      }
    };

    // Create links
    const attributeLink: LinkDto = {
      id: uuidv4(),
      sourceId: informationUnits[word]?.id,
      targetId: attributeUnit.id,
      type: 'HAS_ATTRIBUTE',
      metadata: {
        attributeName
      }
    };

    const valueLink: LinkDto = {
      id: uuidv4(),
      sourceId: attributeUnit.id,
      targetId: valueUnit.id,
      type: 'HAS_VALUE'
    };

    // Update existing pill unit with new attributes
    const pillUnit: InformationUnitDto = {
      id: informationUnits[word]?.id,
      type: 'PILL',
      content: word,
      attributes: {
        ...(selectedAttributes[word] || {}),
        [attributeName]: value
      }
    };

    // Update state with new units and links
    const updatedUnits = { ...informationUnits, [word]: pillUnit };
    const updatedLinks = [...links, attributeLink, valueLink];
    
    setInformationUnits(updatedUnits);
    setLinks(updatedLinks);
    
    // Save changes after state is updated
    saveChanges([pillUnit, attributeUnit, valueUnit], [attributeLink, valueLink]);
  };

  // Debug logging
  useEffect(() => {
    console.log('Current Information Units:', informationUnits);
    console.log('Current Links:', links);
  }, [informationUnits, links]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setActiveWord(null);
    setSuggestions([]);
    if (onSenseSelect) onSenseSelect(null);
  };

  // Fetch meanings when activeWord changes
  useEffect(() => {
    if (!activeWord) {
      setMeanings([]);
      return;
    }
    setLoadingMeanings(true);
    fetch(`http://localhost:5121/api/OntosenseKB/meanings?word=${encodeURIComponent(activeWord)}`)
      .then(res => res.json())
      .then(data => {
        setMeanings(data);
        setLoadingMeanings(false);
      })
      .catch(() => setLoadingMeanings(false));
  }, [activeWord]);

  return (
    <div className="w-full max-w-xl mx-auto my-4">
      {suggestions.length > 0 && (
        <div className="mb-2 bg-gray-50 border rounded p-2">
          {loading && <div className="text-xs text-gray-400">Loading...</div>}
          {suggestions.map((s) => (
            <div
              key={s.pageId}
              className={`cursor-pointer p-1 rounded hover:bg-blue-100 ${wordSenses[activeWord || '']?.pageId === s.pageId ? 'bg-blue-200 font-bold' : ''}`}
              onClick={() => handleSelect(s)}
            >
              <div className="text-sm">{s.title}</div>
              <div className="text-xs text-gray-500" dangerouslySetInnerHTML={{ __html: s.snippet }} />
            </div>
          ))}
          {activeWord && (
            <div className="mt-2 text-xs text-blue-700">Selecting sense for: <b>{activeWord}</b></div>
          )}
        </div>
      )}
      <input
        type="text"
        className="border p-2 rounded w-full"
        value={value}
        onChange={handleInputChange}
        placeholder="Type here..."
      />
      {words.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {words.map((word, idx) => (
            <div key={idx} className="flex flex-col">
              <span
                style={{
                  display: 'inline-block',
                  backgroundColor: word === activeWord ? '#FACC15' : (wordSenses[word] ? '#10B981' : '#D1FAE5'),
                  color: word === activeWord ? '#000000' : (wordSenses[word] ? '#FFFFFF' : '#065F46'),
                  border: word === activeWord ? '2px solid #EAB308' : (wordSenses[word] ? '2px solid #047857' : '2px solid #A7F3D0'),
                  borderRadius: '9999px',
                  padding: '2px 12px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  cursor: 'pointer',
                }}
                onClick={() => handlePillClick(word)}
                title={wordSenses[word] ? `Selected: ${wordSenses[word].title}` : ''}
              >
                {word}
              </span>
              {word === activeWord && (
                <div className="mt-2 ml-2 space-y-2">
                  {getAttributesForWord(word).map((attr) => (
                    <div key={attr.name} className="flex flex-col">
                      <div className="text-sm font-medium text-gray-700">{attr.name}</div>
                      <div className="flex gap-2 mt-1">
                        {attr.values.map((value) => (
                          <button
                            key={value}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAttributeValueSelect(word, attr.name, value);
                            }}
                            className={`px-2 py-1 text-xs rounded ${
                              selectedAttributes[word]?.[attr.name] === value
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {activeWord && (
        <div style={{ marginTop: 16 }}>
          <h4 style={{ fontSize: '1.2em', fontWeight: 600, marginBottom: 8 }}>Most Probable Meanings for "{activeWord}"</h4>
          {loadingMeanings ? (
            <div>Loading meanings...</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {meanings.map((m, idx) => (
                <li key={idx} style={{ marginBottom: 20, border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, background: '#fafafa', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                  <div style={{ marginBottom: 8 }}>
                    <b>Meaning:</b>
                    {Array.isArray(m.meaning) ? (
                      <ul style={{ margin: '6px 0 0 18px' }}>
                        {m.meaning.map((item: any, i: number) => (
                          <li key={i}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                        ))}
                      </ul>
                    ) : typeof m.meaning === 'object' && m.meaning !== null ? (
                      <pre style={{ margin: '6px 0 0 0', background: '#f3f4f6', padding: 8, borderRadius: 4 }}>{JSON.stringify(m.meaning, null, 2)}</pre>
                    ) : (
                      <span style={{ marginLeft: 6 }}>{m.meaning}</span>
                    )}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <b>Wikipedia:</b> {m.wikipedia && m.wikipedia.link ? (
                      <a href={m.wikipedia.link} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', fontWeight: 500 }}>{m.wikipedia.title}</a>
                    ) : (
                      <span style={{ color: '#ef4444' }}>{m.wikipedia?.title || 'Error'}</span>
                    )}
                    <div style={{ fontSize: '0.95em', color: '#555', marginTop: 2 }} dangerouslySetInnerHTML={{ __html: m.wikipedia?.short_desc || '' }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default OntosenseUITextbox; 