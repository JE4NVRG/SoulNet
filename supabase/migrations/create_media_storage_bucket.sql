-- Criar bucket 'media' no Supabase Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', false)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir que usuários vejam apenas arquivos de suas próprias memórias
CREATE POLICY "Users can view media from their own memories" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para permitir que usuários façam upload apenas em suas próprias pastas
CREATE POLICY "Users can upload media to their own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para permitir que usuários deletem apenas seus próprios arquivos
CREATE POLICY "Users can delete their own media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para permitir que usuários atualizem apenas seus próprios arquivos
CREATE POLICY "Users can update their own media" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );