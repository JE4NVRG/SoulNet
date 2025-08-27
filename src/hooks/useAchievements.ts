import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import type { Achievement, AchievementDefinition, AchievementResponse, AchievementType } from '@/types/api'
import { toast } from 'sonner'
import { apiGet } from '@/lib/apiClient'

const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    type: 'primeira_memoria',
    name: 'Primeira Memória',
    description: 'Criou sua primeira memória no SoulNet',
    icon: 'Brain',
    requirement: 'Criar 1 memória',
    maxProgress: 1
  },
  {
    type: 'reflexivo',
    name: 'Reflexivo',
    description: 'Criou memórias por 7 dias consecutivos',
    icon: 'Calendar',
    requirement: '7 dias consecutivos',
    maxProgress: 7
  },
  {
    type: 'nostalgico',
    name: 'Nostálgico',
    description: 'Acumulou 100 memórias',
    icon: 'Archive',
    requirement: '100 memórias',
    maxProgress: 100
  },
  {
    type: 'explorador',
    name: 'Explorador',
    description: 'Criou memórias de todos os tipos disponíveis',
    icon: 'Compass',
    requirement: 'Todos os tipos',
    maxProgress: 5
  }
]

export function useAchievements() {
  const { user, session, isAuthenticated } = useAuthStore()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAchievements = async () => {
    if (!isAuthenticated || !user) return

    setIsLoading(true)
    setError(null)

    try {
      const data: AchievementResponse = await apiGet('/api/achievements')
      setAchievements(data.achievements)
    } catch (err) {
      console.error('Error fetching achievements:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch achievements')
    } finally {
      setIsLoading(false)
    }
  }

  const showAchievementToast = (achievementType: AchievementType) => {
    const definition = ACHIEVEMENT_DEFINITIONS.find(def => def.type === achievementType)
    if (definition) {
      toast.success('🏆 Nova Conquista Desbloqueada!', {
        description: `${definition.name}: ${definition.description}`,
        duration: 5000
      })
    }
  }

  const getAchievementDefinition = (type: AchievementType): AchievementDefinition | undefined => {
    return ACHIEVEMENT_DEFINITIONS.find(def => def.type === type)
  }

  const getAchievementProgress = (type: AchievementType): { current: number; max: number; percentage: number } => {
    const achievement = achievements.find(a => a.achievement_type === type)
    const definition = getAchievementDefinition(type)
    
    if (!definition) {
      return { current: 0, max: 1, percentage: 0 }
    }

    const current = achievement?.progress || 0
    const max = definition.maxProgress
    const percentage = Math.min((current / max) * 100, 100)

    return { current, max, percentage }
  }

  const isAchievementUnlocked = (type: AchievementType): boolean => {
    const achievement = achievements.find(a => a.achievement_type === type)
    return achievement?.unlocked_at !== null
  }

  const getUnlockedDate = (type: AchievementType): Date | null => {
    const achievement = achievements.find(a => a.achievement_type === type)
    return achievement?.unlocked_at ? new Date(achievement.unlocked_at) : null
  }

  const getUnlockedCount = (): number => {
    return achievements.filter(a => a.unlocked_at !== null).length
  }

  const getTotalCount = (): number => {
    return ACHIEVEMENT_DEFINITIONS.length
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchAchievements()
    }
  }, [isAuthenticated])

  return {
    achievements,
    definitions: ACHIEVEMENT_DEFINITIONS,
    isLoading,
    error,
    fetchAchievements,
    showAchievementToast,
    getAchievementDefinition,
    getAchievementProgress,
    isAchievementUnlocked,
    getUnlockedDate,
    getUnlockedCount,
    getTotalCount
  }
}