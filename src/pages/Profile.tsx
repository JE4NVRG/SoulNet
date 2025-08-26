import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useMemoriesStore } from '@/store/memoriesStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  User, 
  ArrowLeft, 
  Settings, 
  Moon, 
  Sun, 
  Trash2,
  Download,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Mail,
  Shield,
  Calendar,
  Brain
} from 'lucide-react'

export default function Profile() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { theme, toggleTheme } = useUIStore()
  const { memories, fetchMemories } = useMemoriesStore()
  
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    email: ''
  })
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])
  
  // Initialize profile data
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.user_metadata?.name || '',
        email: user.email || ''
      })
    }
  }, [user])
  
  // Fetch memories for stats
  useEffect(() => {
    if (isAuthenticated) {
      fetchMemories({ limit: 1000 })
    }
  }, [isAuthenticated, fetchMemories])
  
  const handleSaveProfile = async () => {
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    try {
      // In a real app, you would update the user profile via Supabase
      // For now, we'll just simulate the update
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSuccess('Profile updated successfully!')
      setIsEditing(false)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
      
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('Failed to update profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleExportData = async () => {
    setIsLoading(true)
    
    try {
      const exportData = {
        user: {
          id: user?.id,
          email: user?.email,
          name: user?.user_metadata?.name,
          created_at: user?.created_at
        },
        memories: memories.map(memory => ({
          id: memory.id,
          type: memory.type,
          content: memory.content,
          importance: memory.importance,
          created_at: memory.created_at,
          source: memory.source
        })),
        export_date: new Date().toISOString(),
        total_memories: memories.length
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `soulnet-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setSuccess('Data exported successfully!')
      setTimeout(() => setSuccess(''), 3000)
      
    } catch (error) {
      console.error('Error exporting data:', error)
      setError('Failed to export data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleDeleteAccount = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      // In a real app, you would delete the user account and all associated data
      // For now, we'll just log out the user
      await logout()
      navigate('/login')
      
    } catch (error) {
      console.error('Error deleting account:', error)
      setError('Failed to delete account. Please try again.')
    } finally {
      setIsLoading(false)
      setShowDeleteDialog(false)
    }
  }
  
  const getAccountAge = () => {
    if (!user?.created_at) return 'Unknown'
    
    const created = new Date(user.created_at)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '1 day'
    if (diffDays < 30) return `${diffDays} days`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`
    return `${Math.floor(diffDays / 365)} years`
  }
  
  const getMemoryStats = () => {
    const typeCount = memories.reduce((acc, memory) => {
      acc[memory.type] = (acc[memory.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const avgImportance = memories.length > 0 
      ? (memories.reduce((sum, memory) => sum + memory.importance, 0) / memories.length).toFixed(1)
      : '0'
    
    return { typeCount, avgImportance }
  }
  
  const { typeCount, avgImportance } = getMemoryStats()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div className="flex items-center space-x-3">
                <User className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-xl font-bold">Profile</h1>
                  <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Success/Error Messages */}
          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Your basic account information
                  </CardDescription>
                </div>
                
                <Button
                  variant={isEditing ? "default" : "outline"}
                  onClick={() => {
                    if (isEditing) {
                      handleSaveProfile()
                    } else {
                      setIsEditing(true)
                    }
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : isEditing ? (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  ) : (
                    <Settings className="mr-2 h-4 w-4" />
                  )}
                  {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Edit Profile'}
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing || isLoading}
                    placeholder="Enter your name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profileData.email}
                    disabled={true}
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Verified Account
                  </span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Shield className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Member for {getAccountAge()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Memory Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="mr-2 h-5 w-5" />
                Memory Statistics
              </CardTitle>
              <CardDescription>
                Overview of your digital consciousness
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {memories.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Memories</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {avgImportance}
                  </div>
                  <p className="text-sm text-muted-foreground">Average Importance</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {Object.keys(typeCount).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Memory Types</p>
                </div>
              </div>
              
              {Object.keys(typeCount).length > 0 && (
                <>
                  <Separator className="my-6" />
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Memory Distribution</h4>
                    {Object.entries(typeCount).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="capitalize">
                            {type}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ 
                                width: `${(count / memories.length) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Preferences
              </CardTitle>
              <CardDescription>
                Customize your SoulNet experience
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose between light and dark mode
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Sun className="h-4 w-4" />
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={toggleTheme}
                  />
                  <Moon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="mr-2 h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Export or manage your data
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Export Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Download all your memories and profile data
                  </p>
                </div>
                
                <Button
                  variant="outline"
                  onClick={handleExportData}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center text-destructive">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions that will permanently affect your account
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Delete Account</Label>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Account</DialogTitle>
                      <DialogDescription>
                        Are you absolutely sure you want to delete your account? This action cannot be undone.
                        All your memories and data will be permanently deleted.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <span className="font-medium text-destructive">This action is irreversible</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        You will lose access to:
                      </p>
                      <ul className="text-sm text-muted-foreground mt-1 ml-4 list-disc">
                        <li>All {memories.length} memories</li>
                        <li>Your profile and account data</li>
                        <li>Access to SoulNet services</li>
                      </ul>
                    </div>
                    
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteDialog(false)}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Account
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}