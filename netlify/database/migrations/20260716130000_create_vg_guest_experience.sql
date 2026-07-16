CREATE TABLE IF NOT EXISTS vg_semesters (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  range_text TEXT NOT NULL DEFAULT '',
  payload BYTEA NOT NULL,
  payload_encoding TEXT NOT NULL DEFAULT 'gzip-json-v1',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vg_semesters_start_date_idx ON vg_semesters (start_date DESC);

CREATE TABLE IF NOT EXISTS vg_settings (
  id TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO vg_settings (id, value)
VALUES ('regions', $json${"vila gale estoril":"Lisboa","vila gale collection palacio dos arcos":"Lisboa","vila gale cascais":"Lisboa","vila gale sintra":"Lisboa","vila gale ericeira":"Lisboa","vila gale opera":"Lisboa","vila gale collection s.miguel":"Ilhas","vila gale santa cruz":"Ilhas","vila gale porto":"Norte","vila gale porto ribeira":"Norte","vila gale collection braga":"Norte","vila gale collection douro":"Norte","vila gale douro vineyards":"Norte","vila gale collection ponte de lima":"Norte","vila gale collection tomar":"Norte","vila gale coimbra":"Centro","vila gale serra da estrela":"Centro","vila gale collection figueira da foz":"Centro"}$json$::jsonb)
ON CONFLICT (id) DO NOTHING;
