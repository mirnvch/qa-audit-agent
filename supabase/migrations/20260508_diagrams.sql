-- Diagrams: хранилище Excalidraw-диаграмм для встраивания в MDX-уроки курса.
-- Каждая диаграмма имеет уникальный slug (используется в <Diagram id="..." />),
-- сам файл .excalidraw как jsonb и две предсгенерённые SVG для светлой/тёмной темы.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- update_updated_at() уже определена в 20260401_qa_reports.sql — переиспользуем.

-- ─── Diagrams ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS diagrams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- человекочитаемый id для вставки в MDX, напр. "cafe-vs-restaurant"
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  description text CHECK (description IS NULL OR length(description) <= 1000),
  tags text[] NOT NULL DEFAULT '{}',
  -- сам файл .excalidraw (elements, appState, files) целиком
  excalidraw_data jsonb NOT NULL,
  -- предсгенерённые SVG для двух тем — экспортируются клиентом перед сохранением
  svg_light text,
  svg_dark text,
  -- ЗАРЕЗЕРВИРОВАНО: в Phase 1 не наполняется. Каталог считает usages
  -- на лету через fs-scan content/lessons/*.mdx (см. lib/learn/diagrams/usage-scan.ts).
  used_in_lessons text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS diagrams_slug_idx ON diagrams(slug);
CREATE INDEX IF NOT EXISTS diagrams_tags_idx ON diagrams USING gin(tags);
CREATE INDEX IF NOT EXISTS diagrams_created_at_idx ON diagrams(created_at DESC);

CREATE TRIGGER set_updated_at_diagrams
  BEFORE UPDATE ON diagrams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── RLS ───────────────────────────────────────────────────────────────────
-- Только залогиненные пользователи могут читать/писать диаграммы.
-- Публичный <Diagram>-компонент в client-портале НЕ должен использовать
-- эту таблицу напрямую (сейчас портал не предполагается).
ALTER TABLE diagrams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diagrams_select_authenticated"
  ON diagrams FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "diagrams_insert_authenticated"
  ON diagrams FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "diagrams_update_authenticated"
  ON diagrams FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "diagrams_delete_authenticated"
  ON diagrams FOR DELETE
  USING (auth.role() = 'authenticated');
