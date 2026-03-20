-- ============================================
-- CardioConnect Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. PATIENTS TABLE
CREATE TABLE patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  diagnosis TEXT,
  notes TEXT,
  last_visit DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. TAGS TABLE
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#2980b9',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PATIENT-TAGS JUNCTION TABLE
CREATE TABLE patient_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE(patient_id, tag_id)
);

-- 4. MESSAGE TEMPLATES TABLE
CREATE TABLE templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AUTO-UPDATE TIMESTAMP
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 6. INDEXES FOR PERFORMANCE
CREATE INDEX idx_patients_name ON patients USING gin(to_tsvector('simple', name));
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_created_by ON patients(created_by);
CREATE INDEX idx_patient_tags_patient ON patient_tags(patient_id);
CREATE INDEX idx_patient_tags_tag ON patient_tags(tag_id);

-- 7. ROW LEVEL SECURITY (RLS)
-- Enable RLS on all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Policy: Any authenticated user can read/write all data
-- (This allows all staff to share data)
CREATE POLICY "Authenticated users can read patients"
  ON patients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert patients"
  ON patients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update patients"
  ON patients FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete patients"
  ON patients FOR DELETE
  TO authenticated
  USING (true);

-- Tags policies
CREATE POLICY "Authenticated users can read tags"
  ON tags FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert tags"
  ON tags FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update tags"
  ON tags FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete tags"
  ON tags FOR DELETE TO authenticated USING (true);

-- Patient_tags policies
CREATE POLICY "Authenticated users can read patient_tags"
  ON patient_tags FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert patient_tags"
  ON patient_tags FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can delete patient_tags"
  ON patient_tags FOR DELETE TO authenticated USING (true);

-- Templates policies
CREATE POLICY "Authenticated users can read templates"
  ON templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert templates"
  ON templates FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update templates"
  ON templates FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete templates"
  ON templates FOR DELETE TO authenticated USING (true);

-- 8. SEED DEFAULT TAGS (Cardiology-focused)
INSERT INTO tags (name, color) VALUES
  ('Post-PCI', '#e74c3c'),
  ('Hypertension', '#2980b9'),
  ('Diabetes', '#f39c12'),
  ('Heart Failure', '#8e44ad'),
  ('ACS', '#c0392b'),
  ('Atrial Fib', '#16a085'),
  ('Valvular HD', '#d35400'),
  ('Needs Follow-up', '#27ae60'),
  ('Urgent', '#e74c3c'),
  ('Stable', '#2ecc71');

-- 9. SEED DEFAULT TEMPLATES
INSERT INTO templates (name, body) VALUES
  ('Appointment Reminder', 'Yth. Bapak/Ibu {name}, ini adalah pengingat untuk jadwal konsultasi Anda pada {date} pukul {time} di klinik kami. Mohon datang 15 menit sebelum jadwal. Terima kasih. - Dr. Aldo Ferly'),
  ('Follow-Up Check', 'Yth. Bapak/Ibu {name}, bagaimana kondisi Anda setelah tindakan terakhir? Jika ada keluhan, silakan hubungi kami untuk kontrol. Salam sehat. - Dr. Aldo Ferly'),
  ('Lab Results Ready', 'Yth. Bapak/Ibu {name}, hasil laboratorium Anda sudah tersedia. Silakan datang ke klinik untuk konsultasi hasil. Terima kasih. - Dr. Aldo Ferly'),
  ('Medication Reminder', 'Yth. Bapak/Ibu {name}, mohon pastikan obat {medication} diminum sesuai dosis yang telah ditentukan. Jika ada efek samping, segera hubungi kami. - Dr. Aldo Ferly');
