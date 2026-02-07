CREATE TABLE qfsl_master_register (
  id SERIAL PRIMARY KEY,
  document_ref TEXT UNIQUE,
  form_id UUID REFERENCES qfsl_phase0_intake(id),
  category TEXT DEFAULT 'Phase0 Compliance',
  created_at TIMESTAMP DEFAULT now()
);
