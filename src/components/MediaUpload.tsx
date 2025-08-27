import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Music, 
  Play, 
  Pause, 
  Loader2,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { apiPost } from '@/lib/apiClient'

interface MediaFile {
  id: string
  file: File
  preview?: string
  type: 'image' | 'audio'
  uploading: boolean
  progress: number
  uploaded: boolean
  url?: string
  error?: string
}

interface MediaUploadProps {
  memoryId?: string
  onMediaUploaded?: (media: { id: string; url: string; type: 'image' | 'audio'; size: number }) => void
  maxFiles?: number
  maxFileSize?: number
  disabled?: boolean
}

const MAX_FILES = 5
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav']

export default function MediaUpload({ 
  memoryId, 
  onMediaUploaded, 
  maxFiles = MAX_FILES, 
  maxFileSize = MAX_FILE_SIZE,
  disabled = false 
}: MediaUploadProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({})

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size exceeds ${Math.round(maxFileSize / 1024 / 1024)}MB limit`
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const isAudio = ALLOWED_AUDIO_TYPES.includes(file.type)

    if (!isImage && !isAudio) {
      return 'Only images (JPEG, PNG, WebP) and audio files (MP3, WAV) are allowed'
    }

    return null
  }

  const createMediaFile = (file: File): MediaFile => {
    const id = Math.random().toString(36).substring(2)
    const type = ALLOWED_IMAGE_TYPES.includes(file.type) ? 'image' : 'audio'
    
    let preview: string | undefined
    if (type === 'image') {
      preview = URL.createObjectURL(file)
    }

    return {
      id,
      file,
      preview,
      type,
      uploading: false,
      progress: 0,
      uploaded: false
    }
  }

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const newMediaFiles: MediaFile[] = []
    const errors: string[] = []

    // Check total file count
    if (mediaFiles.length + fileArray.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed per memory`)
    }

    fileArray.forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        newMediaFiles.push(createMediaFile(file))
      }
    })

    if (errors.length > 0) {
      toast.error('❌ Upload Error', {
        description: errors.join(', '),
        duration: 5000
      })
      return
    }

    setMediaFiles(prev => [...prev, ...newMediaFiles])
  }, [mediaFiles.length, maxFiles, maxFileSize])

  const uploadFile = async (mediaFile: MediaFile) => {
    if (!memoryId) {
      toast.error('Cannot upload', {
        description: 'Memory must be created first'
      })
      return
    }

    setMediaFiles(prev => prev.map(m => 
      m.id === mediaFile.id 
        ? { ...m, uploading: true, progress: 0, error: undefined }
        : m
    ))

    try {
      const formData = new FormData()
      formData.append('file', mediaFile.file)

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest()
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setMediaFiles(prev => prev.map(m => 
            m.id === mediaFile.id 
              ? { ...m, progress }
              : m
          ))
        }
      })

      // Promise wrapper for XMLHttpRequest
      const response = await new Promise<any>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText))
            } catch (e) {
              reject(new Error('Invalid response format'))
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText)
              reject(new Error(error.message || `HTTP ${xhr.status}`))
            } catch (e) {
              reject(new Error(`HTTP ${xhr.status}`))
            }
          }
        }
        
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.ontimeout = () => reject(new Error('Upload timeout'))
        
        xhr.open('POST', `/api/memories/${memoryId}/media`)
        
        // Get auth token from localStorage or wherever it's stored
        const token = localStorage.getItem('token')
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        }
        
        xhr.send(formData)
      })

      setMediaFiles(prev => prev.map(m => 
        m.id === mediaFile.id 
          ? { 
              ...m, 
              uploading: false, 
              progress: 100, 
              uploaded: true, 
              url: response.url 
            }
          : m
      ))

      toast.success('📎 Media uploaded successfully', {
        description: `${mediaFile.file.name} (${(mediaFile.file.size / 1024 / 1024).toFixed(2)} MB)`,
        duration: 3000
      })
      
      if (onMediaUploaded) {
        onMediaUploaded({
          id: response.id,
          url: response.url,
          type: response.type,
          size: response.size
        })
      }
    } catch (error: any) {
      setMediaFiles(prev => prev.map(m => 
        m.id === mediaFile.id 
          ? { 
              ...m, 
              uploading: false, 
              progress: 0, 
              error: error.message || 'Upload failed' 
            }
          : m
      ))
      
      toast.error('❌ Upload failed', {
        description: `${mediaFile.file.name}: ${error.message || 'Please try again'}`,
        duration: 5000
      })
    }
  }

  const removeFile = (id: string) => {
    setMediaFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      if (audioRefs.current[id]) {
        delete audioRefs.current[id]
      }
      return prev.filter(f => f.id !== id)
    })
  }

  const toggleAudio = (id: string, audioUrl: string) => {
    if (playingAudio === id) {
      audioRefs.current[id]?.pause()
      setPlayingAudio(null)
    } else {
      // Pause any currently playing audio
      if (playingAudio && audioRefs.current[playingAudio]) {
        audioRefs.current[playingAudio].pause()
      }
      
      if (!audioRefs.current[id]) {
        audioRefs.current[id] = new Audio(audioUrl)
        audioRefs.current[id].onended = () => setPlayingAudio(null)
      }
      
      audioRefs.current[id].play()
      setPlayingAudio(id)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (disabled) return
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFiles(files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }

  const canAddMore = mediaFiles.length < maxFiles

  return (
    <div className="space-y-4">
      {/* Limit Reached Message */}
      {!canAddMore && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Maximum limit reached: {maxFiles} files per memory. Remove a file to add more.
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Area */}
      {canAddMore && (
        <Card 
          className={`border-2 border-dashed transition-colors ${
            isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium mb-1">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Images (JPEG, PNG, WebP) and Audio (MP3, WAV) up to {Math.round(maxFileSize / 1024 / 1024)}MB
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {mediaFiles.length}/{maxFiles} files
            </p>
          </CardContent>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={[...ALLOWED_IMAGE_TYPES, ...ALLOWED_AUDIO_TYPES].join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* File List */}
      {mediaFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Media Files</h4>
            <Badge variant="outline">
              {mediaFiles.length}/{maxFiles}
            </Badge>
          </div>
          
          {mediaFiles.map(mediaFile => (
            <Card key={mediaFile.id} className="p-3">
              <div className="flex items-center space-x-3">
                {/* Preview/Icon */}
                <div className="flex-shrink-0">
                  {mediaFile.type === 'image' && mediaFile.preview ? (
                    <img 
                      src={mediaFile.preview} 
                      alt={mediaFile.file.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : mediaFile.type === 'image' ? (
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                      <Music className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {mediaFile.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(mediaFile.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  
                  {/* Progress Bar */}
                  {mediaFile.uploading && (
                    <Progress value={mediaFile.progress} className="mt-2 h-1" />
                  )}
                  
                  {/* Error Message */}
                  {mediaFile.error && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {mediaFile.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {/* Audio Player */}
                  {mediaFile.type === 'audio' && mediaFile.uploaded && mediaFile.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAudio(mediaFile.id, mediaFile.url!)}
                    >
                      {playingAudio === mediaFile.id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  
                  {/* Upload Button */}
                  {!mediaFile.uploaded && !mediaFile.uploading && memoryId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => uploadFile(mediaFile)}
                      disabled={disabled}
                    >
                      Upload
                    </Button>
                  )}
                  
                  {/* Loading */}
                  {mediaFile.uploading && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  
                  {/* Success */}
                  {mediaFile.uploaded && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      ✓
                    </Badge>
                  )}
                  
                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(mediaFile.id)}
                    disabled={disabled || mediaFile.uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload All Button */}
      {memoryId && mediaFiles.some(f => !f.uploaded && !f.uploading) && (
        <Button 
          onClick={() => {
            mediaFiles
              .filter(f => !f.uploaded && !f.uploading)
              .forEach(uploadFile)
          }}
          disabled={disabled}
          className="w-full"
        >
          Upload All Files
        </Button>
      )}
    </div>
  )
}