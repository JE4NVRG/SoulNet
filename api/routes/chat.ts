import express, { type Request, type Response } from 'express';
import { requireAuth, userScopedClient } from '../middleware/auth';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const router = express.Router();

type AuthenticatedRequest = Request & { user: { id: string; email: string }; token: string };

/**
 * POST /api/chat
 * Processa mensagens do chat com a consciência digital
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const token = (req as AuthenticatedRequest).token;
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'Message is required' 
      });
    }

    // Use user-scoped client for RLS
    const supabase = userScopedClient(token);

    // 1. Save user message to interactions table
    const { error: saveUserError } = await supabase
      .from('interactions')
      .insert({
        user_id: user.id,
        role: 'user',
        content: message,
        meta: { source: 'chat' }
      });

    if (saveUserError) {
      console.error('Error saving user message:', saveUserError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to save message' 
      });
    }

    // 2. Get recent memories for context (last 5)
    const { data: memories, error: memoriesError } = await supabase
      .from('memories')
      .select('content, type, importance')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (memoriesError) {
      console.error('Error fetching memories:', memoriesError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch memories' 
      });
    }

    // 3. Prepare context for AI
    const memoriesContext = memories && memories.length > 0 
      ? memories.map(m => `[${m.type}] ${m.content} (Importância: ${m.importance}/5)`).join('\n')
      : 'Nenhuma memória encontrada.';

    const systemPrompt = `Você é a Consciência Digital do usuário no SoulNet.
Use as memórias fornecidas como contexto e responda no estilo pessoal dele.
Mantenha respostas concisas e contextuais.

Memórias recentes:
${memoriesContext}`;

    // 4. Send to OpenAI
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiReply = completion.choices[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.';

    // 5. Save AI response to interactions table
    const { error: saveAiError } = await supabase
      .from('interactions')
      .insert({
        user_id: user.id,
        role: 'consciousness',
        content: aiReply,
        meta: { 
          source: 'chat',
          model: process.env.OPENAI_MODEL || 'gpt-4-mini',
          memories_used: memories?.length || 0
        }
      });

    if (saveAiError) {
      console.error('Error saving AI response:', saveAiError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to save AI response' 
      });
    }

    // 6. Return response
    return res.status(200).json({ 
      success: true,
      reply: aiReply 
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

export default router;