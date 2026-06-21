import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getColleges, saveCollege, saveStudent, getStudents } from '../lib/storage';

const COURSES = ['B.Tech / B.E.','M.Tech / M.E.','BCA','MCA','B.Sc','M.Sc','MBA','B.Com','B.A.','Other'];
const YEARS = ['1st Year','2nd Year','3rd Year','4th Year','5th Year','Alumni'];

export default function Registration() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const refCode = searchParams.get('ref') || 'direct';
  const refName = searchParams.get('name') || '';

  const [colleges, setColleges] = useState([]);
  const [form, setForm] = useState({
    firstName: '', lastName: '', studentId: '', mobile: '', email: '',
    collegeId: '', collegeName: '', city: '', state: '', course: '', year: ''
  });
  const [errors, setErrors] = useState({});
  const [collegeQuery, setCollegeQuery] = useState('');
  const [showDd, setShowDd] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New college modal
  const [showNewCollege, setShowNewCollege] = useState(false);
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newCollegeCity, setNewCollegeCity] = useState('');
  const [newCollegeState, setNewCollegeState] = useState('');

  const ddRef = useRef(null);

  useEffect(() => {
    getColleges().then(setColleges);
    const handler = (e) => {
      if (ddRef.current && !ddRef.current.contains(e.target)) setShowDd(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredColleges = collegeQuery.length >= 3
    ? colleges.filter(c => c.name.toLowerCase().includes(collegeQuery.toLowerCase()))
    : [];

  const selectCollege = (c) => {
    setCollegeQuery(c.name);
    setForm(prev => ({ ...prev, collegeId: c.id, collegeName: c.name, city: c.city, state: c.state }));
    setShowDd(false);
    setErrors(prev => ({ ...prev, college: false }));
  };

  const handleCollegeInput = (e) => {
    const q = e.target.value;
    setCollegeQuery(q);
    setForm(prev => ({ ...prev, collegeId: '', collegeName: q, city: '', state: '' }));
    setShowDd(q.length >= 3);
    if (errors.college) setErrors(prev => ({ ...prev, college: false }));
  };

  const openNewCollege = (name) => {
    setNewCollegeName(name);
    setNewCollegeCity('');
    setNewCollegeState('');
    setShowNewCollege(true);
    setShowDd(false);
  };

  const confirmNewCollege = async () => {
    if (!newCollegeName || !newCollegeCity || !newCollegeState) {
      alert('Please fill all fields'); return;
    }
    const nc = await saveCollege({
      id: 'c_' + Date.now(), name: newCollegeName, city: newCollegeCity, state: newCollegeState, isNew: true
    });
    const updated = await getColleges();
    setColleges(updated);
    selectCollege({ id: nc.id, name: nc.name, city: nc.city, state: nc.state });
    setShowNewCollege(false);
  };

  const validate = () => {
    const e = {};
    if (!form.firstName) e.firstName = true;
    if (!form.lastName) e.lastName = true;
    if (!form.studentId) e.studentId = true;
    if (!/^\d{10}$/.test(form.mobile)) e.mobile = true;
    if (!form.collegeId || !form.collegeName) e.college = true;
    if (!form.city) e.city = true;
    if (!form.state) e.state = true;
    if (!form.course) e.course = true;
    if (!form.year) e.year = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    // Duplicate detection
    const allStudents = await getStudents();
    const existing = allStudents.find(s => s.mobile === form.mobile);

    let studentData = {
      id: existing ? existing.id : 'st_' + Date.now(),
      firstName: form.firstName,
      lastName: form.lastName,
      studentId: form.studentId,
      mobile: form.mobile,
      email: form.email,
      collegeId: form.collegeId,
      collegeName: form.collegeName,
      city: form.city,
      state: form.state,
      course: form.course,
      year: form.year,
      refCode,
      refLabel: decodeURIComponent(refName || refCode),
      status: existing ? existing.status : 'New Lead',
      notes: existing ? existing.notes : '',
      customFields: existing ? existing.customFields : {},
      isDuplicate: !!existing,
      duplicateAttempts: existing
        ? [...(existing.duplicateAttempts || []), { refCode, refLabel: decodeURIComponent(refName || refCode), attemptedAt: new Date().toISOString() }]
        : [],
      overrideLog: existing ? existing.overrideLog : [],
    };

    // First-touch wins
    if (existing) {
      studentData.refCode = existing.refCode;
      studentData.refLabel = existing.refLabel;
    }

    await saveStudent(studentData);
    setSubmitting(false);
    setSuccess(true);
  };

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: false }));
  };

  if (success) {
    return (
      <div className="reg-page">
        <div className="reg-header">
          <div className="reg-header-logo">S</div>
          <div>
            <div className="reg-header-title">SmartPrinter</div>
            <div className="reg-header-sub">Student Registration Portal</div>
          </div>
        </div>
        <div className="reg-card">
          <div className="success-screen">
            <div className="success-icon">✓</div>
            <h3>Registration Successful!</h3>
            <p>Thank you! The student has been registered successfully.<br />Our team will get in touch with your college soon.</p>
            <button className="submit-btn" style={{ marginTop: 24, maxWidth: 200 }} onClick={() => setSuccess(false)}>
              Register Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reg-page">
      {/* Header */}
      <div className="reg-header">
        <div className="reg-header-logo">S</div>
        <div>
          <div className="reg-header-title">SmartPrinter</div>
          <div className="reg-header-sub">Student Registration Portal</div>
        </div>
      </div>

      {/* Card */}
      <div className="reg-card">
        <div className="reg-card-header">
          <h2>Student Registration</h2>
          <p>Fill in the details below to register your college for SmartPrinter services.</p>
          {refCode !== 'direct' && (
            <div className="ref-badge">
              <span className="ref-badge-dot"></span>
              <span>{refName ? `Referred by: ${decodeURIComponent(refName)}` : `Ref: ${refCode}`}</span>
            </div>
          )}
        </div>

        <div className="reg-form-body">
          <form onSubmit={handleSubmit} noValidate>
            {/* Name row */}
            <div className="form-row">
              <div className="field">
                <label>First Name <span className="req">*</span></label>
                <input type="text" placeholder="Rahul" value={form.firstName} onChange={set('firstName')}
                  className={errors.firstName ? 'error' : ''} />
                {errors.firstName && <div className="err-msg show">Required</div>}
              </div>
              <div className="field">
                <label>Last Name <span className="req">*</span></label>
                <input type="text" placeholder="Sharma" value={form.lastName} onChange={set('lastName')}
                  className={errors.lastName ? 'error' : ''} />
                {errors.lastName && <div className="err-msg show">Required</div>}
              </div>
            </div>

            {/* Student ID */}
            <div className="form-row single">
              <div className="field">
                <label>Student ID Number <span className="req">*</span></label>
                <input type="text" placeholder="e.g. 22CS1045" value={form.studentId} onChange={set('studentId')}
                  className={errors.studentId ? 'error' : ''} />
                {errors.studentId && <div className="err-msg show">Required</div>}
              </div>
            </div>

            {/* Mobile */}
            <div className="form-row single">
              <div className="field">
                <label>Mobile Number <span className="req">*</span></label>
                <div className="phone-wrap">
                  <div className="phone-prefix">+91</div>
                  <input type="tel" placeholder="9876543210" maxLength="10" value={form.mobile} onChange={set('mobile')}
                    className={errors.mobile ? 'error' : ''} />
                </div>
                {errors.mobile && <div className="err-msg show">Enter valid 10-digit number</div>}
              </div>
            </div>

            {/* Email */}
            <div className="form-row single">
              <div className="field">
                <label>Email Address</label>
                <input type="email" placeholder="rahul@college.edu" value={form.email} onChange={set('email')} />
              </div>
            </div>

            {/* College autocomplete */}
            <div className="form-row single">
              <div className="field" ref={ddRef}>
                <label>College Name <span className="req">*</span></label>
                <div className="autocomplete-wrap">
                  <input
                    type="text"
                    placeholder="Type at least 3 letters..."
                    value={collegeQuery}
                    onChange={handleCollegeInput}
                    onFocus={() => collegeQuery.length >= 3 && setShowDd(true)}
                    className={errors.college ? 'error' : ''}
                    autoComplete="off"
                  />
                  {showDd && (
                    <div className="autocomplete-dropdown">
                      {filteredColleges.map(c => (
                        <div key={c.id} className="dd-item" onMouseDown={() => selectCollege(c)}>
                          <span>{c.name}</span>
                          <span className="city-tag">{c.city}, {c.state}</span>
                        </div>
                      ))}
                      <div className="dd-add" onMouseDown={() => openNewCollege(collegeQuery)}>
                        <span>＋</span> Add "{collegeQuery}" as new college
                      </div>
                    </div>
                  )}
                </div>
                {errors.college && <div className="err-msg show">Select or add a college</div>}
              </div>
            </div>

            {/* City & State (auto-filled) */}
            <div className="form-row">
              <div className="field">
                <label>City <span className="req">*</span></label>
                <input type="text" value={form.city} readOnly style={{ background: '#f8f8f8' }}
                  className={errors.city ? 'error' : ''} />
                {errors.city && <div className="err-msg show">Required</div>}
              </div>
              <div className="field">
                <label>State <span className="req">*</span></label>
                <input type="text" value={form.state} readOnly style={{ background: '#f8f8f8' }}
                  className={errors.state ? 'error' : ''} />
                {errors.state && <div className="err-msg show">Required</div>}
              </div>
            </div>

            {/* Course & Year */}
            <div className="form-row">
              <div className="field">
                <label>Course <span className="req">*</span></label>
                <select value={form.course} onChange={set('course')} className={errors.course ? 'error' : ''}>
                  <option value="">Select course</option>
                  {COURSES.map(c => <option key={c}>{c}</option>)}
                </select>
                {errors.course && <div className="err-msg show">Select a course</div>}
              </div>
              <div className="field">
                <label>Year of Study <span className="req">*</span></label>
                <select value={form.year} onChange={set('year')} className={errors.year ? 'error' : ''}>
                  <option value="">Select year</option>
                  {YEARS.map(y => <option key={y}>{y}</option>)}
                </select>
                {errors.year && <div className="err-msg show">Select year</div>}
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Register Student →'}
            </button>
          </form>
        </div>
      </div>

      {/* New College Modal */}
      {showNewCollege && (
        <div className="overlay open" onClick={e => { if (e.target === e.currentTarget) setShowNewCollege(false); }}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--blue)', marginBottom: 4 }}>Add New College</h3>
            <p style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 20 }}>
              This college isn't in our list yet. Fill in the details to add it.
            </p>
            <div className="field">
              <label>College Name <span className="req">*</span></label>
              <input type="text" placeholder="Full college name" value={newCollegeName} onChange={e => setNewCollegeName(e.target.value)} />
            </div>
            <div className="field">
              <label>City <span className="req">*</span></label>
              <input type="text" placeholder="City" value={newCollegeCity} onChange={e => setNewCollegeCity(e.target.value)} />
            </div>
            <div className="field">
              <label>State <span className="req">*</span></label>
              <input type="text" placeholder="State" value={newCollegeState} onChange={e => setNewCollegeState(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowNewCollege(false)}>Cancel</button>
              <button className="btn-confirm" onClick={confirmNewCollege}>Add College</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
