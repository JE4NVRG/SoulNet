import express, { type Request, type Response } from 'express'
import { supabaseServer } from '../../src/lib/supabaseServer'
import { requireAuth, userScopedClient } from '../middleware/auth'
import type { CreateMemoryRequest, UpdateMemoryRequest, GetMemoriesRequest, MemoryResponse, MemoriesListResponse, SentimentAnalysis, SemanticSearchRequest, SemanticSearchResponse, GenerateEmbeddingsRequest } from '../../src/types/api'
import type { Json } from '../../src/types/database'
import OpenAI from 'openai'
import dotenv from 'dotenv'
import { checkAndUnlockAchievements } from '../middleware/achievements'

dotenv.config()

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Sentiment analysis function
async function analyzeSentiment(content: string): Promise<SentimentAnalysis> {
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-mini',
      messages: [
        {
          role: 'system',
          content: `Analise o sentimento do texto fornecido e retorne APENAS um JSON válido no formato:
{"sentiment": "positive|negative|neutral", "confidence": 0.95}

Onde:
- sentiment: "positive" para sentimentos positivos, "negative" para negativos, "neutral" para neutros
- confidence: número entre 0.0 e 1.0 indicando a confiança da análise

Não inclua explicações, apenas o JSON.`
        },
        {
          role: 'user',
          content: content
        }
      ],
      max_tokens: 50,
      temperature: 0.1,
    })

    const result = completion.choices[0]?.message?.content?.trim()
    if (!result) {
      return { sentiment: 'neutral', confidence: 0.5 }
    }

    try {
      const parsed = JSON.parse(result)
      return {
        sentiment: parsed.sentiment || 'neutral',
        confidence: Math.min(Math.max(parsed.confidence || 0.5, 0.0), 1.0)
      }
    } catch {
      return { sentiment: 'neutral', confidence: 0.5 }
    }
  } catch (error) {
    console.error('Error analyzing sentiment:', error)
    return { sentiment: 'neutral', confidence: 0.5 }
  }
}

type AuthenticatedRequest = Request & { user: { id: string; email: string }; token: string }

const router = express.Router()

// GET /api/memories - List memories with pagination and filtering
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user
    const { page = 1, limit = 20, type } = req.query as GetMemoriesRequest
    
    // Validate pagination parameters
    const pageNum = Math.max(1, Number(page))
    const limitNum = Math.min(100, Math.max(1, Number(limit)))
    const offset = (pageNum - 1) * limitNum
    
    // Build query
    let query = supabaseServer
      .from('memories')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1)
    
    // Add type filter if provided
    if (type && ['profile', 'preference', 'goal', 'skill', 'fact'].includes(type as string)) {
      query = query.eq('type', type)
    }
    
    const { data: memories, error, count } = await query
    
    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch memories'
      })
    }
    
    const totalPages = Math.ceil((count || 0) / limitNum)
    
    const response: MemoriesListResponse = {
      memories: memories || [],
      total: count || 0,
      page: pageNum,
      totalPages
    }
    
    res.json(response)
  } catch (error) {
    console.error('Error fetching memories:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

// POST /api/memories - Create a new memory
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user
    const { type, content, importance = 3, source = {} } = req.body as CreateMemoryRequest
    
    // Validate required fields
    if (!type || !content) {
      return res.status(400).json({
        success: false,
        error: 'Type and content are required'
      })
    }
    
    // Validate memory type
    if (!['profile', 'preference', 'goal', 'skill', 'fact'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid memory type'
      })
    }
    
    // Validate importance
    if (importance < 1 || importance > 5) {
      return res.status(400).json({
        success: false,
        error: 'Importance must be between 1 and 5'
      })
    }

    // Analyze sentiment
    const sentimentAnalysis = await analyzeSentiment(content)

    // Create memory with sentiment analysis
    const { data: memory, error } = await supabaseServer
      .from('memories')
      .insert({
        user_id: user.id,
        type,
        content,
        importance,
        source: source as Json,
        sentiment: sentimentAnalysis.sentiment,
        confidence: sentimentAnalysis.confidence
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating memory:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to create memory'
      })
    }
    
    // Check and unlock achievements after creating memory
    let newAchievements: any[] = [];
    try {
      const achievementResults = await checkAndUnlockAchievements(user.id);
      newAchievements = achievementResults.filter(result => result.isNew);
    } catch (error) {
      console.error('Error checking achievements:', error);
      // Don't fail the memory creation if achievement check fails
    }

    const response: MemoryResponse = {
      id: memory.id,
      success: true,
      newAchievements: newAchievements.map(a => a.type)
    }
    
    res.status(201).json(response)
  } catch (error) {
    console.error('Error creating memory:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

// PUT /api/memories/:id - Update a memory
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user
    const { id } = req.params
    const { type, content, importance, source } = req.body as UpdateMemoryRequest
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Memory ID is required'
      })
    }
    
    // Build update object with only provided fields
    const updateData: Partial<{
      type: 'profile' | 'preference' | 'goal' | 'skill' | 'fact';
      content: string;
      importance: number;
      source: Json;
      updated_at: string;
    }> = {}
    
    if (type !== undefined) {
      // Validate memory type
      if (!['profile', 'preference', 'goal', 'skill', 'fact'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid memory type'
        })
      }
      updateData.type = type
    }
    
    if (content !== undefined) {
      if (!content.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Content cannot be empty'
        })
      }
      updateData.content = content
    }
    
    if (importance !== undefined) {
      // Validate importance
      if (importance < 1 || importance > 5) {
        return res.status(400).json({
          success: false,
          error: 'Importance must be between 1 and 5'
        })
      }
      updateData.importance = importance
    }
    
    if (source !== undefined) {
      updateData.source = source as Json
    }
    
    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields provided for update'
      })
    }
    
    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString()
    
    // Update memory (RLS will ensure user can only update their own memories)
    const { data: memory, error } = await supabaseServer
      .from('memories')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating memory:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to update memory'
      })
    }
    
    if (!memory) {
      return res.status(404).json({
        success: false,
        error: 'Memory not found or you do not have permission to update it'
      })
    }
    
    const response: MemoryResponse = {
      id: memory.id,
      success: true
    }
    
    res.json(response)
  } catch (error) {
    console.error('Error updating memory:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

// DELETE /api/memories/:id - Delete a memory
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user
    const { id } = req.params
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Memory ID is required'
      })
    }
    
    // Delete memory (RLS will ensure user can only delete their own memories)
    const { error } = await supabaseServer
      .from('memories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    
    if (error) {
      console.error('Error deleting memory:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to delete memory'
      })
    }
    
    res.json({
      success: true
    })
  } catch (error) {
    console.error('Error deleting memory:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

// POST /api/memories/search - Semantic search using embeddings
router.post('/search', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user
    const { query, k = 10 } = req.body as SemanticSearchRequest
    
    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      })
    }
    
    // Validate k parameter
    const limitNum = Math.min(50, Math.max(1, Number(k)))
    
    try {
      // Generate embedding for the search query
      const embeddingResponse = await openai.embeddings.create({
        model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
        input: query.trim(),
      })
      
      const queryEmbedding = embeddingResponse.data[0]?.embedding
      if (!queryEmbedding) {
        return res.status(500).json({
          success: false,
          error: 'Failed to generate query embedding'
        })
      }
      
      // Perform semantic search using cosine similarity
      const threshold = parseFloat(process.env.SEMANTIC_SEARCH_THRESHOLD || '0.75')
      
      const { data: results, error } = await supabaseServer.rpc('semantic_search_memories', {
        query_embedding: JSON.stringify(queryEmbedding),
        match_threshold: threshold,
        match_count: limitNum,
        user_id: user.id
      })
      
      if (error) {
        console.error('Semantic search error:', error)
        return res.status(500).json({
          success: false,
          error: 'Semantic search failed'
        })
      }
      
      const response: SemanticSearchResponse = {
        memories: results || [],
        query,
        total: results?.length || 0
      }
      
      res.json(response)
    } catch (embeddingError) {
      console.error('Error generating embedding:', embeddingError)
      return res.status(500).json({
        success: false,
        error: 'Failed to process search query'
      })
    }
  } catch (error) {
    console.error('Error in semantic search:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

// POST /api/memories/generate-embeddings - Generate embeddings for existing memories
router.post('/generate-embeddings', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user
    const { ids } = req.body as GenerateEmbeddingsRequest
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Memory IDs array is required'
      })
    }
    
    // Limit batch size to prevent timeout
    if (ids.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 50 memories can be processed at once'
      })
    }
    
    // Fetch memories that belong to the user
    const { data: memories, error: fetchError } = await supabaseServer
      .from('memories')
      .select('id, content')
      .eq('user_id', user.id)
      .in('id', ids)
    
    if (fetchError) {
      console.error('Error fetching memories:', fetchError)
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch memories'
      })
    }
    
    if (!memories || memories.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No memories found'
      })
    }
    
    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[]
    }
    
    // Process each memory
    for (const memory of memories) {
      try {
        // Generate embedding
        const embeddingResponse = await openai.embeddings.create({
          model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
          input: memory.content,
        })
        
        const embedding = embeddingResponse.data[0]?.embedding
        if (!embedding) {
          results.failed++
          results.errors.push(`Failed to generate embedding for memory ${memory.id}`)
          continue
        }
        
        // Insert or update embedding
        const { error: upsertError } = await supabaseServer
          .from('memory_embeddings')
          .upsert({
            memory_id: memory.id,
            embedding: JSON.stringify(embedding)
          }, {
            onConflict: 'memory_id'
          })
        
        if (upsertError) {
          console.error(`Error saving embedding for memory ${memory.id}:`, upsertError)
          results.failed++
          results.errors.push(`Failed to save embedding for memory ${memory.id}`)
        } else {
          results.processed++
        }
      } catch (error) {
        console.error(`Error processing memory ${memory.id}:`, error)
        results.failed++
        results.errors.push(`Error processing memory ${memory.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    res.json({
      success: true,
      ...results
    })
  } catch (error) {
    console.error('Error generating embeddings:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

export default router