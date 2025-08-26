import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  Calendar, 
  Archive, 
  Compass, 
  Trophy,
  Lock
} from 'lucide-react'
import type { AchievementType, AchievementDefinition } from '@/types/api'
import { cn } from '@/lib/utils'

interface AchievementBadgeProps {
  definition: AchievementDefinition
  isUnlocked: boolean
  unlockedDate?: Date | null
  progress: {
    current: number
    max: number
    percentage: number
  }
  className?: string
}

const getAchievementIcon = (iconName: string, isUnlocked: boolean) => {
  const iconProps = {
    className: cn(
      'h-8 w-8 transition-colors',
      isUnlocked ? 'text-yellow-500' : 'text-muted-foreground'
    )
  }

  switch (iconName) {
    case 'Brain':
      return <Brain {...iconProps} />
    case 'Calendar':
      return <Calendar {...iconProps} />
    case 'Archive':
      return <Archive {...iconProps} />
    case 'Compass':
      return <Compass {...iconProps} />
    default:
      return <Trophy {...iconProps} />
  }
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)
}

export function AchievementBadge({ 
  definition, 
  isUnlocked, 
  unlockedDate, 
  progress, 
  className 
}: AchievementBadgeProps) {
  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      isUnlocked 
        ? 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20' 
        : 'border-muted bg-muted/30 opacity-75',
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className={cn(
            'flex-shrink-0 p-2 rounded-full transition-colors',
            isUnlocked 
              ? 'bg-yellow-100 dark:bg-yellow-900/30' 
              : 'bg-muted'
          )}>
            {isUnlocked ? (
              getAchievementIcon(definition.icon, true)
            ) : (
              <Lock className="h-8 w-8 text-muted-foreground" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className={cn(
                'font-semibold text-sm',
                isUnlocked ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {definition.name}
              </h3>
              {isUnlocked && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                  <Trophy className="mr-1 h-3 w-3" />
                  Desbloqueada
                </Badge>
              )}
            </div>

            <p className={cn(
              'text-xs mb-2',
              isUnlocked ? 'text-muted-foreground' : 'text-muted-foreground/70'
            )}>
              {definition.description}
            </p>

            {/* Progress */}
            {!isUnlocked && progress.max > 1 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progresso</span>
                  <span>{progress.current}/{progress.max}</span>
                </div>
                <Progress 
                  value={progress.percentage} 
                  className="h-2"
                />
              </div>
            )}

            {/* Unlocked date */}
            {isUnlocked && unlockedDate && (
              <div className="flex items-center space-x-1 mt-2">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Desbloqueada em {formatDate(unlockedDate)}
                </span>
              </div>
            )}

            {/* Requirement */}
            <div className="flex items-center space-x-1 mt-1">
              <span className="text-xs text-muted-foreground">
                Requisito: {definition.requirement}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}