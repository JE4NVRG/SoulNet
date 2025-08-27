-- Criar tabela memory_media para armazenar arquivos de mídia das memórias
CREATE TABLE memory_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_type text CHECK (file_type IN ('image','audio')),
  file_size integer,
  uploaded_at timestamptz DEFAULT now()
);

-- Criar índice para otimizar consultas por memory_id
CREATE INDEX idx_memory_media_memory_id ON memory_media(memory_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE memory_media ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas mídia de suas próprias memórias
CREATE POLICY "Users can view media from their own memories" ON memory_media
  FOR SELECT USING (
    memory_id IN (
      SELECT id FROM memories WHERE user_id = auth.uid()
    )
  );

-- Política para permitir que usuários insiram mídia apenas em suas próprias memórias
CREATE POLICY "Users can insert media to their own memories" ON memory_media
  FOR INSERT WITH CHECK (
    memory_id IN (
      SELECT id FROM memories WHERE user_id = auth.uid()
    )
  );

-- Política para permitir que usuários deletem mídia apenas de suas próprias memórias
CREATE POLICY "Users can delete media from their own memories" ON memory_media
  FOR DELETE USING (
    memory_id IN (
      SELECT id FROM memories WHERE user_id = auth.uid()
    )
  );

-- Conceder permissões para os roles anon e authenticated
GRANT SELECT, INSERT, DELETE ON memory_media TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;