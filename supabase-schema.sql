-- SmartPrinter CRM - Supabase Schema
-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- 1. Colleges table
CREATE TABLE IF NOT EXISTS colleges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  is_new BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Students table
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT,
  college_id TEXT,
  college_name TEXT,
  city TEXT,
  state TEXT,
  course TEXT,
  year TEXT,
  poc TEXT,
  ref_code TEXT DEFAULT 'direct',
  ref_label TEXT DEFAULT 'Direct',
  status TEXT DEFAULT 'New Lead',
  is_duplicate BOOLEAN DEFAULT false,
  duplicate_attempts JSONB DEFAULT '[]'::jsonb,
  override_log JSONB DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  custom_fields JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Referrals (influencers) table
CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  social_handle TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Custom fields table
CREATE TABLE IF NOT EXISTS custom_fields (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text',
  required BOOLEAN DEFAULT false,
  options JSONB DEFAULT '[]'::jsonb,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. POCs (Point of Contact) table
CREATE TABLE IF NOT EXISTS pocs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════
-- Row Level Security: Allow all operations for now
-- (tighten later for production)
-- ═══════════════════════════════════════════════════════

ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE pocs ENABLE ROW LEVEL SECURITY;

-- Policies: allow authenticated users full access
CREATE POLICY "Allow all for authenticated" ON colleges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON referrals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON custom_fields FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON pocs FOR ALL USING (true) WITH CHECK (true);

-- Public insert for students (registration form is public)
-- Public read for colleges (registration form needs it)

-- ═══════════════════════════════════════════════════════
-- Seed Data
-- ═══════════════════════════════════════════════════════

-- Default colleges
INSERT INTO colleges (id, name, city, state) VALUES
  ('c1', 'Osmania University', 'Hyderabad', 'Telangana'),
  ('c2', 'JNTU Hyderabad', 'Hyderabad', 'Telangana'),
  ('c3', 'University of Hyderabad', 'Hyderabad', 'Telangana'),
  ('c4', 'Chaitanya Bharathi Institute of Technology', 'Hyderabad', 'Telangana'),
  ('c5', 'Vasavi College of Engineering', 'Hyderabad', 'Telangana'),
  ('c6', 'BITS Pilani Hyderabad', 'Hyderabad', 'Telangana'),
  ('c7', 'VIT Vellore', 'Vellore', 'Tamil Nadu'),
  ('c8', 'Anna University', 'Chennai', 'Tamil Nadu'),
  ('c9', 'SRM Institute of Science and Technology', 'Chennai', 'Tamil Nadu'),
  ('c10', 'PSG College of Technology', 'Coimbatore', 'Tamil Nadu'),
  ('c11', 'Amrita Vishwa Vidyapeetham', 'Coimbatore', 'Tamil Nadu'),
  ('c12', 'Manipal Institute of Technology', 'Manipal', 'Karnataka'),
  ('c13', 'PES University', 'Bengaluru', 'Karnataka'),
  ('c14', 'RV College of Engineering', 'Bengaluru', 'Karnataka'),
  ('c15', 'BMS College of Engineering', 'Bengaluru', 'Karnataka'),
  ('c16', 'IIIT Hyderabad', 'Hyderabad', 'Telangana'),
  ('c17', 'NIT Warangal', 'Warangal', 'Telangana'),
  ('c18', 'NIT Trichy', 'Tiruchirappalli', 'Tamil Nadu'),
  ('c19', 'IIT Bombay', 'Mumbai', 'Maharashtra'),
  ('c20', 'IIT Delhi', 'New Delhi', 'Delhi'),
  ('c21', 'IIT Madras', 'Chennai', 'Tamil Nadu'),
  ('c22', 'IIT Hyderabad', 'Hyderabad', 'Telangana'),
  ('c23', 'Pune University', 'Pune', 'Maharashtra'),
  ('c24', 'College of Engineering Pune', 'Pune', 'Maharashtra'),
  ('c25', 'Savitribai Phule Pune University', 'Pune', 'Maharashtra'),
  ('hyd_vnr', 'VNR Vignana Jyothi Institute of Engineering and Technology (VNRVJIET)', 'Hyderabad', 'Telangana'),
  ('hyd_griet', 'Gokaraju Rangaraju Institute of Engineering and Technology (GRIET)', 'Hyderabad', 'Telangana'),
  ('hyd_mvsr', 'Maturi Venkata Subba Rao (MVSR) Engineering College', 'Hyderabad', 'Telangana'),
  ('hyd_snist', 'Sreenidhi Institute of Science and Technology (SNIST)', 'Hyderabad', 'Telangana'),
  ('hyd_kmit', 'Keshav Memorial Institute of Technology (KMIT)', 'Hyderabad', 'Telangana'),
  ('hyd_mgit', 'Mahatma Gandhi Institute of Technology (MGIT)', 'Hyderabad', 'Telangana'),
  ('hyd_vardhaman', 'Vardhaman College of Engineering', 'Hyderabad', 'Telangana'),
  ('hyd_cvr', 'CVR College of Engineering', 'Hyderabad', 'Telangana'),
  ('hyd_mrec', 'Malla Reddy Engineering College (MREC)', 'Hyderabad', 'Telangana'),
  ('hyd_mrcet', 'Malla Reddy College of Engineering and Technology (MRCET)', 'Hyderabad', 'Telangana'),
  ('hyd_cmrcet', 'CMR College of Engineering & Technology (CMRCET)', 'Hyderabad', 'Telangana'),
  ('hyd_cmrtc', 'CMR Technical Campus (CMRTC)', 'Hyderabad', 'Telangana'),
  ('hyd_cmrit', 'CMR Institute of Technology (CMRIT)', 'Hyderabad', 'Telangana'),
  ('hyd_gnits', 'G. Narayanamma Institute of Technology and Science (GNITS)', 'Hyderabad', 'Telangana'),
  ('hyd_mjcet', 'Muffakham Jah College of Engineering and Technology (MJCET)', 'Hyderabad', 'Telangana'),
  ('hyd_vbit', 'Vignana Bharathi Institute of Technology (VBIT)', 'Hyderabad', 'Telangana'),
  ('hyd_gits', 'Geethanjali College of Engineering and Technology (GCET)', 'Hyderabad', 'Telangana'),
  ('hyd_tkr', 'TKR College of Engineering and Technology (TKRCET)', 'Hyderabad', 'Telangana'),
  ('hyd_jbiet', 'JB Institute of Engineering and Technology (JBIET)', 'Hyderabad', 'Telangana'),
  ('hyd_lords', 'Lords Institute of Engineering and Technology', 'Hyderabad', 'Telangana'),
  ('hyd_stanley', 'Stanley College of Engineering and Technology for Women', 'Hyderabad', 'Telangana'),
  ('hyd_methodist', 'Methodist College of Engineering and Technology', 'Hyderabad', 'Telangana'),
  ('hyd_ngit', 'Neil Gogte Institute of Technology (NGIT)', 'Hyderabad', 'Telangana'),
  ('hyd_shadan', 'Shadan College of Engineering and Technology', 'Hyderabad', 'Telangana'),
  ('hyd_deccan', 'Deccan College of Engineering and Technology', 'Hyderabad', 'Telangana'),
  ('hyd_isl', 'ISL Engineering College', 'Hyderabad', 'Telangana'),
  ('hyd_matrusri', 'Matrusri Engineering College', 'Hyderabad', 'Telangana'),
  ('hyd_guru_nanak', 'Guru Nanak Institutions Technical Campus (GNITC)', 'Hyderabad', 'Telangana'),
  ('hyd_sathyabama', 'Sathyabama University Hyderabad Campus', 'Hyderabad', 'Telangana'),
  ('hyd_iare', 'Institute of Aeronautical Engineering (IARE)', 'Hyderabad', 'Telangana')
ON CONFLICT (id) DO NOTHING;

-- Default POCs
INSERT INTO pocs (name) VALUES ('Shabari'), ('Rahul'), ('Ananya')
ON CONFLICT (name) DO NOTHING;

-- Demo referrals
INSERT INTO referrals (id, code, name, phone, notes) VALUES
  ('r1', 'priya2024', 'Priya Sharma', '@priyasharma', 'Instagram influencer'),
  ('r2', 'arjun_sp', 'Arjun Reddy', '+91 98765 00000', 'YouTube campus vlogger')
ON CONFLICT (id) DO NOTHING;

-- Demo students
INSERT INTO students (id, first_name, last_name, student_id, mobile, email, college_id, college_name, city, state, course, year, poc, ref_code, ref_label, status, is_duplicate, notes, created_at) VALUES
  ('st_1', 'Aditya', 'Kumar', '22CS1001', '9876543210', 'aditya@jntu.ac.in', 'c2', 'JNTU Hyderabad', 'Hyderabad', 'Telangana', 'B.Tech / B.E.', '3rd Year', 'Shabari', 'priya2024', 'Priya Sharma', 'Discussion Started', false, 'Very interested in the printing service', now() - interval '5 days'),
  ('st_2', 'Sneha', 'Patel', '23MBA201', '8765432109', 'sneha@osmania.ac.in', 'c1', 'Osmania University', 'Hyderabad', 'Telangana', 'MBA', '1st Year', 'Rahul', 'arjun_sp', 'Arjun Reddy', 'New Lead', false, '', now() - interval '3 days'),
  ('st_3', 'Rahul', 'Nair', '21ECE3045', '7654321098', 'rahul@vit.ac.in', 'c7', 'VIT Vellore', 'Vellore', 'Tamil Nadu', 'B.Tech / B.E.', '4th Year', 'Shabari', 'priya2024', 'Priya Sharma', 'Installed', false, 'Printer installed in main block', now() - interval '10 days'),
  ('st_4', 'Kavya', 'Singh', '22BCA105', '6543210987', 'kavya@anna.ac.in', 'c8', 'Anna University', 'Chennai', 'Tamil Nadu', 'BCA', '2nd Year', '', 'direct', 'Direct', 'College Contacted', true, '', now() - interval '7 days'),
  ('st_5', 'Mohammed', 'Rizwan', '23CS2089', '5432109876', 'rizwan@bits.ac.in', 'c6', 'BITS Pilani Hyderabad', 'Hyderabad', 'Telangana', 'B.Tech / B.E.', '1st Year', 'Ananya', 'arjun_sp', 'Arjun Reddy', 'Demo Done', false, 'Demo scheduled for next week', now() - interval '2 days')
ON CONFLICT (id) DO NOTHING;
