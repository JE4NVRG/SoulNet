import express, { type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

type AuthenticatedRequest = Request & { user: { id: string; email: string }; token: string };

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
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const token = (req as AuthenticatedRequest).token;
    
    // Use user-scoped client for RLS
    const { userScopedClient } = await import('../middleware/auth');
    const supabase = userScopedClient(token);

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