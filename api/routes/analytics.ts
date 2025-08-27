import express, { type Request, type Response } from 'express';
import { requireAuth, userScopedClient } from '../middleware/auth';

const router = express.Router();

type AuthenticatedRequest = Request & { user: { id: string; email: string }; token: string };

/**
 * GET /api/analytics
 * Retorna dados de analytics das memórias do usuário
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const token = (req as AuthenticatedRequest).token;
    
    // Use user-scoped client for RLS
    const supabase = userScopedClient(token);

    // Get all memories for analytics
    const { data: memories, error } = await supabase
      .from('memories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching memories for analytics:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar dados de analytics'
      });
    }

    // Calculate analytics data
    const totalMemories = memories?.length || 0;
    
    // Memory types distribution
    const typeDistribution = {
      profile: 0,
      preference: 0,
      goal: 0,
      skill: 0,
      fact: 0
    };
    
    // Sentiment analysis
    const sentimentStats = {
      positive: 0,
      neutral: 0,
      negative: 0
    };
    
    let totalConfidence = 0;
    const memoriesByDate: { [key: string]: number } = {};
    const memoriesByMonth: { [key: string]: number } = {};
    const memoriesByYear: { [key: string]: number } = {};
    
    memories?.forEach(memory => {
      // Count by type
      if (memory.type && typeDistribution.hasOwnProperty(memory.type)) {
        typeDistribution[memory.type as keyof typeof typeDistribution]++;
      }
      
      // Count by sentiment
      if (memory.sentiment) {
        if (sentimentStats.hasOwnProperty(memory.sentiment)) {
          sentimentStats[memory.sentiment as keyof typeof sentimentStats]++;
        }
      }
      
      // Sum confidence for average
      if (memory.confidence) {
        totalConfidence += memory.confidence;
      }
      
      // Count by date, month, and year
      if (memory.created_at) {
        const date = new Date(memory.created_at);
        const dateStr = date.toISOString().split('T')[0];
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const yearStr = String(date.getFullYear());
        
        memoriesByDate[dateStr] = (memoriesByDate[dateStr] || 0) + 1;
        memoriesByMonth[monthStr] = (memoriesByMonth[monthStr] || 0) + 1;
        memoriesByYear[yearStr] = (memoriesByYear[yearStr] || 0) + 1;
      }
    });
    
    const averageConfidence = totalMemories > 0 ? totalConfidence / totalMemories : 0;
    
    // Calculate streak of consecutive days
    const calculateStreak = () => {
      const sortedDates = Object.keys(memoriesByDate).sort().reverse();
      if (sortedDates.length === 0) return 0;
      
      let streak = 0;
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const yesterdayStr = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Check if user has activity today or yesterday to start counting
      let startDate = memoriesByDate[todayStr] ? todayStr : (memoriesByDate[yesterdayStr] ? yesterdayStr : null);
      
      if (!startDate) return 0;
      
      let currentDate = new Date(startDate);
      
      while (true) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (memoriesByDate[dateStr]) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }
      
      return streak;
    };
    
    const streak = calculateStreak();
    
    // Prepare timeline data (last 12 months)
    const timelineData = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      timelineData.push({
        month: monthStr,
        monthName,
        count: memoriesByMonth[monthStr] || 0
      });
    }

    res.json({
      success: true,
      data: {
        totalMemories,
        typeDistribution,
        sentimentStats,
        averageConfidence: Math.round(averageConfidence * 100) / 100,
        streak,
        timelineData,
        memoriesByMonth: Object.entries(memoriesByMonth).map(([month, count]) => ({
          month,
          count
        })),
        memoriesByYear: Object.entries(memoriesByYear).map(([year, count]) => ({
          year,
          count
        }))
      }
    });

  } catch (error) {
    console.error('Error in analytics endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;