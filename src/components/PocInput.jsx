import { useState, useRef, useEffect } from 'react';
import { savePOC, deletePOC } from '../lib/storage';

export default function PocInput({ value, onChange, pocs, onPocsChange, inputStyle }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => { setQuery(value || ''); }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query
    ? pocs.filter(p => p.toLowerCase().includes(query.toLowerCase()))
    : pocs;
  const exactMatch = pocs.some(p => p.toLowerCase() === query.toLowerCase());

  const select = (poc) => {
    setQuery(poc);
    onChange(poc);
    setOpen(false);
  };

  const handleAddNew = async () => {
    const name = query.trim();
    if (!name || pocs.includes(name)) return;
    await savePOC(name);
    onPocsChange([...pocs, name].sort());
    select(name);
  };

  const handleDelete = async (e, poc) => {
    e.stopPropagation();
    if (!window.confirm(`Remove "${poc}" from POC list?`)) return;
    await deletePOC(poc);
    const newList = pocs.filter(p => p !== poc);
    onPocsChange(newList);
    if (query === poc) { setQuery(''); onChange(''); }
  };

  const initials = (name) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const showDropdown = open && (filtered.length > 0 || (query && !exactMatch));

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        placeholder="Select or type to add new..."
        style={inputStyle || {
          border: '1.5px solid var(--border)', borderRadius: 7,
          padding: '5px 10px', fontSize: 13,
          fontFamily: 'Inter,sans-serif', outline: 'none', width: '100%'
        }}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {showDropdown && (
        <div className="poc-dropdown open">
          {filtered.map(poc => (
            <div key={poc} className="poc-item" onMouseDown={() => select(poc)}>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div className="poc-initials">{initials(poc)}</div>
                <span>{poc}</span>
              </div>
              <button className="poc-del" onMouseDown={e => handleDelete(e, poc)}>✕</button>
            </div>
          ))}
          {query && !exactMatch && (
            <div className="poc-add-row" onMouseDown={handleAddNew}>
              <span>＋</span> Add "<strong>{query}</strong>" as new POC
            </div>
          )}
        </div>
      )}
    </div>
  );
}
