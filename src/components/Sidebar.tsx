import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useMemoriesStore } from '@/store/memoriesStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Brain,
  Home,
  BookOpen,
  User,
  Settings,
  BarChart3,
  Plus,
  Search,
  Clock,
  Star,
  Heart,
  Lightbulb,
  Target,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const location = useLocation()
  const { user } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { memories, typeFilter, setTypeFilter } = useMemoriesStore()

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: location.pathname === '/dashboard'
    },
    {
      name: 'Memories',
      href: '/memories',
      icon: BookOpen,
      current: location.pathname === '/memories',
      badge: memories.length > 0 ? memories.length.toString() : undefined
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      current: location.pathname === '/profile'
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      current: location.pathname === '/analytics',
      disabled: true,
      badge: 'Soon'
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      current: location.pathname === '/settings',
      disabled: true,
      badge: 'Soon'
    }
  ]

  const memoryTypes = [
    { type: 'experience', icon: Star, label: 'Experiences', color: 'text-yellow-600' },
    { type: 'emotion', icon: Heart, label: 'Emotions', color: 'text-red-600' },
    { type: 'insight', icon: Lightbulb, label: 'Insights', color: 'text-blue-600' },
    { type: 'goal', icon: Target, label: 'Goals', color: 'text-green-600' },
    { type: 'reflection', icon: Clock, label: 'Reflections', color: 'text-purple-600' }
  ]

  const getMemoryCountByType = (type: string) => {
    return memories.filter(memory => memory.type === type).length
  }

  const getRecentMemories = () => {
    return memories
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    return date.toLocaleDateString()
  }

  if (!sidebarOpen) {
    return (
      <div className={`fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-16 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}>
        <div className="flex flex-col items-center py-4 space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Separator />
          
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`relative flex h-10 w-10 items-center justify-center rounded-md transition-colors ${
                  item.disabled
                    ? 'text-muted-foreground cursor-not-allowed'
                    : item.current
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                onClick={(e) => item.disabled && e.preventDefault()}
                title={item.name}
              >
                <Icon className="h-5 w-5" />
                {item.badge && !item.disabled && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                  >
                    {item.badge.length > 2 ? '99+' : item.badge}
                  </Badge>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className={`fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-80 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}>
      <ScrollArea className="h-full">
        <div className="p-4 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-primary" />
              <span className="font-semibold">Navigation</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Main Navigation */}
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    item.disabled
                      ? 'text-muted-foreground cursor-not-allowed'
                      : item.current
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  onClick={(e) => item.disabled && e.preventDefault()}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <Badge 
                      variant={item.disabled ? "secondary" : "default"} 
                      className="text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </nav>

          <Separator />

          {/* Quick Actions */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Quick Actions</h3>
            <div className="space-y-2">
              <Link to="/memories?action=create">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Memory
                </Button>
              </Link>
              
              <Button variant="outline" size="sm" className="w-full justify-start" disabled>
                <Search className="mr-2 h-4 w-4" />
                Search Memories
                <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Memory Types Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Memory Types</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTypeFilter('')}
                className="h-6 px-2 text-xs"
              >
                Clear
              </Button>
            </div>
            
            <div className="space-y-1">
              {memoryTypes.map((type) => {
                const Icon = type.icon
                const count = getMemoryCountByType(type.type)
                const isActive = typeFilter === type.type
                
                return (
                  <button
                    key={type.type}
                    onClick={() => setTypeFilter(isActive ? '' : type.type)}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-4 w-4 ${type.color}`} />
                      <span>{type.label}</span>
                    </div>
                    {count > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {count}
                      </Badge>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Recent Memories */}
          {memories.length > 0 && (
            <>
              <Separator />
              
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Recent Memories</h3>
                
                <div className="space-y-2">
                  {getRecentMemories().map((memory) => {
                    const typeInfo = memoryTypes.find(t => t.type === memory.type)
                    const Icon = typeInfo?.icon || BookOpen
                    
                    return (
                      <div
                        key={memory.id}
                        className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => window.location.href = '/memories'}
                      >
                        <Icon className={`h-4 w-4 mt-0.5 ${typeInfo?.color || 'text-muted-foreground'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {memory.content.slice(0, 40)}...
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary" className="text-xs capitalize">
                              {memory.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(memory.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {memories.length > 5 && (
                  <Link to="/memories">
                    <Button variant="ghost" size="sm" className="w-full text-xs">
                      View all {memories.length} memories
                    </Button>
                  </Link>
                )}
              </div>
            </>
          )}

          {/* User Info */}
          <div className="pt-4 border-t">
            <div className="flex items-center space-x-3 p-2 rounded-md bg-muted/30">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.user_metadata?.name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {memories.length} memories stored
                </p>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}