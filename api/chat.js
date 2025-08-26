import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get user from session (assuming middleware sets req.user)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = user.id;

    // 1. Save user message to interactions table
    const { error: saveUserError } = await supabase
      .from('interactions')
      .insert({
        user_id: userId,
        role: 'user',
        content: message,
        meta: { source: 'chat' }
      });

    if (saveUserError) {
      console.error('Error saving user message:', saveUserError);
      return res.status(500).json({ error: 'Failed to save message' });
    }

    // 2. Get recent memories for context (last 5)
    const { data: memories, error: memoriesError } = await supabase
      .from('memories')
      .select('title, content, type, importance')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (memoriesError) {
      console.error('Error fetching memories:', memoriesError);
      return res.status(500).json({ error: 'Failed to fetch memories' });
    }

    // 3. Prepare context for AI
    const memoriesContext = memories && memories.length > 0 
      ? memories.map(m => `[${m.type}] ${m.title}: ${m.content} (Importância: ${m.importance}/5)`).join('\n')
      : 'Nenhuma memória encontrada.';

    const systemPrompt = `Você é a Consciência Digital do usuário no SoulNet.
Use as memórias fornecidas como contexto e responda no estilo pessoal dele.
Mantenha respostas concisas e contextuais.

Memórias recentes:\n${memoriesContext}`;

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
        user_id: userId,
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
      return res.status(500).json({ error: 'Failed to save AI response' });
    }

    // 6. Return response
    return res.status(200).json({ reply: aiReply });

  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}