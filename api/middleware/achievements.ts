import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface AchievementCheck {
  type: string;
  unlocked: boolean;
  isNew: boolean;
}

/**
 * Verifica e desbloqueia conquistas automaticamente
 */
export async function checkAndUnlockAchievements(userId: string): Promise<AchievementCheck[]> {
  const results: AchievementCheck[] = [];

  try {
    // Get existing achievements for user
    const { data: existingAchievements } = await supabase
      .from('achievements')
      .select('achievement_type')
      .eq('user_id', userId);

    const unlockedTypes = new Set(existingAchievements?.map(a => a.achievement_type) || []);

    // Get user's memories for analysis
    const { data: memories } = await supabase
      .from('memories')
      .select('id, type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (!memories) return results;

    // 1. Primeira Memória - desbloqueada ao salvar a primeira memória
    if (memories.length >= 1 && !unlockedTypes.has('primeira_memoria')) {
      await unlockAchievement(userId, 'primeira_memoria');
      results.push({ type: 'primeira_memoria', unlocked: true, isNew: true });
    } else {
      results.push({ type: 'primeira_memoria', unlocked: unlockedTypes.has('primeira_memoria'), isNew: false });
    }

    // 2. Nostálgico - 100 memórias criadas
    if (memories.length >= 100 && !unlockedTypes.has('nostalgico')) {
      await unlockAchievement(userId, 'nostalgico');
      results.push({ type: 'nostalgico', unlocked: true, isNew: true });
    } else {
      results.push({ type: 'nostalgico', unlocked: unlockedTypes.has('nostalgico'), isNew: false });
    }

    // 3. Explorador - usar todos os tipos de memória (profile, preference, goal, skill, fact)
    const requiredTypes = ['profile', 'preference', 'goal', 'skill', 'fact'];
    const userTypes = new Set(memories.map(m => m.type));
    const hasAllTypes = requiredTypes.every(type => userTypes.has(type));
    
    if (hasAllTypes && !unlockedTypes.has('explorador')) {
      await unlockAchievement(userId, 'explorador');
      results.push({ type: 'explorador', unlocked: true, isNew: true });
    } else {
      results.push({ type: 'explorador', unlocked: unlockedTypes.has('explorador'), isNew: false });
    }

    // 4. Reflexivo - 7 dias consecutivos registrando memórias
    const consecutiveDays = calculateConsecutiveDays(memories);
    if (consecutiveDays >= 7 && !unlockedTypes.has('reflexivo')) {
      await unlockAchievement(userId, 'reflexivo');
      results.push({ type: 'reflexivo', unlocked: true, isNew: true });
    } else {
      results.push({ type: 'reflexivo', unlocked: unlockedTypes.has('reflexivo'), isNew: false });
    }

    return results;

  } catch (error) {
    console.error('Error checking achievements:', error);
    return results;
  }
}

/**
 * Desbloqueia uma conquista específica
 */
async function unlockAchievement(userId: string, achievementType: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('achievements')
      .insert({
        user_id: userId,
        achievement_type: achievementType,
        unlocked_at: new Date().toISOString(),
        progress: 100
      });

    if (error) {
      console.error(`Error unlocking achievement ${achievementType}:`, error);
    }
  } catch (error) {
    console.error(`Error unlocking achievement ${achievementType}:`, error);
  }
}

/**
 * Calcula dias consecutivos de criação de memórias
 */
function calculateConsecutiveDays(memories: any[]): number {
  if (memories.length === 0) return 0;

  // Group memories by date (YYYY-MM-DD)
  const dateGroups = new Map<string, boolean>();
  
  memories.forEach(memory => {
    const date = new Date(memory.created_at).toISOString().split('T')[0];
    dateGroups.set(date, true);
  });

  // Sort dates
  const sortedDates = Array.from(dateGroups.keys()).sort();
  
  let maxConsecutive = 0;
  let currentConsecutive = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currentDate = new Date(sortedDates[i]);
    
    // Check if dates are consecutive (difference of 1 day)
    const diffTime = currentDate.getTime() - prevDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    if (diffDays === 1) {
      currentConsecutive++;
    } else {
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      currentConsecutive = 1;
    }
  }
  
  return Math.max(maxConsecutive, currentConsecutive);
}