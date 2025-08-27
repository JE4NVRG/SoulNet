import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Image as ImageIcon, 
  Music, 
  Play, 
  Pause, 
  Volume2,
  VolumeX,
  RotateCcw,
  Download,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'
import { apiGet } from '@/lib/apiClient'

interface MediaItem {
  id: string
  file_url: string
  file_type: 'image' | 'audio'
  file_size: number
  uploaded_at: string
}

interface MediaGalleryProps {
  memoryId: string
  className?: string
  compact?: boolean
}

export default function MediaGallery({ memoryId, className = '', compact = false }: MediaGalleryProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [audioProgress, setAudioProgress] = useState<{ [key: string]: number }>({})
  const [audioMuted, setAudioMuted] = useState<{ [key: string]: boolean }>({})
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({})

  useEffect(() => {
    loadMedia()
  }, [memoryId])

  const loadMedia = async () => {
    try {
      setLoading(true)
      const response = await apiGet(`/api/memories/${memoryId}/media`)
      setMediaItems(response.media || [])
    } catch (error: any) {
      console.error('Failed to load media:', error)
      toast.error('Failed to load media files')
    } finally {
      setLoading(false)
    }
  }

  const toggleAudio = (mediaItem: MediaItem) => {
    const audioId = mediaItem.id
    
    if (playingAudio === audioId) {
      audioRefs.current[audioId]?.pause()
      setPlayingAudio(null)
    } else {
      // Pause any currently playing audio
      if (playingAudio && audioRefs.current[playingAudio]) {
        audioRefs.current[playingAudio].pause()
      }
      
      if (!audioRefs.current[audioId]) {
        const audio = new Audio(mediaItem.file_url)
        audioRefs.current[audioId] = audio
        
        // Set up event listeners
        audio.onended = () => {
          setPlayingAudio(null)
          setAudioProgress(prev => ({ ...prev, [audioId]: 0 }))
        }
        
        audio.ontimeupdate = () => {
          const progress = (audio.currentTime / audio.duration) * 100
          setAudioProgress(prev => ({ ...prev, [audioId]: progress }))
        }
        
        audio.onerror = () => {
          toast.error('Failed to play audio file')
          setPlayingAudio(null)
        }
      }
      
      audioRefs.current[audioId].play()
      setPlayingAudio(audioId)
    }
  }

  const toggleMute = (audioId: string) => {
    const audio = audioRefs.current[audioId]
    if (audio) {
      audio.muted = !audio.muted
      setAudioMuted(prev => ({ ...prev, [audioId]: audio.muted }))
    }
  }

  const resetAudio = (audioId: string) => {
    const audio = audioRefs.current[audioId]
    if (audio) {
      audio.currentTime = 0
      setAudioProgress(prev => ({ ...prev, [audioId]: 0 }))
    }
  }

  const downloadFile = (mediaItem: MediaItem) => {
    const link = document.createElement('a')
    link.href = mediaItem.file_url
    link.download = `memory-${memoryId}-${mediaItem.id}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-4 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (mediaItems.length === 0) {
    return null
  }

  const images = mediaItems.filter(item => item.file_type === 'image')
  const audios = mediaItems.filter(item => item.file_type === 'audio')

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Images Gallery */}
      {images.length > 0 && (
        <div className="space-y-2">
          {!compact && (
            <div className="flex items-center space-x-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Images</span>
              <Badge variant="outline" className="text-xs">
                {images.length}
              </Badge>
            </div>
          )}
          
          <div className={`grid gap-2 ${
            compact 
              ? 'grid-cols-3' 
              : images.length === 1 
                ? 'grid-cols-1' 
                : images.length === 2 
                  ? 'grid-cols-2' 
                  : 'grid-cols-3'
          }`}>
            {images.map(image => (
              <div 
                key={image.id} 
                className="relative group cursor-pointer overflow-hidden rounded-lg"
                onClick={() => setSelectedImage(image)}
              >
                <img
                  src={image.file_url}
                  alt="Memory attachment"
                  className={`w-full object-cover transition-transform group-hover:scale-105 ${
                    compact ? 'h-16' : 'h-32'
                  }`}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ExternalLink className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audio Players */}
      {audios.length > 0 && (
        <div className="space-y-2">
          {!compact && (
            <div className="flex items-center space-x-2">
              <Music className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Audio</span>
              <Badge variant="outline" className="text-xs">
                {audios.length}
              </Badge>
            </div>
          )}
          
          <div className="space-y-2">
            {audios.map(audio => {
              const isPlaying = playingAudio === audio.id
              const progress = audioProgress[audio.id] || 0
              const isMuted = audioMuted[audio.id] || false
              const audioElement = audioRefs.current[audio.id]
              
              return (
                <Card key={audio.id} className={compact ? 'p-2' : 'p-3'}>
                  <div className="flex items-center space-x-3">
                    {/* Play/Pause Button */}
                    <Button
                      variant="ghost"
                      size={compact ? 'sm' : 'default'}
                      onClick={() => toggleAudio(audio)}
                      className="flex-shrink-0"
                    >
                      {isPlaying ? (
                        <Pause className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
                      ) : (
                        <Play className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
                      )}
                    </Button>

                    {/* Progress Bar */}
                    <div className="flex-1 space-y-1">
                      {!compact && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Audio {audios.indexOf(audio) + 1}</span>
                          <span>{formatFileSize(audio.file_size)}</span>
                        </div>
                      )}
                      
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div 
                          className="bg-primary h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      
                      {!compact && audioElement && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {audioElement.currentTime ? formatDuration(audioElement.currentTime) : '0:00'}
                          </span>
                          <span>
                            {audioElement.duration ? formatDuration(audioElement.duration) : '--:--'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Audio Controls */}
                    {!compact && (
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleMute(audio.id)}
                          disabled={!audioElement}
                        >
                          {isMuted ? (
                            <VolumeX className="h-3 w-3" />
                          ) : (
                            <Volume2 className="h-3 w-3" />
                          )}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resetAudio(audio.id)}
                          disabled={!audioElement}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadFile(audio)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center justify-between">
              <span>Image Preview</span>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {selectedImage && formatFileSize(selectedImage.file_size)}
                </Badge>
                {selectedImage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadFile(selectedImage)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedImage && (
            <div className="p-6 pt-0">
              <img
                src={selectedImage.file_url}
                alt="Memory attachment"
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}