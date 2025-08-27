import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useMemoriesStore } from '@/store/memoriesStore'
import useOfflineSync from '@/hooks/useOfflineSync'
import useNetworkStatus from '@/hooks/useNetworkStatus'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { 
  Brain, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Loader2,
  Calendar,
  Star,
  MoreVertical,
  Sparkles
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import MediaUpload from '@/components/MediaUpload'
import MediaGallery from '@/components/MediaGallery'
import type { CreateMemoryRequest, SemanticSearchRequest, SemanticSearchResponse } from '@/types/api'
import type { Memory, MemoryType } from '@/types/api'
import { apiPost } from '@/lib/apiClient'

const MEMORY_TYPES = [
  { value: 'profile', label: 'Profile' },
  { value: 'preference', label: 'Preference' },
  { value: 'goal', label: 'Goal' },
  { value: 'skill', label: 'Skill' },
  { value: 'fact', label: 'Fact' }
]

interface MemoryFormData {
  type: string
  content: string
  importance: number
}

export default function Memories() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { 
    memories, 
    loading, 
    error, 
    typeFilter,
    fetchMemories, 
    createMemory, 
    updateMemory,
    deleteMemory,
    setTypeFilter,
    clearError 
  } = useMemoriesStore()
  const { online, queueSize, addToQueue, enqueue, flush } = useOfflineSync()
  const { online: networkOnline } = useNetworkStatus()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [isSemanticSearch, setIsSemanticSearch] = useState(false)
  const [semanticResults, setSemanticResults] = useState<Array<Memory & { similarity: number }>>([]) 
  const [isSearching, setIsSearching] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<MemoryFormData>({
    type: 'fact',
    content: '',
    importance: 3
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [createdMemoryId, setCreatedMemoryId] = useState<string | null>(null)
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])
  
  // Fetch memories on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchMemories({ limit: 100 })
    }
  }, [isAuthenticated, fetchMemories])
  
  // Perform semantic search
  const performSemanticSearch = async (query: string) => {
    if (!query.trim()) {
      setSemanticResults([])
      return
    }
    
    setIsSearching(true)
    try {
      const data: SemanticSearchResponse = await apiPost('/api/memories/search', {
        query: query.trim(),
        k: 50
      } as SemanticSearchRequest)
      setSemanticResults(data.memories)
    } catch (error) {
      console.error('Semantic search error:', error)
      setSemanticResults([])
    } finally {
      setIsSearching(false)
    }
  }
  
  // Handle search query changes
  useEffect(() => {
    if (isSemanticSearch && searchQuery) {
      const timeoutId = setTimeout(() => {
        performSemanticSearch(searchQuery)
      }, 500) // Debounce search
      
      return () => clearTimeout(timeoutId)
    } else {
      setSemanticResults([])
    }
  }, [searchQuery, isSemanticSearch])
  
  // Filter memories based on search and type filter
  const getDisplayMemories = () => {
    if (isSemanticSearch && searchQuery.trim()) {
      // Use semantic search results
      const filtered = semanticResults.filter(memory => {
        const matchesType = typeFilter === 'all' || memory.type === typeFilter
        return matchesType
      })
      return filtered
    } else {
      // Use traditional search
      const filtered = memories.filter(memory => {
        const matchesSearch = searchQuery === '' || 
          memory.content.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesType = typeFilter === 'all' || memory.type === typeFilter
        return matchesSearch && matchesType
      })
      return filtered
    }
  }
  
  const displayMemories = getDisplayMemories()
  
  const validateForm = (data: MemoryFormData): Record<string, string> => {
    const errors: Record<string, string> = {}
    
    if (!data.content.trim()) {
      errors.content = 'Content is required'
    } else if (data.content.trim().length < 10) {
      errors.content = 'Content must be at least 10 characters long'
    }
    
    if (!data.type) {
      errors.type = 'Type is required'
    }
    
    if (data.importance < 1 || data.importance > 5) {
      errors.importance = 'Importance must be between 1 and 5'
    }
    
    return errors
  }
  
  const handleCreateMemory = async () => {
    const errors = validateForm(formData)
    setFormErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const memoryData: CreateMemoryRequest = {
        type: formData.type as MemoryType,
        content: formData.content.trim(),
        importance: formData.importance,
        source: {
          type: 'manual',
          timestamp: new Date().toISOString()
        }
      }
      
      if (networkOnline) {
        // Try to create memory online
        const result = await createMemory(memoryData)
        if (result.success) {
          // For now, we'll need to fetch the latest memory to get the ID
          // This is a temporary solution until we modify the backend to return the memory ID
          await fetchMemories()
          const latestMemory = memories[0] // Assuming memories are sorted by creation date
          if (latestMemory) {
            setCreatedMemoryId(latestMemory.id)
          }
        }
      } else {
        // Add to offline queue
        addToQueue({
          path: '/api/memories',
          method: 'POST',
          body: memoryData
        })
        // Reset form and close dialog immediately for offline
        setFormData({ type: 'fact', content: '', importance: 3 })
        setFormErrors({})
        setCreatedMemoryId(null)
        setIsCreateDialogOpen(false)
      }
      
    } catch (error) {
      console.error('Error creating memory:', error)
      // If online creation fails, add to offline queue as fallback
      if (networkOnline) {
        const memoryData: CreateMemoryRequest = {
          type: formData.type as MemoryType,
          content: formData.content.trim(),
          importance: formData.importance,
          source: {
            type: 'manual',
            timestamp: new Date().toISOString()
          }
        }
        addToQueue({
          path: '/api/memories',
          method: 'POST',
          body: memoryData
        })
        
        // Reset form and close dialog even on error
        setFormData({ type: 'fact', content: '', importance: 3 })
        setFormErrors({})
        setIsCreateDialogOpen(false)
      }
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleEditMemory = (memory: Memory) => {
    setEditingMemory(memory)
    setFormData({
      type: memory.type,
      content: memory.content,
      importance: memory.importance
    })
    setFormErrors({})
    setIsEditDialogOpen(true)
  }
  
  const handleUpdateMemory = async () => {
    if (!editingMemory) return
    
    const errors = validateForm(formData)
    setFormErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Use the new PUT endpoint to update the memory
      const updateData = {
        type: formData.type as MemoryType,
        content: formData.content.trim(),
        importance: formData.importance,
        source: {
          type: 'manual',
          timestamp: new Date().toISOString()
        }
      }
      
      await updateMemory(editingMemory.id, updateData)
      
      // Reset form and close dialog
      setFormData({ type: 'fact', content: '', importance: 3 })
      setFormErrors({})
      setEditingMemory(null)
      setIsEditDialogOpen(false)
      
    } catch (error) {
      console.error('Error updating memory:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleDeleteMemory = async (memoryId: string) => {
    if (confirm('Are you sure you want to delete this memory? This action cannot be undone.')) {
      try {
        await deleteMemory(memoryId)
      } catch (error) {
        console.error('Error deleting memory:', error)
      }
    }
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
  
  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return '😊'
      case 'negative':
        return '😞'
      case 'neutral':
      default:
        return '😐'
    }
  }
  
  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600'
      case 'negative':
        return 'text-red-600'
      case 'neutral':
      default:
        return 'text-gray-600'
    }
  }
  
  const MemoryForm = () => (
    <div className="space-y-4">
      {!createdMemoryId ? (
        // Memory creation form
        <>
          <div className="space-y-2">
            <Label htmlFor="type">Memory Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select memory type" />
              </SelectTrigger>
              <SelectContent>
                {MEMORY_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.type && (
              <p className="text-sm text-destructive">{formErrors.type}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              placeholder="Describe your memory in detail..."
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              disabled={isSubmitting}
              rows={4}
            />
            {formErrors.content && (
              <p className="text-sm text-destructive">{formErrors.content}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="importance">Importance (1-5) *</Label>
            <Select
              value={formData.importance.toString()}
              onValueChange={(value) => setFormData(prev => ({ ...prev, importance: parseInt(value) }))}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    <div className="flex items-center space-x-2">
                      <span>{num}</span>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < num ? 'fill-current text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
        {formErrors.importance && (
               <p className="text-sm text-destructive">{formErrors.importance}</p>
             )}
           </div>
         </>
       ) : (
         // Media upload section after memory creation
         <div className="space-y-4">
           <div className="text-center">
             <h3 className="text-lg font-semibold text-green-600 mb-2">Memory Created Successfully!</h3>
             <p className="text-sm text-muted-foreground mb-4">
               Now you can add photos and audio files to enrich your memory.
             </p>
           </div>
           <MediaUpload
              memoryId={createdMemoryId}
            />
         </div>
       )}
     </div>
   )
  
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
                <Brain className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-xl font-bold">Memories</h1>
                  <p className="text-sm text-muted-foreground">
                    Manage your digital consciousness
                    {queueSize > 0 && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                        Sync pending
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Memory
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Memory</DialogTitle>
                  <DialogDescription>
                    Add a new entry to your digital consciousness.
                  </DialogDescription>
                </DialogHeader>
                
                <MemoryForm />
                
                <DialogFooter>
              {!createdMemoryId ? (
                // Buttons for memory creation
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false)
                      setFormData({ type: 'fact', content: '', importance: 3 })
                      setFormErrors({})
                      setCreatedMemoryId(null)
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    onClick={handleCreateMemory}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Memory'
                    )}
                  </Button>
                </>
              ) : (
                // Buttons for media upload phase
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false)
                      setFormData({ type: 'fact', content: '', importance: 3 })
                      setFormErrors({})
                      setCreatedMemoryId(null)
                    }}
                  >
                    Skip Media Upload
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setIsCreateDialogOpen(false)
                      setFormData({ type: 'fact', content: '', importance: 3 })
                      setFormErrors({})
                      setCreatedMemoryId(null)
                    }}
                  >
                    Done
                  </Button>
                </>
              )}
            </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
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
        
        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={isSemanticSearch ? "Search memories semantically..." : "Search memories..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={typeFilter}
                    onValueChange={setTypeFilter}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {MEMORY_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Semantic Search Toggle */}
              <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <Label htmlFor="semantic-search" className="text-sm font-medium">
                  Semantic Search
                </Label>
                <Switch
                  id="semantic-search"
                  checked={isSemanticSearch}
                  onCheckedChange={setIsSemanticSearch}
                />
                <span className="text-xs text-muted-foreground">
                  {isSemanticSearch ? 'AI-powered search by meaning' : 'Traditional keyword search'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Memories List */}
        {loading && memories.length === 0 ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your memories...</p>
          </div>
        ) : displayMemories.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || typeFilter !== 'all' ? 'No matching memories' : 'No memories yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || typeFilter !== 'all' 
                  ? isSemanticSearch 
                    ? 'Try different search terms or switch to traditional search.'
                    : 'Try adjusting your search or filter criteria.'
                  : 'Start building your digital consciousness by adding your first memory.'}
              </p>
              {!searchQuery && typeFilter === 'all' && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Memory
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {displayMemories.map((memory) => {
              const isSemanticResult = 'similarity' in memory
              return (
                <Card key={memory.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-wrap">
                        <Badge 
                          variant="secondary" 
                          className={getMemoryTypeColor(memory.type)}
                        >
                          {memory.type}
                        </Badge>
                        <div className="flex items-center space-x-2">
                          <span 
                            className={`text-lg ${getSentimentColor(memory.sentiment)}`}
                            title={`Sentiment: ${memory.sentiment || 'neutral'}${memory.confidence ? ` (${Math.round(memory.confidence * 100)}% confidence)` : ''}`}
                          >
                            {getSentimentIcon(memory.sentiment)}
                          </span>
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < memory.importance
                                    ? 'fill-current text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {isSemanticResult && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-300">
                            <Sparkles className="h-3 w-3 mr-1" />
                            {Math.round((memory as any).similarity * 100)}% match
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="mr-1 h-3 w-3" />
                          {new Date(memory.created_at).toLocaleDateString()}
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditMemory(memory)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteMemory(memory.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    <p className="text-sm leading-relaxed mb-3">{memory.content}</p>
                    
                    {/* Media Gallery */}
                    <MediaGallery memoryId={memory.id} />
                    
                    {isSemanticResult && (
                      <div className="flex items-center justify-end text-xs text-purple-600 dark:text-purple-400">
                        <Sparkles className="h-3 w-3 mr-1" />
                        <span>Semantic match</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
        
        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Memory</DialogTitle>
              <DialogDescription>
                Update your memory entry.
              </DialogDescription>
            </DialogHeader>
            
            <MemoryForm />
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setEditingMemory(null)
                  setFormData({ type: 'fact', content: '', importance: 3 })
                  setFormErrors({})
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateMemory} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Memory'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}