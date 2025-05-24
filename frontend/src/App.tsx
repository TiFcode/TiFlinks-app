import { useState, useEffect } from 'react'
import OntosenseUITextbox from './components/OntosenseUITextbox'
import type { WikipediaSuggestion } from './components/OntosenseUITextbox'

interface InformationUnit {
  id: number;
  title: string;
  content: string;
  type: number;
  createdAt: string;
  updatedAt: string | null;
}

interface Link {
  id: number;
  sourceId: number;
  targetId: number;
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
  const [newUnit, setNewUnit] = useState({ title: '', content: '', type: 1 })
  const [newLink, setNewLink] = useState({ sourceId: 0, targetId: 0, linkTypeId: 1, description: '' })
  const [expandedUnits, setExpandedUnits] = useState<{ [id: number]: boolean }>({})
  const [page, setPage] = useState<'main' | 'ontosense'>('main')
  const [ontosenseValue, setOntosenseValue] = useState('')
  const [ontosenseSense, setOntosenseSense] = useState<WikipediaSuggestion | null>(null)

  useEffect(() => {
    if (page !== 'main') return;
    fetch('http://localhost:5121/api/InformationUnits')
      .then(response => response.json())
      .then(data => setInformationUnits(data))
      .catch(error => console.error('Error fetching information units:', error))
    fetch('http://localhost:5121/api/Links')
      .then(response => response.json())
      .then(data => setLinks(data))
      .catch(error => console.error('Error fetching links:', error))
  }, [page])

  const handleAddUnit = () => {
    fetch('http://localhost:5121/api/InformationUnits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUnit)
    })
      .then(response => response.json())
      .then(data => setInformationUnits([...informationUnits, data]))
      .catch(error => console.error('Error adding information unit:', error))
  }

  const handleAddLink = () => {
    fetch('http://localhost:5121/api/Links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLink)
    })
      .then(response => response.json())
      .then(data => setLinks([...links, data]))
      .catch(error => console.error('Error adding link:', error))
  }

  return (
    <div className="min-h-screen flex">
      {/* Vertical Navigation */}
      <nav className="w-56 bg-gray-100 h-screen p-4 flex flex-col gap-2">
        <button className={`text-left p-2 rounded ${page === 'main' ? 'bg-blue-200 font-bold' : ''}`} onClick={() => setPage('main')}>Main Page</button>
        <button className={`text-left p-2 rounded ${page === 'ontosense' ? 'bg-blue-200 font-bold' : ''}`} onClick={() => setPage('ontosense')}>OntosenseUI</button>
      </nav>
      {/* Main Content */}
      <div className="flex-1">
        {page === 'main' && (
          <>
            <header className="bg-white shadow">
              <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900">TiFlinks</h1>
              </div>
            </header>
            <main>
              <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                  <h2 className="text-2xl font-bold mb-4">Information Units</h2>
                  <ul className="space-y-2">
                    {informationUnits.map((unit) => (
                      <li key={unit.id} className="border p-2 rounded">
                        <h3 className="font-bold">{unit.title}</h3>
                        <p>
                          {expandedUnits[unit.id]
                            ? unit.content
                            : unit.content.length > 50
                              ? unit.content.slice(0, 50) + '...'
                              : unit.content}
                        </p>
                        {unit.content.length > 50 && (
                          <button
                            className="text-blue-500 underline text-sm mt-1"
                            onClick={() => setExpandedUnits(prev => ({ ...prev, [unit.id]: !prev[unit.id] }))}
                          >
                            {expandedUnits[unit.id] ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  <h2 className="text-2xl font-bold mt-8 mb-4">Links</h2>
                  <ul className="space-y-2">
                    {links.map((link) => (
                      <li key={link.id} className="border p-2 rounded">
                        <p>Source ID: {link.sourceId}, Target ID: {link.targetId}</p>
                        <p>{link.description}</p>
                      </li>
                    ))}
                  </ul>
                  <h2 className="text-2xl font-bold mt-8 mb-4">Add New Information Unit</h2>
                  <input type="text" placeholder="Title" value={newUnit.title} onChange={(e) => setNewUnit({ ...newUnit, title: e.target.value })} className="border p-2 rounded mb-2" />
                  <input type="text" placeholder="Content" value={newUnit.content} onChange={(e) => setNewUnit({ ...newUnit, content: e.target.value })} className="border p-2 rounded mb-2" />
                  <button onClick={handleAddUnit} className="bg-blue-500 text-white p-2 rounded">Add Unit</button>
                  <h2 className="text-2xl font-bold mt-8 mb-4">Add New Link</h2>
                  <div className="flex flex-wrap gap-2 items-center mb-2">
                    <select value={newLink.sourceId} onChange={e => setNewLink({ ...newLink, sourceId: parseInt(e.target.value) })} className="border p-2 rounded">
                      <option value={0}>Select Source</option>
                      {informationUnits.map(unit => (
                        <option key={unit.id} value={unit.id}>{unit.title}</option>
                      ))}
                    </select>
                    <select value={newLink.targetId} onChange={e => setNewLink({ ...newLink, targetId: parseInt(e.target.value) })} className="border p-2 rounded">
                      <option value={0}>Select Target</option>
                      {informationUnits.map(unit => (
                        <option key={unit.id} value={unit.id}>{unit.title}</option>
                      ))}
                    </select>
                    <select value={newLink.linkTypeId} onChange={e => setNewLink({ ...newLink, linkTypeId: parseInt(e.target.value) })} className="border p-2 rounded">
                      {linkTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                    <input type="text" placeholder="Description" value={newLink.description} onChange={(e) => setNewLink({ ...newLink, description: e.target.value })} className="border p-2 rounded" />
                    <button onClick={handleAddLink} className="bg-blue-500 text-white p-2 rounded">Add Link</button>
                  </div>
                </div>
              </div>
            </main>
          </>
        )}
        {page === 'ontosense' && (
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">OntosenseUI</h1>
            <OntosenseUITextbox
              value={ontosenseValue}
              onChange={setOntosenseValue}
              onSenseSelect={setOntosenseSense}
            />
            {ontosenseSense && (
              <div className="mt-2 text-green-700 text-sm">Selected Wikipedia page: <b>{ontosenseSense.title}</b></div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
