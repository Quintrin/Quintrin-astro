CREATE TABLE qfsl_phase0_intake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_ref TEXT,
  document_date DATE,
  board_resolution TEXT,

  entity_type TEXT,
  legal_name TEXT NOT NULL,
  registered_address TEXT,
  operating_address TEXT,
  country TEXT,
  registration_number TEXT,
  tin TEXT,
  rep_name TEXT,
  rep_title TEXT,
  rep_email TEXT,
  rep_phone TEXT,

  bank_age TEXT,
  bank_profile TEXT,

  company_type TEXT[],
  business_scope TEXT,
  jurisdictions TEXT,
  transaction_value NUMERIC,
  encumbered BOOLEAN,
  encumbrance_details TEXT,

  ubo_name TEXT,
  ubo_nationality TEXT,
  ubo_control_type TEXT,
  pep_status BOOLEAN,
  pep_details TEXT,

  source_of_funds TEXT,
  source_of_wealth TEXT,
  sanctions BOOLEAN,
  litigation BOOLEAN,
  third_party BOOLEAN,

  data_entry_mode TEXT,
  qfsl_reason TEXT,
  info_source TEXT,

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
