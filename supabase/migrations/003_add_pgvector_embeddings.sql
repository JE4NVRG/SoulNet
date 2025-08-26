-- Sprint 2.3 - Busca Semântica
-- Ativar extensão pgvector e criar tabela memory_embeddings

-- Ativar extensão pgvector para suporte a vetores
CREATE EXTENSION IF NOT EXISTS vector;

-- Criar tabela para armazenar embeddings das memórias
CREATE TABLE IF NOT EXISTS memory_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    embedding vector(1536) NOT NULL, -- OpenAI text-embedding-3-small usa 1536 dimensões
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca vetorial eficiente usando ivfflat
-- O índice será criado após inserir dados para melhor performance
CREATE INDEX IF NOT EXISTS idx_memory_embeddings_vector 
ON memory_embeddings 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Criar índice para busca por memory_id
CREATE INDEX IF NOT EXISTS idx_memory_embeddings_memory_id 
ON memory_embeddings(memory_id);

-- Adicionar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_memory_embeddings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_memory_embeddings_updated_at
    BEFORE UPDATE ON memory_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_memory_embeddings_updated_at();

-- Habilitar RLS (Row Level Security) para a tabela
ALTER TABLE memory_embeddings ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para memory_embeddings
-- Usuários podem ver apenas seus próprios embeddings
CREATE POLICY "Users can view their own memory embeddings" ON memory_embeddings
    FOR SELECT USING (
        memory_id IN (
            SELECT id FROM memories WHERE user_id = auth.uid()
        )
    );

-- Usuários podem inserir embeddings apenas para suas próprias memórias
CREATE POLICY "Users can insert embeddings for their own memories" ON memory_embeddings
    FOR INSERT WITH CHECK (
        memory_id IN (
            SELECT id FROM memories WHERE user_id = auth.uid()
        )
    );

-- Usuários podem atualizar embeddings apenas de suas próprias memórias
CREATE POLICY "Users can update their own memory embeddings" ON memory_embeddings
    FOR UPDATE USING (
        memory_id IN (
            SELECT id FROM memories WHERE user_id = auth.uid()
        )
    );

-- Usuários podem deletar embeddings apenas de suas próprias memórias
CREATE POLICY "Users can delete their own memory embeddings" ON memory_embeddings
    FOR DELETE USING (
        memory_id IN (
            SELECT id FROM memories WHERE user_id = auth.uid()
        )
    );

-- Conceder permissões para os roles anon e authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON memory_embeddings TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Comentários para documentação
COMMENT ON TABLE memory_embeddings IS 'Armazena embeddings vetoriais das memórias para busca semântica';
COMMENT ON COLUMN memory_embeddings.embedding IS 'Vetor de 1536 dimensões gerado pelo modelo text-embedding-3-small da OpenAI';
COMMENT ON INDEX idx_memory_embeddings_vector IS 'Índice ivfflat para busca de similaridade de cosseno eficiente';