-- Create semantic search function for memories
CREATE OR REPLACE FUNCTION semantic_search_memories(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  user_id uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  created_at timestamptz,
  updated_at timestamptz,
  sentiment text,
  confidence float,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    m.created_at,
    m.updated_at,
    m.sentiment,
    m.confidence,
    (1 - (me.embedding <=> query_embedding)) AS similarity
  FROM memories m
  INNER JOIN memory_embeddings me ON m.id = me.memory_id
  WHERE 
    m.user_id = semantic_search_memories.user_id
    AND (1 - (me.embedding <=> query_embedding)) > match_threshold
  ORDER BY me.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION semantic_search_memories TO authenticated;
GRANT EXECUTE ON FUNCTION semantic_search_memories TO anon;