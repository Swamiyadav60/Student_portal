import { useState } from 'react';
import { updateStudentNotes, updateStudentPOC, updateStudentReferral, deleteStudent } from '../lib/storage';
import PocInput from './PocInput';

const STATUSES = ['New Lead','College Contacted','Discussion Started','Demo Done','Installed','Follow Up','Lost'];

const WA_SVG = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function DetailPanel({ student, referrals, customFields, pocs, onPocsChange, onClose, onStatusChange, onStudentUpdate, onStudentDelete, showToast }) {
  const [notes, setNotes] = useState(student?.notes || '');
  const [localPoc, setLocalPoc] = useState(student?.poc || '');
  const [showOverride, setShowOverride] = useState(false);
  const [overrideRef, setOverrideRef] = useState(student?.refCode || 'direct');
  const [overrideReason, setOverrideReason] = useState('');

  if (!student) return null;

  const s = student;
  const waMsg = encodeURIComponent(`Hi ${s.firstName}, This is ${s.poc || 'the team'} from Smart Printer`);
  const refInfo = referrals.find(r => r.code === s.refCode);

  const handleSaveNotes = async () => {
    await updateStudentNotes(s.id, notes);
    onStudentUpdate({ ...s, notes });
    showToast('Notes saved');
  };

  const handlePocChange = async (val) => {
    setLocalPoc(val);
    await updateStudentPOC(s.id, val);
    onStudentUpdate({ ...s, poc: val });
    showToast('POC updated');
  };

  const handleStatusChange = async (status) => {
    onStatusChange(s.id, status);
    showToast('Status updated');
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this student record? This cannot be undone.')) return;
    await deleteStudent(s.id);
    onStudentDelete(s.id);
    onClose();
    showToast('Student deleted');
  };

  const confirmOverride = async () => {
    const ref = referrals.find(r => r.code === overrideRef);
    const newLabel = ref ? ref.name : 'Direct';
    const overrideLog = [...(s.overrideLog || []), {
      by: 'Admin', reason: overrideReason, at: new Date().toISOString(),
      newRef: overrideRef, newLabel
    }];
    await updateStudentReferral(s.id, overrideRef, newLabel, overrideLog);
    onStudentUpdate({ ...s, refCode: overrideRef, refLabel: newLabel, overrideLog });
    setShowOverride(false);
    showToast('Referral credit overridden');
  };

  return (
    <>
      <div className={`detail-panel open`}>
        <div className="dp-header">
          <div className="dp-avatar">{s.firstName[0]}{s.lastName[0]}</div>
          <div>
            <div className="dp-name">{s.firstName} {s.lastName}</div>
            <div className="dp-sub">{s.collegeName} · {s.course}</div>
          </div>
          <button className="dp-close" onClick={onClose}>✕</button>
        </div>

        <div className="dp-body">
          {/* Student Info */}
          <div className="dp-section">
            <div className="dp-section-title">Student Info</div>
            <div className="dp-row">
              <span className="lbl">Student ID</span>
              <span className="val" style={{ fontFamily: 'monospace' }}>{s.studentId}</span>
            </div>
            <div className="dp-row">
              <span className="lbl">Mobile</span>
              <span className="val" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                +91 {s.mobile}
                <a className="wa-btn" href={`https://wa.me/91${s.mobile}?text=${waMsg}`} target="_blank" rel="noreferrer">{WA_SVG}</a>
              </span>
            </div>
            <div className="dp-row">
              <span className="lbl">Email</span>
              <span className="val">{s.email || '—'}</span>
            </div>
            <div className="dp-row">
              <span className="lbl">POC</span>
              <span className="val" style={{ flex: 1 }}>
                <div style={{ position: 'relative' }}>
                  <PocInput
                    value={localPoc}
                    onChange={handlePocChange}
                    pocs={pocs}
                    onPocsChange={onPocsChange}
                    inputStyle={{ border: '1.5px solid var(--border)', borderRadius: 7, padding: '5px 10px', fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none', width: '100%' }}
                  />
                </div>
              </span>
            </div>
          </div>

          {/* College Info */}
          <div className="dp-section">
            <div className="dp-section-title">College Info</div>
            <div className="dp-row"><span className="lbl">College</span><span className="val">{s.collegeName}</span></div>
            <div className="dp-row"><span className="lbl">City</span><span className="val">{s.city}</span></div>
            <div className="dp-row"><span className="lbl">State</span><span className="val">{s.state}</span></div>
            <div className="dp-row"><span className="lbl">Course</span><span className="val">{s.course}</span></div>
            <div className="dp-row"><span className="lbl">Year</span><span className="val">{s.year}</span></div>
          </div>

          {/* Pipeline Status */}
          <div className="dp-section">
            <div className="dp-section-title">Pipeline Status</div>
            <div style={{ marginBottom: 10 }}>
              <select
                className="status-select"
                style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
                value={s.status}
                onChange={e => handleStatusChange(e.target.value)}
              >
                {STATUSES.map(st => <option key={st}>{st}</option>)}
              </select>
            </div>
            <div className="dp-row">
              <span className="lbl">Added</span>
              <span className="val">{new Date(s.createdAt).toLocaleDateString('en-IN')}</span>
            </div>
            <div className="dp-row">
              <span className="lbl">Updated</span>
              <span className="val">{new Date(s.updatedAt).toLocaleDateString('en-IN')}</span>
            </div>
          </div>

          {/* Referral */}
          <div className="dp-section">
            <div className="dp-section-title">Referral</div>
            <div className="dp-row">
              <span className="lbl">Referred by</span>
              <span className="val" style={{ fontWeight: 700, color: 'var(--blue)' }}>{s.refLabel || s.refCode}</span>
            </div>
            {refInfo && (
              <div className="dp-row">
                <span className="lbl">Contact</span>
                <span className="val">{refInfo.phone || refInfo.email || refInfo.social_handle || '—'}</span>
              </div>
            )}
            {s.isDuplicate && s.duplicateAttempts?.length > 0 && (
              <div className="override-box">
                <div className="title">⚠ Duplicate Detected</div>
                <p>This student was also referred by other influencers. First-touch credit is locked to <strong>{s.refLabel}</strong>.</p>
                <div className="override-history">
                  {s.duplicateAttempts.map((a, i) => (
                    <div key={i}>Attempted by <strong>{a.refLabel}</strong> on {new Date(a.attemptedAt).toLocaleDateString('en-IN')}</div>
                  ))}
                </div>
                <button className="btn-sm btn-red" style={{ fontSize: 12 }} onClick={() => setShowOverride(true)}>
                  Override Referral Credit
                </button>
              </div>
            )}
          </div>

          {/* Custom Fields */}
          {customFields.length > 0 && (
            <div className="dp-section">
              <div className="dp-section-title">Custom Fields</div>
              {customFields.map(f => (
                <div className="dp-row" key={f.id}>
                  <span className="lbl">{f.name}</span>
                  <span className="val">{s.customFields?.[f.id] || '—'}</span>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          <div className="dp-section">
            <div className="dp-section-title">Notes</div>
            <textarea
              className="notes-area"
              placeholder="Add notes about this student..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            <button className="btn-sm btn-blue" style={{ marginTop: 8, width: '100%' }} onClick={handleSaveNotes}>
              Save Notes
            </button>
          </div>

          {/* Delete */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <button
              className="btn-sm"
              style={{ width: '100%', background: 'var(--red-light)', color: 'var(--red)', fontSize: 12, border: '1px solid #fca5a5' }}
              onClick={handleDelete}
            >
              Delete Student Record
            </button>
          </div>
        </div>
      </div>

      {/* Override Modal */}
      {showOverride && (
        <div className="overlay open" onClick={e => { if (e.target === e.currentTarget) setShowOverride(false); }}>
          <div className="modal">
            <div className="modal-title">
              Override Referral Credit
              <button className="modal-close" onClick={() => setShowOverride(false)}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 16 }}>
              You are manually overriding the referral credit for <strong>{s.firstName} {s.lastName}</strong>. This action is logged.
            </p>
            <div className="form-field">
              <label>Assign Credit To</label>
              <select value={overrideRef} onChange={e => setOverrideRef(e.target.value)}>
                <option value="direct">Direct (No Referral)</option>
                {referrals.map(r => <option key={r.id} value={r.code}>{r.name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Reason</label>
              <textarea rows="2" placeholder="Why are you overriding?" value={overrideReason} onChange={e => setOverrideReason(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowOverride(false)}>Cancel</button>
              <button className="btn-danger" onClick={confirmOverride}>Override</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
