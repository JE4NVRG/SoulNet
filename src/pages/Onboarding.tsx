import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useMemoriesStore } from '@/store/memoriesStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Brain, ArrowRight, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'


interface OnboardingQuestion {
  id: string
  question: string
  type: 'profile' | 'preference' | 'goal' | 'skill' | 'fact'
  placeholder: string
  required: boolean
}

const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'name',
    question: 'What is your name?',
    type: 'profile',
    placeholder: 'Enter your full name',
    required: true
  },
  {
    id: 'age',
    question: 'How old are you?',
    type: 'profile',
    placeholder: 'Enter your age',
    required: true
  },
  {
    id: 'occupation',
    question: 'What is your occupation or field of work?',
    type: 'profile',
    placeholder: 'e.g., Software Developer, Teacher, Student',
    required: true
  },
  {
    id: 'interests',
    question: 'What are your main interests and hobbies?',
    type: 'preference',
    placeholder: 'e.g., Reading, Technology, Sports, Music',
    required: true
  },
  {
    id: 'values',
    question: 'What values are most important to you?',
    type: 'preference',
    placeholder: 'e.g., Family, Creativity, Growth, Helping others',
    required: true
  },
  {
    id: 'goals',
    question: 'What are your main goals for the next year?',
    type: 'goal',
    placeholder: 'Describe your short-term goals and aspirations',
    required: true
  },
  {
    id: 'long_term_vision',
    question: 'What is your long-term vision for your life?',
    type: 'goal',
    placeholder: 'Describe where you see yourself in 5-10 years',
    required: true
  },
  {
    id: 'skills',
    question: 'What are your key skills and strengths?',
    type: 'skill',
    placeholder: 'List your main abilities and talents',
    required: true
  },
  {
    id: 'learning',
    question: 'What would you like to learn or improve?',
    type: 'skill',
    placeholder: 'Areas you want to develop or skills to acquire',
    required: true
  },
  {
    id: 'unique_fact',
    question: 'Share something unique or interesting about yourself',
    type: 'fact',
    placeholder: 'A fun fact, achievement, or personal story',
    required: false
  }
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { createMemory } = useMemoriesStore()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isCompleted, setIsCompleted] = useState(false)
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])
  
  const currentQuestion = ONBOARDING_QUESTIONS[currentStep]
  const progress = ((currentStep + 1) / ONBOARDING_QUESTIONS.length) * 100
  const isLastStep = currentStep === ONBOARDING_QUESTIONS.length - 1
  
  const handleAnswerChange = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }))
    setError('')
  }
  
  const canProceed = () => {
    const answer = answers[currentQuestion.id] || ''
    return !currentQuestion.required || answer.trim().length > 0
  }
  
  const handleNext = () => {
    if (!canProceed()) {
      setError('This question is required. Please provide an answer.')
      return
    }
    
    if (isLastStep) {
      handleSubmit()
    } else {
      setCurrentStep(prev => prev + 1)
      setError('')
    }
  }
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      setError('')
    }
  }
  
  const generateMemoriesFromAnswers = async () => {
    const memories = []
    
    for (const question of ONBOARDING_QUESTIONS) {
      const answer = answers[question.id]
      if (answer && answer.trim()) {
        memories.push({
          type: question.type,
          content: `${question.question} ${answer}`,
          importance: question.required ? 4 : 3,
          source: {
            type: 'onboarding',
            question: question.question,
            timestamp: new Date().toISOString()
          }
        })
      }
    }
    
    // Create memories in batches
    const results = []
    for (const memory of memories) {
      try {
        const result = await createMemory(memory)
        results.push(result)
      } catch (error) {
        console.error('Error creating memory:', error)
        results.push({ success: false, error: 'Failed to create memory' })
      }
    }
    
    return results
  }
  
  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError('')
    
    try {
      const results = await generateMemoriesFromAnswers()
      const failedCount = results.filter(r => !r.success).length
      
      if (failedCount > 0) {
        setError(`Warning: ${failedCount} memories could not be saved. You can add them manually later.`)
      }
      
      setIsCompleted(true)
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
      
    } catch (error) {
      console.error('Onboarding submission error:', error)
      setError('Failed to complete onboarding. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Welcome to SoulNet!</h2>
            <p className="text-muted-foreground mb-4">
              Your digital consciousness has been initialized with your memories.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting to your dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="font-semibold">SoulNet Onboarding</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {currentStep + 1} of {ONBOARDING_QUESTIONS.length}
            </span>
          </div>
          
          <Progress value={progress} className="mb-4" />
          
          <CardTitle className="text-xl">
            {currentQuestion.question}
          </CardTitle>
          
          <CardDescription>
            Help us understand you better to create your digital consciousness.
            {currentQuestion.required && (
              <span className="text-destructive ml-1">*</span>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Answer Input */}
            <div className="space-y-2">
              <Label htmlFor="answer">
                Your Answer
                {currentQuestion.required && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </Label>
              
              {currentQuestion.id === 'age' ? (
                <Input
                  id="answer"
                  type="number"
                  placeholder={currentQuestion.placeholder}
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  disabled={isSubmitting}
                  min="1"
                  max="120"
                />
              ) : currentQuestion.id === 'name' || currentQuestion.id === 'occupation' ? (
                <Input
                  id="answer"
                  type="text"
                  placeholder={currentQuestion.placeholder}
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  disabled={isSubmitting}
                />
              ) : (
                <Textarea
                  id="answer"
                  placeholder={currentQuestion.placeholder}
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  disabled={isSubmitting}
                  rows={4}
                />
              )}
            </div>
            
            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0 || isSubmitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Memories...
                  </>
                ) : isLastStep ? (
                  'Complete Onboarding'
                ) : (
                  <>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}