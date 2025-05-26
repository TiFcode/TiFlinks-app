import { useState, useEffect } from 'react'
import OntosenseUITextbox from './components/OntosenseUITextbox'
import type { WikipediaSuggestion } from './components/OntosenseUITextbox'
import type { InformationUnitDto } from './types/InformationUnitDto'
import type { LinkDto } from './types/LinkDto'
import { v4 as uuidv4 } from 'uuid'
import './App.css'

interface InformationUnit {
  id: string;
  title: string;
  content: string;
  type: number;
  createdAt: string;
  updatedAt: string | null;
}

interface Link {
  id: string;
  sourceId: string;
  targetId: string;
  linkTypeId: number;
  description: string;
  createdAt: string;
  updatedAt: string | null;
}

// Optionally, define link types for the dropdown
const linkTypes = [
  { id: 1, name: 'Navigational' },
  { id: 2, name: 'Semantic Reference' }
];

function App() {
  const [informationUnits, setInformationUnits] = useState<InformationUnit[]>([])
  const [links, setLinks] = useState<Link[]>([])
  const [newUnit, setNewUnit] = useState({ id: uuidv4(), title: '', content: '', type: 1 })
  const [newLink, setNewLink] = useState({ id: uuidv4(), sourceId: '', targetId: '', linkTypeId: 1, description: '' })
  const [expandedUnits, setExpandedUnits] = useState<{ [id: string]: boolean }>({})
  const [page, setPage] = useState<'main' | 'ontosense'>('main')
  const [ontosenseValue, setOntosenseValue] = useState('')
  const [ontosenseSense, setOntosenseSense] = useState<WikipediaSuggestion | null>(null)
  const [ontosenseUnits, setOntosenseUnits] = useState<InformationUnitDto[]>([])
  const [ontosenseLinks, setOntosenseLinks] = useState<LinkDto[]>([])
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false)
  const [lastHeartbeat, setLastHeartbeat] = useState<{ sent: string; received: string } | null>(null)
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([])
  const [rangeSelection, setRangeSelection] = useState<{ start: string | null, end: string | null }>({ start: null, end: null })
  const [linkSourceId, setLinkSourceId] = useState<string | null>(null);
  const [linkTargetId, setLinkTargetId] = useState<string | null>(null);
  const [linkTypeSelectionVisible, setLinkTypeSelectionVisible] = useState(false);
  const [linkDescription, setLinkDescription] = useState('');

  useEffect(() => {
    if (page !== 'main') return;
    fetch('http://localhost:5121/api/InformationUnits')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => setInformationUnits(data.map((unit: any) => ({
        id: unit.id.toString(),
        title: unit.title,
        content: unit.content,
        type: unit.type,
        createdAt: unit.createdAt,
        updatedAt: unit.updatedAt
      }))))
      .catch(error => {
        console.error('Error fetching information units:', error);
        alert('Failed to fetch information units. Please refresh the page.');
      });
    fetch('http://localhost:5121/api/Links')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => setLinks(data.map((link: any) => ({
        id: link.id.toString(),
        sourceId: link.sourceId.toString(),
        targetId: link.targetId.toString(),
        linkTypeId: link.linkTypeId,
        description: link.description,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt
      }))))
      .catch(error => {
        console.error('Error fetching links:', error);
        alert('Failed to fetch links. Please refresh the page.');
      });
  }, [page])

  useEffect(() => {
    const checkBackendStatus = async () => {
      const sentTime = new Date().toISOString();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);
        
        const response = await fetch('http://localhost:5121/api/heartbeat', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const receivedTime = new Date().toISOString();
        setIsBackendOnline(response.ok);
        setLastHeartbeat({ sent: sentTime, received: receivedTime });
      } catch (error) {
        setIsBackendOnline(false);
        setLastHeartbeat({ sent: sentTime, received: 'timeout' });
      }
    };

    checkBackendStatus();
    const intervalId = setInterval(checkBackendStatus, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const handleAddUnit = () => {
    const unitToAdd = { ...newUnit, id: uuidv4() };
    fetch('http://localhost:5121/api/InformationUnits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(unitToAdd)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setInformationUnits(prev => [...prev, {
          id: data.id.toString(),
          title: data.title,
          content: data.content,
          type: data.type,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        }]);
        setNewUnit({ id: uuidv4(), title: '', content: '', type: 1 });
      })
      .catch(error => {
        console.error('Error adding information unit:', error);
        alert('Failed to add information unit. Please try again.');
      });
  }

  const handleAddLink = () => {
    const linkToAdd = { ...newLink, id: uuidv4() };
    fetch('http://localhost:5121/api/Links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(linkToAdd)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setLinks(prev => [...prev, {
          id: data.id.toString(),
          sourceId: data.sourceId.toString(),
          targetId: data.targetId.toString(),
          linkTypeId: data.linkTypeId,
          description: data.description,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        }]);
        setNewLink({ id: uuidv4(), sourceId: '', targetId: '', linkTypeId: 1, description: '' });
      })
      .catch(error => {
        console.error('Error adding link:', error);
        alert('Failed to add link. Please try again.');
      });
  }

  const handleOntosenseUnitsChange = (units: InformationUnitDto[], links: LinkDto[]) => {
    setOntosenseUnits(units);
    setOntosenseLinks(links);
  };

  // Helper to get range of selected units
  const getRangeSelectedIds = () => {
    if (!rangeSelection.start || !rangeSelection.end) return [];
    const startIdx = informationUnits.findIndex(u => u.id === rangeSelection.start);
    const endIdx = informationUnits.findIndex(u => u.id === rangeSelection.end);
    if (startIdx === -1 || endIdx === -1) return [];
    const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    return informationUnits.slice(from, to + 1).map(u => u.id);
  };

  const handleCheckboxChange = (id: string) => {
    if (!rangeSelection.start) {
      setRangeSelection({ start: id, end: null });
      setSelectedUnitIds([id]);
    } else if (!rangeSelection.end && id !== rangeSelection.start) {
      setRangeSelection(prev => ({ ...prev, end: id }));
      const rangeIds = getRangeSelectedIdsWith(id);
      setSelectedUnitIds(rangeIds);
    } else {
      setRangeSelection({ start: id, end: null });
      setSelectedUnitIds([id]);
    }
  };

  // Helper to get range if end is not yet set
  const getRangeSelectedIdsWith = (endId: string) => {
    if (!rangeSelection.start) return [];
    const startIdx = informationUnits.findIndex(u => u.id === rangeSelection.start);
    const endIdx = informationUnits.findIndex(u => u.id === endId);
    if (startIdx === -1 || endIdx === -1) return [];
    const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    return informationUnits.slice(from, to + 1).map(u => u.id);
  };

  const handleSelectRange = () => {
    if (rangeSelection.start && rangeSelection.end) {
      setSelectedUnitIds(getRangeSelectedIds());
    }
  };

  const handleDeleteSelected = async () => {
    for (const id of selectedUnitIds) {
      await fetch(`http://localhost:5121/api/InformationUnits/${id}`, { method: 'DELETE' });
    }
    setSelectedUnitIds([]);
    setRangeSelection({ start: null, end: null });
    window.location.reload();
  };

  const handleUnselectAll = () => {
    setSelectedUnitIds([]);
    setRangeSelection({ start: null, end: null });
  };

  const handlePillClick = (id: string) => {
    if (!linkSourceId) {
      setLinkSourceId(id);
      setLinkTargetId(null);
      setLinkTypeSelectionVisible(false);
      setLinkDescription('');
    } else if (linkSourceId && !linkTargetId && id !== linkSourceId) {
      setLinkTargetId(id);
      setLinkTypeSelectionVisible(true);
      setLinkDescription('');
    } else {
      setLinkSourceId(id);
      setLinkTargetId(null);
      setLinkTypeSelectionVisible(false);
      setLinkDescription('');
    }
  };

  const handleCreateLink = async (linkTypeId: number) => {
    if (!linkSourceId || !linkTargetId) return;
    const linkToAdd = {
      id: uuidv4(),
      sourceId: linkSourceId,
      targetId: linkTargetId,
      linkTypeId,
      description: linkDescription,
    };
    await fetch('http://localhost:5121/api/Links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(linkToAdd)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(async data => {
        setLinks(prev => [...prev, {
          id: data.id.toString(),
          sourceId: data.sourceId.toString(),
          targetId: data.targetId.toString(),
          linkTypeId: data.linkTypeId,
          description: data.description,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        }]);
        // Also create an information unit for the link
        const sourceUnit = informationUnits.find(u => u.id === linkSourceId);
        const targetUnit = informationUnits.find(u => u.id === linkTargetId);
        const infoUnitToAdd = {
          id: uuidv4(),
          title: `Link: ${sourceUnit?.title || 'Unknown'} → ${targetUnit?.title || 'Unknown'}`,
          content: linkDescription,
          type: linkTypeId === 2 ? 'OntosenseLink' : 'NavigationalLink',
        };
        await fetch('http://localhost:5121/api/InformationUnits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(infoUnitToAdd)
        })
          .then(response => response.json())
          .then(data => {
            setInformationUnits(prev => [...prev, {
              id: data.id.toString(),
              title: data.title,
              content: data.content,
              type: data.type,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt
            }]);
          });
        setLinkSourceId(null);
        setLinkTargetId(null);
        setLinkTypeSelectionVisible(false);
        setLinkDescription('');
      })
      .catch(error => {
        console.error('Error adding link:', error);
        alert('Failed to add link. Please try again.');
      });
  };

  return (
    <div className="app-container">
      <nav className="nav-sidebar">
        <button 
          className={`nav-button ${page === 'main' ? 'active' : ''}`} 
          onClick={() => setPage('main')}
        >
          Main Page
        </button>
        <button 
          className={`nav-button ${page === 'ontosense' ? 'active' : ''}`} 
          onClick={() => setPage('ontosense')}
        >
          OntosenseUI
        </button>
      </nav>
      <div className="main-content">
        <div className="content-area">
          {page === 'main' ? (
            <>
              <button
                className="delete-all-button"
                onClick={async () => {
                  if (window.confirm("Are you sure you want to delete ALL data?")) {
                    await fetch('http://localhost:5121/api/InformationUnits/all', { method: 'DELETE' });
                    window.location.reload();
                  }
                }}
              >
                Delete All Database
              </button>
              <header className="header">
                <h1>TiFlinks</h1>
              </header>
              <main>
                <div className="section">
                  <h2>Information Units</h2>
                  <ul className="unit-list">
                    {informationUnits.map((unit) => (
                      <li key={unit.id} className={`unit-item${linkSourceId === unit.id ? ' selected-source' : ''}${linkTargetId === unit.id ? ' selected-target' : ''}`}
                        onClick={() => handlePillClick(unit.id)}
                        style={{ cursor: 'pointer', borderWidth: (linkSourceId === unit.id || linkTargetId === unit.id) ? 2 : 1, borderColor: (linkSourceId === unit.id ? '#2563eb' : linkTargetId === unit.id ? '#dc2626' : '#e5e7eb') }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUnitIds.includes(unit.id)}
                          onChange={e => { e.stopPropagation(); handleCheckboxChange(unit.id); }}
                          onClick={e => e.stopPropagation()}
                        />
                        <div className="unit-content">
                          <h3 className="unit-title">{unit.title}</h3>
                          <p>
                            {expandedUnits[unit.id]
                              ? unit.content
                              : unit.content.length > 50
                                ? unit.content.slice(0, 50) + '...'
                                : unit.content}
                          </p>
                          {unit.content.length > 50 && (
                            <button
                              className="show-more-button"
                              onClick={e => { e.stopPropagation(); setExpandedUnits(prev => ({ ...prev, [unit.id]: !prev[unit.id] })); }}
                            >
                              {expandedUnits[unit.id] ? 'Show less' : 'Show more'}
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  {linkTypeSelectionVisible && linkSourceId && linkTargetId && (
                    <div style={{ marginTop: '1rem' }}>
                      <input
                        type="text"
                        placeholder="Description"
                        value={linkDescription}
                        onChange={e => setLinkDescription(e.target.value)}
                        style={{ marginRight: 8, padding: '0.5rem', borderRadius: 4, border: '1px solid #e5e7eb', minWidth: 180 }}
                      />
                      <span style={{ marginRight: 8 }}>Select link type:</span>
                      {linkTypes.map(type => (
                        <button
                          key={type.id}
                          style={{ marginRight: 8, padding: '0.5rem 1rem', borderRadius: 4, border: 'none', background: type.id === 1 ? '#3b82f6' : '#92400e', color: 'white', cursor: 'pointer' }}
                          onClick={() => handleCreateLink(type.id)}
                        >
                          {type.name}
                        </button>
                      ))}
                      <button
                        style={{ marginLeft: 8, padding: '0.5rem 1rem', borderRadius: 4, border: 'none', background: '#9ca3af', color: 'white', cursor: 'pointer' }}
                        onClick={() => { setLinkSourceId(null); setLinkTargetId(null); setLinkTypeSelectionVisible(false); setLinkDescription(''); }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="section">
                  <h2>Links</h2>
                  <ul className="link-list">
                    {links.map((link) => {
                      const sourceUnit = informationUnits.find(unit => unit.id === link.sourceId);
                      const targetUnit = informationUnits.find(unit => unit.id === link.targetId);
                      return (
                        <li key={link.id} className="link-item">
                          <p>
                            [{linkTypes.find(t => t.id === link.linkTypeId)?.name || 'Unknown'}] 
                            <span className="link-source">
                              "{sourceUnit?.title || 'Unknown'}"
                            </span> 
                            <span className="link-description">
                              "{link.description || ''}"
                            </span> 
                            <span className="link-target">
                              "{targetUnit?.title || 'Unknown'}"
                            </span>
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="section">
                  <h2>Add New Information Unit</h2>
                  <div className="form-group">
                    <input 
                      type="text" 
                      placeholder="Title" 
                      value={newUnit.title} 
                      onChange={(e) => setNewUnit({ ...newUnit, title: e.target.value })} 
                      className="input-field" 
                    />
                    <input 
                      type="text" 
                      placeholder="Content" 
                      value={newUnit.content} 
                      onChange={(e) => setNewUnit({ ...newUnit, content: e.target.value })} 
                      className="input-field" 
                    />
                    <button onClick={handleAddUnit} className="add-button">Add Unit</button>
                  </div>
                </div>

                <div className="section">
                  <h2>Add New Link</h2>
                  <div style={{ color: '#888', fontStyle: 'italic' }}>
                    To add a link, click a source pill, then a target pill, then select the link type below the list.
                  </div>
                </div>
              </main>
            </>
          ) : (
            <div className="ontosense-container">
              <h1 className="ontosense-title">OntosenseUI</h1>
              <OntosenseUITextbox
                value={ontosenseValue}
                onChange={setOntosenseValue}
                onInformationUnitsChange={handleOntosenseUnitsChange}
              />
              <div className="generated-units">
                <h2>Generated Units</h2>
                <ul className="unit-list">
                  {ontosenseUnits.map((unit) => (
                    <li key={unit.id} className="unit-item">
                      <h3 className="unit-title">{unit.type}: {unit.content}</h3>
                      {unit.attributes && Object.entries(unit.attributes).length > 0 && (
                        <div className="unit-attributes">
                          <h4>Attributes:</h4>
                          <ul className="attribute-list">
                            {Object.entries(unit.attributes).map(([key, value]) => (
                              <li key={key}>{key}: {value}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
      {page === 'main' && (
        <div className="sidebar">
          <h2>Selected Records</h2>
          <ul className="selected-list">
            {selectedUnitIds.map(id => {
              const unit = informationUnits.find(u => u.id === id);
              return unit ? (
                <li key={id} className="selected-item">{unit.title}</li>
              ) : null;
            })}
          </ul>
          <button
            className="delete-selected-button"
            onClick={handleDeleteSelected}
            disabled={selectedUnitIds.length === 0}
          >
            Delete selected records
          </button>
          <button
            className="unselect-all-button"
            onClick={handleUnselectAll}
            disabled={selectedUnitIds.length === 0}
          >
            Unselect all
          </button>
        </div>
      )}
    </div>
  )
}

export default App
