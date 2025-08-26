import express, { type Request, type Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Achievement definitions with metadata
const ACHIEVEMENT_DEFINITIONS = {
  primeira_memoria: {
    name: 'Primeira Memória',
    description: 'Registrou sua primeira memória no SoulNet',
    icon: 'brain'
  },
  reflexivo: {
    name: 'Reflexivo',
    description: 'Registrou memórias por 7 dias consecutivos',
    icon: 'calendar-days'
  },
  nostalgico: {
    name: 'Nostálgico',
    description: 'Criou 100 memórias no total',
    icon: 'heart'
  },
  explorador: {
    name: 'Explorador',
    description: 'Usou todos os tipos de memória disponíveis',
    icon: 'compass'
  }
};

/**
 * GET /api/achievements
 * Lista todas as conquistas do usuário autenticado
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Get user from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token de autorização necessário'
      });
    }

    const token = authHeader.substring(7);
    
    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

    // Get user's achievements
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', user.id)
      .order('unlocked_at', { ascending: false });

    if (error) {
      console.error('Error fetching achievements:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar conquistas'
      });
    }

    // Create complete achievements list with metadata
    const achievementsList = Object.entries(ACHIEVEMENT_DEFINITIONS).map(([type, definition]) => {
      const userAchievement = achievements?.find(a => a.achievement_type === type);
      
      return {
        type,
        ...definition,
        unlocked: !!userAchievement,
        unlockedAt: userAchievement?.unlocked_at || null,
        progress: userAchievement?.progress || 0
      };
    });

    res.json({
      success: true,
      data: {
        achievements: achievementsList,
        totalUnlocked: achievements?.length || 0,
        totalAvailable: Object.keys(ACHIEVEMENT_DEFINITIONS).length
      }
    });

  } catch (error) {
    console.error('Error in achievements endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;