import express, { type Request, type Response } from 'express'
import { supabaseServer, getUserFromRequest } from '../../src/lib/supabaseServer.js'
import type { CreateMemoryRequest, UpdateMemoryRequest, GetMemoriesRequest, MemoryResponse, MemoriesListResponse } from '../../src/types/api.js'
import type { Json } from '../../src/types/database.js'

type AuthenticatedRequest = Request & { user: { id: string; email: string } }

const router = express.Router()

// Middleware to verify authentication
const requireAuth = async (req: Request, res: Response, next: express.NextFunction) => {
  try {
    const { user, error } = await getUserFromRequest(req)
    
    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      })
    }
    
    // Attach user to request object
    (req as AuthenticatedRequest).user = user
    next()
  } catch {
    return res.status(401).json({
      success: false,
      error: 'Authentication failed'
    })
  }
}

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
    
    // Create memory
    const { data: memory, error } = await supabaseServer
      .from('memories')
      .insert({
        user_id: user.id,
        type,
        content,
        importance,
        source: source as Json
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
    
    const response: MemoryResponse = {
      id: memory.id,
      success: true
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

export default router