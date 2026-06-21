import { supabase } from './supabase';

// ── COLLEGES ──────────────────────────────────────────────────────────────
export async function getColleges() {
  const { data, error } = await supabase.from('colleges').select('*').order('name');
  if (error) { console.error(error); return []; }
  return data || [];
}

export async function saveCollege(college) {
  const row = {
    id: college.id || 'c_' + Date.now(),
    name: college.name,
    city: college.city,
    state: college.state,
    is_new: college.isNew || false,
  };
  const { data, error } = await supabase.from('colleges').upsert(row).select().single();
  if (error) { console.error(error); return null; }
  return data;
}

export async function deleteCollege(id) {
  const { error } = await supabase.from('colleges').delete().eq('id', id);
  if (error) console.error(error);
}

// ── STUDENTS ──────────────────────────────────────────────────────────────
export async function getStudents() {
  const { data, error } = await supabase.from('students').select('*').order('created_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return (data || []).map(mapStudent);
}

export async function saveStudent(student) {
  const row = {
    id: student.id || 'st_' + Date.now(),
    first_name: student.firstName,
    last_name: student.lastName,
    student_id: student.studentId,
    mobile: student.mobile,
    email: student.email || '',
    college_id: student.collegeId || '',
    college_name: student.collegeName || '',
    city: student.city || '',
    state: student.state || '',
    course: student.course || '',
    year: student.year || '',
    poc: student.poc || '',
    ref_code: student.refCode || 'direct',
    ref_label: student.refLabel || 'Direct',
    status: student.status || 'New Lead',
    is_duplicate: student.isDuplicate || false,
    duplicate_attempts: student.duplicateAttempts || [],
    override_log: student.overrideLog || [],
    notes: student.notes || '',
    custom_fields: student.customFields || {},
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('students').upsert(row).select().single();
  if (error) { console.error(error); return null; }
  return mapStudent(data);
}

export async function deleteStudent(id) {
  const { error } = await supabase.from('students').delete().eq('id', id);
  if (error) console.error(error);
}

export async function updateStudentStatus(id, status) {
  const { error } = await supabase.from('students').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) console.error(error);
}

export async function updateStudentPOC(id, poc) {
  const { error } = await supabase.from('students').update({ poc, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) console.error(error);
}

export async function updateStudentNotes(id, notes) {
  const { error } = await supabase.from('students').update({ notes, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) console.error(error);
}

export async function updateStudentReferral(id, refCode, refLabel, overrideLog) {
  const { error } = await supabase.from('students').update({
    ref_code: refCode,
    ref_label: refLabel,
    override_log: overrideLog,
    updated_at: new Date().toISOString()
  }).eq('id', id);
  if (error) console.error(error);
}

function mapStudent(row) {
  if (!row) return null;
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    studentId: row.student_id,
    mobile: row.mobile,
    email: row.email,
    collegeId: row.college_id,
    collegeName: row.college_name,
    city: row.city,
    state: row.state,
    course: row.course,
    year: row.year,
    poc: row.poc,
    refCode: row.ref_code,
    refLabel: row.ref_label,
    status: row.status,
    isDuplicate: row.is_duplicate,
    duplicateAttempts: row.duplicate_attempts || [],
    overrideLog: row.override_log || [],
    notes: row.notes,
    customFields: row.custom_fields || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── REFERRALS ─────────────────────────────────────────────────────────────
export async function getReferrals() {
  const { data, error } = await supabase.from('referrals').select('*').order('created_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return data || [];
}

export async function saveReferral(ref) {
  const row = {
    id: ref.id || 'r_' + Date.now(),
    code: ref.code,
    name: ref.name,
    phone: ref.phone || '',
    email: ref.email || '',
    social_handle: ref.socialHandle || '',
    notes: ref.notes || '',
  };
  const { data, error } = await supabase.from('referrals').upsert(row).select().single();
  if (error) { console.error(error); return null; }
  return data;
}

export async function deleteReferral(id) {
  const { error } = await supabase.from('referrals').delete().eq('id', id);
  if (error) console.error(error);
}

// ── CUSTOM FIELDS ─────────────────────────────────────────────────────────
export async function getCustomFields() {
  const { data, error } = await supabase.from('custom_fields').select('*').order('sort_order');
  if (error) { console.error(error); return []; }
  return data || [];
}

export async function saveCustomField(field) {
  const row = {
    id: field.id || 'cf_' + Date.now(),
    name: field.name,
    type: field.type,
    required: field.required || false,
    options: field.options || [],
    sort_order: field.sortOrder || 0,
  };
  const { data, error } = await supabase.from('custom_fields').upsert(row).select().single();
  if (error) { console.error(error); return null; }
  return data;
}

export async function deleteCustomField(id) {
  const { error } = await supabase.from('custom_fields').delete().eq('id', id);
  if (error) console.error(error);
}

// ── POCS ──────────────────────────────────────────────────────────────────
export async function getPOCs() {
  const { data, error } = await supabase.from('pocs').select('*').order('name');
  if (error) { console.error(error); return ['Shabari', 'Rahul', 'Ananya']; }
  return (data || []).map(p => p.name);
}

export async function savePOC(name) {
  const { error } = await supabase.from('pocs').upsert({ name }, { onConflict: 'name' });
  if (error) console.error(error);
}

export async function deletePOC(name) {
  const { error } = await supabase.from('pocs').delete().eq('name', name);
  if (error) console.error(error);
}
