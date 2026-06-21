import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  getStudents, saveStudent, updateStudentStatus, deleteStudent,
  getColleges, saveCollege, deleteCollege,
  getReferrals, saveReferral, deleteReferral,
  getCustomFields, saveCustomField, deleteCustomField,
  getPOCs, savePOC
} from '../lib/storage';
import DetailPanel from '../components/DetailPanel';
import PocInput from '../components/PocInput';
import Toast from '../components/Toast';
import Modal from '../components/Modal';

const STATUSES = ['New Lead','College Contacted','Discussion Started','Demo Done','Installed','Follow Up','Lost'];
const COURSES = ['B.Tech / B.E.','M.Tech / M.E.','BCA','MCA','B.Sc','M.Sc','MBA','B.Com','B.A.','Other'];
const YEARS = ['1st Year','2nd Year','3rd Year','4th Year','5th Year','Alumni'];
const ALL_COLUMNS = [
  { id:'student',   label:'Student',       locked: true },
  { id:'studentId', label:'Student ID',    locked: false },
  { id:'mobile',    label:'Mobile / WA',   locked: true },
  { id:'college',   label:'College',       locked: false },
  { id:'course',    label:'Course / Year', locked: false },
  { id:'poc',       label:'POC',           locked: false },
  { id:'referral',  label:'Referral',      locked: false },
  { id:'status',    label:'Status',        locked: true },
];

const WA_SVG = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

function getVisibleCols() {
  try { return JSON.parse(localStorage.getItem('sp_vis_cols')) || ALL_COLUMNS.map(c => c.id); }
  catch { return ALL_COLUMNS.map(c => c.id); }
}
function saveVisibleCols(ids) { localStorage.setItem('sp_vis_cols', JSON.stringify(ids)); }

export default function Dashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [page, setPage] = useState('students');
  const [students, setStudents] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [pocs, setPocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRef, setFilterRef] = useState('');
  const [filterCollege, setFilterCollege] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterPOC, setFilterPOC] = useState('');

  const activeFiltersCount = [filterStatus, filterRef, filterCollege, filterCity, filterState, filterPOC].filter(Boolean).length;

  // Column picker
  const [visCols, setVisCols] = useState(getVisibleCols());
  const [colPickerOpen, setColPickerOpen] = useState(false);
  const colPickerRef = useRef(null);

  // Add Student Modal
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [asForm, setAsForm] = useState({ firstName:'', lastName:'', studentId:'', mobile:'', email:'', collegeQuery:'', collegeId:'', collegeName:'', city:'', state:'', course:'', year:'', status:'New Lead', refCode:'direct', poc:'' });
  const [asCollegeDd, setAsCollegeDd] = useState(false);
  const asCollegeDdRef = useRef(null);

  // Add Referral Modal
  const [addRefOpen, setAddRefOpen] = useState(false);
  const [refForm, setRefForm] = useState({ name:'', phone:'', email:'', socialHandle:'', notes:'' });

  // Add Field Modal
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [fieldForm, setFieldForm] = useState({ name:'', type:'text', required:false, options:'' });

  // Add College Modal
  const [addCollegeOpen, setAddCollegeOpen] = useState(false);
  const [ncForm, setNcForm] = useState({ name:'', city:'', state:'' });

  const showToast = useCallback((msg) => { setToast(''); setTimeout(() => setToast(msg), 10); }, []);

  // Load all data
  useEffect(() => {
    Promise.all([getStudents(), getColleges(), getReferrals(), getCustomFields(), getPOCs()])
      .then(([s, c, r, cf, p]) => {
        setStudents(s); setColleges(c); setReferrals(r); setCustomFields(cf); setPocs(p);
        setLoading(false);
      });
  }, []);

  // Close col picker on outside click
  useEffect(() => {
    const h = (e) => { if (colPickerRef.current && !colPickerRef.current.contains(e.target)) setColPickerOpen(false); };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // ── Filter logic ──────────────────────────────────────────────────────────
  const filteredStudents = students.filter(s => {
    if (search) {
      const q = search.toLowerCase();
      const hit = `${s.firstName} ${s.lastName}`.toLowerCase().includes(q)
        || s.mobile.includes(q) || s.studentId.toLowerCase().includes(q)
        || (s.collegeName || '').toLowerCase().includes(q)
        || (s.city || '').toLowerCase().includes(q)
        || (s.poc || '').toLowerCase().includes(q);
      if (!hit) return false;
    }
    if (filterStatus && s.status !== filterStatus) return false;
    if (filterRef && s.refCode !== filterRef) return false;
    if (filterCollege && s.collegeName !== filterCollege) return false;
    if (filterCity && s.city !== filterCity) return false;
    if (filterState && s.state !== filterState) return false;
    if (filterPOC === '__unassigned__' && s.poc) return false;
    if (filterPOC && filterPOC !== '__unassigned__' && s.poc !== filterPOC) return false;
    return true;
  });

  const allCollegeNames = [...new Set(students.map(s => s.collegeName))].sort();
  const allCities = [...new Set(students.map(s => s.city))].sort();
  const allStates = [...new Set(students.map(s => s.state))].sort();
  const allPocs = [...new Set(students.map(s => s.poc || ''))].filter(Boolean).sort();
  const unassignedCount = students.filter(s => !s.poc).length;

  const clearFilters = () => {
    setSearch(''); setFilterStatus(''); setFilterRef(''); setFilterCollege('');
    setFilterCity(''); setFilterState(''); setFilterPOC('');
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = [
    { label: 'Total Students', num: students.length, color: 'blue' },
    { label: 'New Leads', num: students.filter(s => s.status === 'New Lead').length, color: 'red' },
    { label: 'In Discussion', num: students.filter(s => ['College Contacted','Discussion Started'].includes(s.status)).length, color: 'orange' },
    { label: 'Demo Done', num: students.filter(s => s.status === 'Demo Done').length, color: 'purple' },
    { label: 'Installed', num: students.filter(s => s.status === 'Installed').length, color: 'green' },
  ];

  // ── Column toggle ─────────────────────────────────────────────────────────
  const toggleCol = (id, checked) => {
    const next = checked ? [...visCols, id] : visCols.filter(v => v !== id);
    setVisCols(next); saveVisibleCols(next);
  };
  const resetCols = () => { const all = ALL_COLUMNS.map(c => c.id); setVisCols(all); saveVisibleCols(all); };
  const show = (id) => visCols.includes(id);

  // ── Status update ─────────────────────────────────────────────────────────
  const handleStatusChange = async (id, status) => {
    await updateStudentStatus(id, status);
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status, updatedAt: new Date().toISOString() } : s));
    if (selectedStudent?.id === id) setSelectedStudent(prev => ({ ...prev, status }));
    showToast('Status updated');
  };

  // ── Student update from detail panel ──────────────────────────────────────
  const handleStudentUpdate = (updated) => {
    setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
    setSelectedStudent(updated);
  };

  const handleStudentDelete = (id) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  // ── Export CSV ────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ['First Name','Last Name','Student ID','Mobile','Email','College','City','State','Course','Year','POC','Referral','Status','Created At', ...customFields.map(f => f.name)];
    const rows = filteredStudents.map(s => [
      s.firstName, s.lastName, s.studentId, '+91'+s.mobile, s.email || '',
      s.collegeName, s.city, s.state, s.course, s.year, s.poc || '',
      s.refLabel || s.refCode, s.status, new Date(s.createdAt).toLocaleDateString('en-IN'),
      ...customFields.map(f => s.customFields?.[f.id] || '')
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `smartprinter_students_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    showToast('CSV exported');
  };

  // ── Add Student ───────────────────────────────────────────────────────────
  const handleAddStudent = async () => {
    const { firstName, lastName, studentId, mobile, collegeQuery, collegeId, collegeName, city, state, course, year, status, refCode, poc } = asForm;
    if (!firstName || !lastName || !studentId || !/^\d{10}$/.test(mobile) || !collegeName || !course || !year) {
      alert('Please fill all required fields correctly'); return;
    }
    // Auto-add POC
    if (poc && !pocs.includes(poc)) { await savePOC(poc); setPocs(prev => [...prev, poc].sort()); }
    const ref = referrals.find(r => r.code === refCode);
    const existing = students.find(s => s.mobile === mobile);
    if (existing && !window.confirm('A student with this mobile already exists. Update their record?')) return;
    const sd = {
      id: existing ? existing.id : 'st_' + Date.now(),
      firstName, lastName, studentId, mobile, email: asForm.email || '',
      collegeId: collegeId || 'c_custom', collegeName, city, state, course, year, poc,
      refCode, refLabel: ref ? ref.name : 'Direct',
      status, isDuplicate: !!existing, duplicateAttempts: existing ? existing.duplicateAttempts : [],
      overrideLog: existing ? existing.overrideLog : [],
      notes: existing ? existing.notes : '', customFields: existing ? existing.customFields : {},
    };
    const saved = await saveStudent(sd);
    if (saved) {
      setStudents(prev => existing ? prev.map(s => s.id === saved.id ? saved : s) : [saved, ...prev]);
    }
    setAddStudentOpen(false);
    setAsForm({ firstName:'', lastName:'', studentId:'', mobile:'', email:'', collegeQuery:'', collegeId:'', collegeName:'', city:'', state:'', course:'', year:'', status:'New Lead', refCode:'direct', poc:'' });
    showToast('Student added!');
  };

  const asCollegeSearch = asForm.collegeQuery
    ? colleges.filter(c => c.name.toLowerCase().includes(asForm.collegeQuery.toLowerCase())).slice(0,8)
    : [];

  // ── Add Referral ──────────────────────────────────────────────────────────
  const handleAddRef = async () => {
    if (!refForm.name.trim()) { alert('Name is required'); return; }
    const code = refForm.name.trim().toLowerCase().replace(/\s+/g,'_') + '_' + Date.now().toString().slice(-4);
    const saved = await saveReferral({ id:'r_'+Date.now(), code, ...refForm, socialHandle: refForm.socialHandle });
    if (saved) setReferrals(prev => [saved, ...prev]);
    setAddRefOpen(false);
    setRefForm({ name:'', phone:'', email:'', socialHandle:'', notes:'' });
    showToast('Referral link created!');
  };

  const handleDeleteRef = async (id) => {
    if (!window.confirm("Delete this influencer? Their leads will remain in the database.")) return;
    await deleteReferral(id);
    setReferrals(prev => prev.filter(r => r.id !== id));
    showToast('Influencer deleted');
  };

  const copyLink = (link) => {
    navigator.clipboard.writeText(link).then(() => showToast('Link copied!')).catch(() => showToast('Copy failed'));
  };

  // ── Add Custom Field ──────────────────────────────────────────────────────
  const handleAddField = async () => {
    if (!fieldForm.name.trim()) { alert('Field name required'); return; }
    const saved = await saveCustomField({
      id: 'cf_'+Date.now(), name: fieldForm.name, type: fieldForm.type,
      required: fieldForm.required, options: fieldForm.type === 'select' ? fieldForm.options.split(',').map(o=>o.trim()) : [],
      sortOrder: customFields.length
    });
    if (saved) setCustomFields(prev => [...prev, saved]);
    setAddFieldOpen(false);
    setFieldForm({ name:'', type:'text', required:false, options:'' });
    showToast('Custom field added');
  };

  const handleDeleteField = async (id) => {
    if (!window.confirm('Delete this field?')) return;
    await deleteCustomField(id);
    setCustomFields(prev => prev.filter(f => f.id !== id));
    showToast('Field deleted');
  };

  // ── Add College ───────────────────────────────────────────────────────────
  const handleAddCollege = async () => {
    if (!ncForm.name || !ncForm.city || !ncForm.state) { alert('All fields required'); return; }
    const saved = await saveCollege({ id:'c_'+Date.now(), ...ncForm });
    if (saved) setColleges(prev => [...prev, saved]);
    setAddCollegeOpen(false);
    setNcForm({ name:'', city:'', state:'' });
    showToast('College added');
  };

  const navItems = [
    { id:'students', icon:'👥', label:'Students', badge: students.length },
    { id:'referrals', icon:'🔗', label:'Referrals' },
  ];
  const settingsItems = [
    { id:'fields', icon:'⚙️', label:'Custom Fields' },
    { id:'colleges', icon:'🏫', label:'Colleges' },
  ];

  const pageTitle = { students:'Students', referrals:'Referral Links', fields:'Custom Fields', colleges:'Colleges Database' };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--blue)', fontWeight:600, fontSize:16 }}>
      Loading...
    </div>
  );

  return (
    <div className="layout">
      {/* ── Sidebar Overlay (mobile) ── */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Sidebar ── */}
      <div className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-mark">S</div>
          <div>
            <div className="logo-text">SmartPrinter</div>
            <div className="logo-sub">CRM Dashboard</div>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Main</div>
          {navItems.map(n => (
            <div key={n.id} className={`nav-item${page === n.id ? ' active' : ''}`} onClick={() => { setPage(n.id); setSidebarOpen(false); }}>
              <span className="icon">{n.icon}</span> {n.label}
              {n.badge !== undefined && <span className="nav-badge">{n.badge}</span>}
            </div>
          ))}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Settings</div>
          {settingsItems.map(n => (
            <div key={n.id} className={`nav-item${page === n.id ? ' active' : ''}`} onClick={() => { setPage(n.id); setSidebarOpen(false); }}>
              <span className="icon">{n.icon}</span> {n.label}
            </div>
          ))}
        </div>

        <div style={{ marginTop:'auto', padding:'16px 12px' }}>
          <button
            className="btn-sm"
            style={{ width:'100%', background:'rgba(255,255,255,0.1)', color:'white', fontSize:12 }}
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      </div>

      {/* ── Main ── */}
      <div className="main">
        {/* Topbar */}
        <div className="topbar">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <span></span><span></span><span></span>
          </button>
          <div className="topbar-title">{pageTitle[page]}</div>
          <div className="topbar-actions">
            {page === 'students' && (
              <label className={`search-box ${search ? 'has-text' : ''}`} htmlFor="top-search">
                <span>🔍</span>
                <input id="top-search" type="text" placeholder="Search name, mobile..." value={search} onChange={e => setSearch(e.target.value)} />
              </label>
            )}
            {page === 'students' && <button className="btn-sm btn-red" onClick={() => setAddStudentOpen(true)}>+ Add Student</button>}
            {page === 'referrals' && <button className="btn-sm btn-red" onClick={() => setAddRefOpen(true)}>+ New Influencer</button>}
            {page === 'fields' && <button className="btn-sm btn-red" onClick={() => setAddFieldOpen(true)}>+ Add Field</button>}
            {page === 'colleges' && <button className="btn-sm btn-red" onClick={() => setAddCollegeOpen(true)}>+ Add College</button>}
          </div>
        </div>

        {/* Content */}
        <div className="content">

          {/* ══ MOBILE ACTIONS ══ */}
          <div className="mobile-actions">
            {page === 'students' && (
              <label className="search-box-mobile" htmlFor="mobile-search">
                <span style={{ marginRight: 8 }}>🔍</span>
                <input id="mobile-search" type="text" placeholder="Search name, mobile, college..." value={search} onChange={e => setSearch(e.target.value)} />
              </label>
            )}
            {page === 'students' && <button className="btn-sm btn-red w-full" onClick={() => setAddStudentOpen(true)}>+ Add Student</button>}
            {page === 'referrals' && <button className="btn-sm btn-red w-full" onClick={() => setAddRefOpen(true)}>+ New Influencer</button>}
            {page === 'fields' && <button className="btn-sm btn-red w-full" onClick={() => setAddFieldOpen(true)}>+ Add Field</button>}
            {page === 'colleges' && <button className="btn-sm btn-red w-full" onClick={() => setAddCollegeOpen(true)}>+ Add College</button>}
          </div>

          {/* ══ STUDENTS PAGE ══ */}
          {page === 'students' && (
            <>
              {/* Stats */}
              <div className="stats-row">
                {stats.map(st => (
                  <div key={st.label} className={`stat-card ${st.color}`}>
                    <div className="stat-num">{st.num}</div>
                    <div className="stat-label">{st.label}</div>
                  </div>
                ))}
              </div>

              {/* Filter Bar */}
              <button className="mobile-filter-btn" onClick={() => setMobileFiltersOpen(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
              </button>

              <div className={`filter-bar ${mobileFiltersOpen ? 'open' : ''}`}>
                <div className="mobile-filter-header">
                  <h3>Filters</h3>
                  <button onClick={() => setMobileFiltersOpen(false)}>✕</button>
                </div>
                <div className="filter-scroll-area">
                  <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">All Statuses</option>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <select className="filter-select" value={filterRef} onChange={e => setFilterRef(e.target.value)}>
                    <option value="">All Sources</option>
                    <option value="direct">Direct</option>
                    {referrals.map(r => <option key={r.id} value={r.code}>{r.name}</option>)}
                  </select>
                  <select className="filter-select" value={filterCollege} onChange={e => setFilterCollege(e.target.value)} style={{ maxWidth: 160 }}>
                    <option value="">All Colleges</option>
                    {allCollegeNames.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <select className="filter-select" value={filterCity} onChange={e => setFilterCity(e.target.value)}>
                    <option value="">All Cities</option>
                    {allCities.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <select className="filter-select" value={filterState} onChange={e => setFilterState(e.target.value)}>
                    <option value="">All States</option>
                    {allStates.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <select className="filter-select" value={filterPOC} onChange={e => setFilterPOC(e.target.value)}>
                    <option value="">All POCs</option>
                    {unassignedCount > 0 && <option value="__unassigned__">— Unassigned ({unassignedCount})</option>}
                    {allPocs.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <button className="clear-btn desktop-only" onClick={clearFilters}>Clear all</button>
                <div className="mobile-filter-footer">
                  <button className="btn-cancel" onClick={clearFilters}>Clear All</button>
                  <button className="btn-confirm" onClick={() => setMobileFiltersOpen(false)}>Apply Filters</button>
                </div>
              </div>

              {/* Table */}
              <div className="table-wrap">
                <div className="table-header">
                  <h3>{filteredStudents.length} Student{filteredStudents.length !== 1 ? 's' : ''}</h3>
                  <div className="table-header-actions">
                    {/* Column Picker */}
                    <div className="col-picker-wrap" ref={colPickerRef}>
                      <button className="col-picker-btn" onClick={e => { e.stopPropagation(); setColPickerOpen(!colPickerOpen); }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                          <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                        </svg>
                        Columns <span className="col-picker-count">{visCols.length}/{ALL_COLUMNS.length}</span>
                      </button>
                      <div className={`col-picker-dropdown${colPickerOpen ? ' open' : ''}`}>
                        <div className="col-picker-header">
                          Show / hide columns
                          <span className="col-reset" onClick={resetCols}>Reset</span>
                        </div>
                        {ALL_COLUMNS.map(c => (
                          <label key={c.id} className={`col-item${c.locked ? ' locked' : ''}`}>
                            <input type="checkbox" checked={visCols.includes(c.id)} disabled={c.locked}
                              onChange={e => toggleCol(c.id, e.target.checked)} />
                            {c.label} {c.locked && <span style={{ fontSize:10, color:'var(--gray)' }}>(always)</span>}
                          </label>
                        ))}
                      </div>
                    </div>
                    <button className="btn-sm btn-outline" onClick={exportCSV}>⬇ Export CSV</button>
                  </div>
                </div>

                {filteredStudents.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🎓</div>
                    <div className="empty-title">No students found</div>
                    <div className="empty-desc">Try changing filters or add a student.</div>
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        {show('student')   && <th>Student</th>}
                        {show('studentId') && <th>Student ID</th>}
                        {show('mobile')    && <th>Mobile / WA</th>}
                        {show('college')   && <th>College</th>}
                        {show('course')    && <th>Course / Year</th>}
                        {show('poc')       && <th>POC</th>}
                        {show('referral')  && <th>Referral</th>}
                        {show('status')    && <th>Status</th>}
                        {customFields.map(f => <th key={f.id}>{f.name}</th>)}
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map(s => {
                        const waMsg = encodeURIComponent(`Hi ${s.firstName}, This is ${s.poc || 'the team'} from Smart Printer`);
                        const pocBadge = s.poc
                          ? <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'var(--blue-light)', color:'var(--blue)', fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:20 }}>{s.poc}</span>
                          : <span style={{ color:'var(--gray)', fontSize:12 }}>—</span>;
                        return (
                          <tr key={s.id} className={s.isDuplicate ? 'duplicate-row' : ''}>
                            {show('student') && (
                              <td>
                                <div className="td-name" style={{ cursor:'pointer' }} onClick={() => setSelectedStudent(s)}>
                                  {s.firstName} {s.lastName}
                                  {s.isDuplicate && <span className="dup-badge">⚠ Dup</span>}
                                </div>
                                <div className="td-sub">{s.email || '—'}</div>
                              </td>
                            )}
                            {show('studentId') && (
                              <td><span style={{ fontFamily:'monospace', fontSize:12, background:'var(--gray-light)', padding:'2px 7px', borderRadius:4 }}>{s.studentId}</span></td>
                            )}
                            {show('mobile') && (
                              <td>
                                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                  <span style={{ fontSize:13 }}>+91 {s.mobile}</span>
                                  <a className="wa-btn" href={`https://wa.me/91${s.mobile}?text=${waMsg}`} target="_blank" rel="noreferrer">{WA_SVG}</a>
                                </div>
                              </td>
                            )}
                            {show('college') && (
                              <td>
                                <div style={{ fontWeight:500, fontSize:13 }}>{s.collegeName}</div>
                                <div className="td-sub">{s.city}, {s.state}</div>
                              </td>
                            )}
                            {show('course') && (
                              <td>
                                <div style={{ fontSize:13 }}>{s.course}</div>
                                <div className="td-sub">{s.year}</div>
                              </td>
                            )}
                            {show('poc') && <td>{pocBadge}</td>}
                            {show('referral') && (
                              <td><div style={{ fontSize:12, fontWeight:600, color:'var(--blue)' }}>{s.refLabel || s.refCode}</div></td>
                            )}
                            {show('status') && (
                              <td>
                                <select className="status-select" value={s.status} onChange={e => handleStatusChange(s.id, e.target.value)}>
                                  {STATUSES.map(st => <option key={st}>{st}</option>)}
                                </select>
                              </td>
                            )}
                            {customFields.map(f => <td key={f.id}>{s.customFields?.[f.id] || '—'}</td>)}
                            <td>
                              <button className="btn-sm btn-outline" style={{ fontSize:11, padding:'5px 10px' }} onClick={() => setSelectedStudent(s)}>View</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* ══ REFERRALS PAGE ══ */}
          {page === 'referrals' && (
            <>
              <div style={{ marginBottom: 4 }}>
                <p style={{ fontSize:12, color:'var(--gray)' }}>Generate unique links for each influencer. All leads flow into one database.</p>
              </div>
              {referrals.length === 0 ? (
                <div className="empty-state"><div className="icon">🔗</div><h4>No influencers yet</h4><p>Create referral links for your influencers.</p></div>
              ) : (
                <div className="ref-grid">
                  {referrals.map(r => {
                    const count = students.filter(s => s.refCode === r.code && !s.isDuplicate).length;
                    const dupCount = students.filter(s => s.duplicateAttempts?.some(a => a.refCode === r.code)).length;
                    const installed = students.filter(s => s.refCode === r.code && s.status === 'Installed').length;
                    const link = `${window.location.origin}/student_referral/register?ref=${r.code}&name=${encodeURIComponent(r.name)}`;
                    return (
                      <div key={r.id} className="ref-card">
                        <div className="ref-name">{r.name}</div>
                        <div className="ref-code">{r.code}</div>
                        {(r.phone || r.email || r.social_handle) && (
                          <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:12 }}>
                            {r.phone && <div style={{ fontSize:12, color:'var(--gray)' }}>📞 {r.phone}</div>}
                            {r.email && <div style={{ fontSize:12, color:'var(--gray)' }}>✉️ {r.email}</div>}
                            {r.social_handle && <div style={{ fontSize:12, color:'var(--gray)' }}>🔗 {r.social_handle}</div>}
                          </div>
                        )}
                        <div className="ref-stats">
                          <div className="ref-stat"><div className="num">{count}</div><div className="lbl">Leads</div></div>
                          <div className="ref-stat"><div className="num">{installed}</div><div className="lbl">Installed</div></div>
                          <div className="ref-stat"><div className="num" style={{ color:'var(--red)' }}>{dupCount}</div><div className="lbl">Duplicates</div></div>
                        </div>
                        <div className="link-box"><span>{link}</span></div>
                        <div className="ref-actions">
                          <button className="copy-btn" onClick={() => copyLink(link)}>Copy Link</button>
                          <button className="btn-sm btn-outline" onClick={() => { setFilterRef(r.code); setPage('students'); }}>View Leads</button>
                          <button className="btn-sm" style={{ background:'var(--red-light)', color:'var(--red)', border:'none', borderRadius:7, fontSize:12, fontWeight:600, padding:'7px 10px', cursor:'pointer' }} onClick={() => handleDeleteRef(r.id)}>Delete</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ══ CUSTOM FIELDS PAGE ══ */}
          {page === 'fields' && (
            <>
              <p style={{ fontSize:12, color:'var(--gray)', marginBottom:16 }}>Add custom fields that appear on student records.</p>
              {customFields.length === 0 ? (
                <div className="empty-state"><div className="icon">⚙️</div><h4>No custom fields</h4><p>Add fields that appear on every student record.</p></div>
              ) : (
                <div className="fields-list">
                  {customFields.map(f => (
                    <div key={f.id} className="field-item">
                      <span className="drag">⠿</span>
                      <span className="field-name">{f.name}</span>
                      <span className="field-type">{f.type}</span>
                      {f.required && <span className="field-required">Required</span>}
                      <button className="del-btn" onClick={() => handleDeleteField(f.id)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ══ COLLEGES PAGE ══ */}
          {page === 'colleges' && (
            <>
              <p style={{ fontSize:12, color:'var(--gray)', marginBottom:16 }}>All colleges across referral forms. New additions appear here automatically.</p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>College Name</th><th>City</th><th>State</th><th>Students</th><th>Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {colleges.map(c => {
                      const count = students.filter(s => s.collegeId === c.id).length;
                      return (
                        <tr key={c.id}>
                          <td>
                            <div style={{ fontWeight:600 }}>{c.name}</div>
                            {c.is_new && <div style={{ fontSize:10, color:'var(--gray)' }}>Added via form</div>}
                          </td>
                          <td>{c.city}</td>
                          <td>{c.state}</td>
                          <td><span style={{ fontWeight:700, color:'var(--blue)' }}>{count}</span></td>
                          <td>{c.is_new ? 'Custom' : 'Default'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Detail Panel ── */}
      {selectedStudent && (
        <DetailPanel
          student={selectedStudent}
          referrals={referrals}
          customFields={customFields}
          pocs={pocs}
          onPocsChange={setPocs}
          onClose={() => setSelectedStudent(null)}
          onStatusChange={handleStatusChange}
          onStudentUpdate={handleStudentUpdate}
          onStudentDelete={handleStudentDelete}
          showToast={showToast}
        />
      )}

      {/* ── Add Student Modal ── */}
      <Modal open={addStudentOpen} onClose={() => setAddStudentOpen(false)} title="Add Student">
        <div className="form-grid-2">
          <div className="form-field"><label>First Name *</label><input type="text" value={asForm.firstName} onChange={e => setAsForm(p=>({...p,firstName:e.target.value}))} placeholder="First name"/></div>
          <div className="form-field"><label>Last Name *</label><input type="text" value={asForm.lastName} onChange={e => setAsForm(p=>({...p,lastName:e.target.value}))} placeholder="Last name"/></div>
        </div>
        <div className="form-field"><label>Student ID *</label><input type="text" value={asForm.studentId} onChange={e => setAsForm(p=>({...p,studentId:e.target.value}))} placeholder="e.g. 22CS1045"/></div>
        <div className="form-field"><label>Mobile *</label><input type="tel" value={asForm.mobile} onChange={e => setAsForm(p=>({...p,mobile:e.target.value}))} placeholder="10-digit number" maxLength="10"/></div>
        <div className="form-field"><label>Email</label><input type="email" value={asForm.email} onChange={e => setAsForm(p=>({...p,email:e.target.value}))} placeholder="email@college.edu"/></div>
        <div className="form-field" ref={asCollegeDdRef}>
          <label>College *</label>
          <div style={{ position:'relative' }}>
            <input type="text" value={asForm.collegeQuery} placeholder="Type college name..." autoComplete="off"
              onChange={e => { setAsForm(p=>({...p,collegeQuery:e.target.value,collegeId:'',collegeName:e.target.value,city:'',state:''})); setAsCollegeDd(e.target.value.length>=2); }}
              onBlur={() => setTimeout(()=>setAsCollegeDd(false),150)}
            />
            {asCollegeDd && asCollegeSearch.length > 0 && (
              <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'white', border:'1.5px solid var(--blue)', borderRadius:8, boxShadow:'0 8px 24px rgba(11,44,110,0.15)', zIndex:100, maxHeight:180, overflowY:'auto' }}>
                {asCollegeSearch.map(c => (
                  <div key={c.id} className="dd-item" onMouseDown={() => { setAsForm(p=>({...p,collegeQuery:c.name,collegeId:c.id,collegeName:c.name,city:c.city,state:c.state})); setAsCollegeDd(false); }}>
                    <span>{c.name}</span><span className="city-tag">{c.city}, {c.state}</span>
                  </div>
                ))}
                <div className="dd-add" onMouseDown={() => { const ci=prompt(`City for "${asForm.collegeQuery}"?`); const st=prompt('State?'); if(ci&&st){const nc={id:'c_'+Date.now(),name:asForm.collegeQuery,city:ci,state:st};saveCollege({...nc,isNew:true}).then(s=>{if(s){setColleges(p=>[...p,s]);setAsForm(p=>({...p,collegeId:s.id,collegeName:s.name,city:s.city,state:s.state}));}}); } setAsCollegeDd(false); }}>
                  ＋ Add "{asForm.collegeQuery}"
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="form-grid-2">
          <div className="form-field"><label>City</label><input type="text" value={asForm.city} readOnly style={{ background:'#f8f8f8' }}/></div>
          <div className="form-field"><label>State</label><input type="text" value={asForm.state} readOnly style={{ background:'#f8f8f8' }}/></div>
        </div>
        <div className="form-grid-2">
          <div className="form-field"><label>Course *</label>
            <select value={asForm.course} onChange={e => setAsForm(p=>({...p,course:e.target.value}))}>
              <option value="">Select</option>{COURSES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-field"><label>Year *</label>
            <select value={asForm.year} onChange={e => setAsForm(p=>({...p,year:e.target.value}))}>
              <option value="">Select</option>{YEARS.map(y=><option key={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div className="form-field"><label>Status</label>
          <select value={asForm.status} onChange={e => setAsForm(p=>({...p,status:e.target.value}))}>
            {STATUSES.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-field"><label>Referred By</label>
          <select value={asForm.refCode} onChange={e => setAsForm(p=>({...p,refCode:e.target.value}))}>
            <option value="direct">Direct (No Referral)</option>
            {referrals.map(r=><option key={r.id} value={r.code}>{r.name}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label>POC (Point of Contact)</label>
          <PocInput value={asForm.poc} onChange={val=>setAsForm(p=>({...p,poc:val}))} pocs={pocs} onPocsChange={setPocs} />
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={() => setAddStudentOpen(false)}>Cancel</button>
          <button className="btn-confirm" onClick={handleAddStudent}>Add Student</button>
        </div>
      </Modal>

      {/* ── Add Referral Modal ── */}
      <Modal open={addRefOpen} onClose={() => setAddRefOpen(false)} title="New Influencer">
        <div className="form-field"><label>Influencer Name *</label><input type="text" value={refForm.name} onChange={e=>setRefForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Priya Sharma"/></div>
        <div className="form-grid-2">
          <div className="form-field"><label>Phone</label><input type="tel" value={refForm.phone} onChange={e=>setRefForm(p=>({...p,phone:e.target.value}))} placeholder="+91 98765 43210"/></div>
          <div className="form-field"><label>Email</label><input type="email" value={refForm.email} onChange={e=>setRefForm(p=>({...p,email:e.target.value}))} placeholder="priya@email.com"/></div>
        </div>
        <div className="form-field"><label>Social Media</label><input type="text" value={refForm.socialHandle} onChange={e=>setRefForm(p=>({...p,socialHandle:e.target.value}))} placeholder="Paste profile link or @handle"/></div>
        <div className="form-field"><label>Notes</label><textarea rows="2" value={refForm.notes} onChange={e=>setRefForm(p=>({...p,notes:e.target.value}))} placeholder="Any notes about this influencer..."/></div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={() => setAddRefOpen(false)}>Cancel</button>
          <button className="btn-confirm" onClick={handleAddRef}>Generate Link</button>
        </div>
      </Modal>

      {/* ── Add Field Modal ── */}
      <Modal open={addFieldOpen} onClose={() => setAddFieldOpen(false)} title="Add Custom Field">
        <div className="form-field"><label>Field Name *</label><input type="text" value={fieldForm.name} onChange={e=>setFieldForm(p=>({...p,name:e.target.value}))} placeholder="e.g. LinkedIn Profile"/></div>
        <div className="form-field"><label>Field Type *</label>
          <select value={fieldForm.type} onChange={e=>setFieldForm(p=>({...p,type:e.target.value}))}>
            <option value="text">Text</option><option value="number">Number</option>
            <option value="email">Email</option><option value="url">URL</option>
            <option value="date">Date</option><option value="select">Dropdown</option>
            <option value="textarea">Long Text</option>
          </select>
        </div>
        {fieldForm.type === 'select' && (
          <div className="form-field"><label>Options (comma separated)</label><input type="text" value={fieldForm.options} onChange={e=>setFieldForm(p=>({...p,options:e.target.value}))} placeholder="Option 1, Option 2, Option 3"/></div>
        )}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
          <input type="checkbox" id="cf-req" checked={fieldForm.required} onChange={e=>setFieldForm(p=>({...p,required:e.target.checked}))} style={{ width:'auto' }}/>
          <label htmlFor="cf-req" style={{ fontSize:13, fontWeight:500 }}>Required field</label>
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={() => setAddFieldOpen(false)}>Cancel</button>
          <button className="btn-confirm" onClick={handleAddField}>Add Field</button>
        </div>
      </Modal>

      {/* ── Add College Modal ── */}
      <Modal open={addCollegeOpen} onClose={() => setAddCollegeOpen(false)} title="Add College">
        <div className="form-field"><label>College Name *</label><input type="text" value={ncForm.name} onChange={e=>setNcForm(p=>({...p,name:e.target.value}))} placeholder="Full college name"/></div>
        <div className="form-field"><label>City *</label><input type="text" value={ncForm.city} onChange={e=>setNcForm(p=>({...p,city:e.target.value}))} placeholder="City"/></div>
        <div className="form-field"><label>State *</label><input type="text" value={ncForm.state} onChange={e=>setNcForm(p=>({...p,state:e.target.value}))} placeholder="State"/></div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={() => setAddCollegeOpen(false)}>Cancel</button>
          <button className="btn-confirm" onClick={handleAddCollege}>Add College</button>
        </div>
      </Modal>

      <Toast message={toast} />
    </div>
  );
}
