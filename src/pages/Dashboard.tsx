import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useMemoriesStore } from '@/store/memoriesStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import type { SentimentStats } from '@/types/api'
import { 
  Brain, 
  Database, 
  User, 
  Plus, 
  TrendingUp, 
  Calendar,
  Sparkles,
  ArrowRight,
  Loader2,
  BarChart3
} from 'lucide-react'

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend)

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const { memories, loading, error, fetchMemories, clearError } = useMemoriesStore()
  
  const [stats, setStats] = useState({
    totalMemories: 0,
    recentMemories: 0,
    memoryTypes: {} as Record<string, number>
  })
  const [sentimentStats, setSentimentStats] = useState<SentimentStats>({
    positive: 0,
    negative: 0,
    neutral: 0,
    total: 0
  })
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])
  
  // Fetch memories on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchMemories({ limit: 50 })
    }
  }, [isAuthenticated, fetchMemories])
  
  // Calculate stats when memories change
  useEffect(() => {
    if (memories.length > 0) {
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      const recentCount = memories.filter(memory => 
        new Date(memory.created_at) > oneWeekAgo
      ).length
      
      const typeCount = memories.reduce((acc, memory) => {
        acc[memory.type] = (acc[memory.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const sentiments = { positive: 0, negative: 0, neutral: 0, total: memories.length }
      memories.forEach(memory => {
        if (memory.sentiment) {
          sentiments[memory.sentiment as keyof Omit<typeof sentiments, 'total'>]++
        }
      })
      
      setStats({
        totalMemories: memories.length,
        recentMemories: recentCount,
        memoryTypes: typeCount
      })
      
      setSentimentStats(sentiments)
    }
  }, [memories])
  
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }
  
  const getMemoryTypeColor = (type: string) => {
    const colors = {
      profile: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      preference: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      goal: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      skill: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      fact: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
  
  const recentMemories = memories
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
  
  if (loading && memories.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your digital consciousness...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">SoulNet</h1>
                <p className="text-sm text-muted-foreground">Digital Consciousness Network</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/memories')}
              >
                <Database className="mr-2 h-4 w-4" />
                Memories
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/profile')}
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            {getGreeting()}, {user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}!
          </h2>
          <p className="text-muted-foreground text-lg">
            Welcome to your digital consciousness dashboard.
          </p>
        </div>
        
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              {error}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="ml-2"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Memories</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMemories}</div>
              <p className="text-xs text-muted-foreground">
                Your digital consciousness contains {stats.totalMemories} memories
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentMemories}</div>
              <p className="text-xs text-muted-foreground">
                New memories added this week
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memory Types</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(stats.memoryTypes).length}</div>
              <p className="text-xs text-muted-foreground">
                Different types of memories stored
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Memories */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    Recent Memories
                  </CardTitle>
                  <CardDescription>
                    Your latest digital consciousness entries
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/memories')}
                >
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentMemories.length > 0 ? (
                <div className="space-y-4">
                  {recentMemories.map((memory) => (
                    <div key={memory.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <Badge 
                          variant="secondary" 
                          className={getMemoryTypeColor(memory.type)}
                        >
                          {memory.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(memory.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2">{memory.content}</p>
                      <div className="flex items-center mt-2">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full mr-1 ${
                                i < memory.importance
                                  ? 'bg-primary'
                                  : 'bg-muted'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">
                          Importance: {memory.importance}/5
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No memories yet. Start building your digital consciousness!
                  </p>
                  <Button onClick={() => navigate('/memories')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Memory
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Sentiment Analysis Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Sentiment Distribution
              </CardTitle>
              <CardDescription>
                Emotional analysis of your memories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.totalMemories > 0 ? (
                <div className="space-y-4">
                  <div className="w-64 h-64 mx-auto">
                    <Doughnut
                      data={{
                        labels: ['Positive', 'Neutral', 'Negative'],
                        datasets: [
                          {
                            data: [
                              sentimentStats.positive,
                              sentimentStats.neutral,
                              sentimentStats.negative,
                            ],
                            backgroundColor: [
                              '#10b981', // green for positive
                              '#6b7280', // gray for neutral
                              '#ef4444', // red for negative
                            ],
                            borderWidth: 2,
                            borderColor: '#ffffff',
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                          legend: {
                            position: 'bottom' as const,
                          },
                          tooltip: {
                            callbacks: {
                              label: (context) => {
                                const label = context.label || ''
                                const value = context.parsed
                                const total = sentimentStats.positive + sentimentStats.neutral + sentimentStats.negative
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
                                return `${label}: ${value} (${percentage}%)`
                              },
                            },
                          },
                        },
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-green-600">😊</div>
                      <div className="text-sm font-medium">{sentimentStats.positive}</div>
                      <div className="text-xs text-muted-foreground">Positive</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-gray-600">😐</div>
                      <div className="text-sm font-medium">{sentimentStats.neutral}</div>
                      <div className="text-xs text-muted-foreground">Neutral</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-red-600">😞</div>
                      <div className="text-sm font-medium">{sentimentStats.negative}</div>
                      <div className="text-xs text-muted-foreground">Negative</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Your sentiment analysis will appear here once you add memories.
                  </p>
                  <Button onClick={() => navigate('/memories')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Memory
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks to manage your digital consciousness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => navigate('/memories')}
                >
                  <Plus className="h-6 w-6" />
                  <span>Add Memory</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Create a new memory entry
                  </span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => navigate('/memories')}
                >
                  <Database className="h-6 w-6" />
                  <span>Browse Memories</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Explore your consciousness
                  </span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => navigate('/profile')}
                >
                  <User className="h-6 w-6" />
                  <span>Update Profile</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Manage your account
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}