import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useMemoriesStore } from '../store/memoriesStore'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Memories from '../pages/Memories'
import Profile from '../pages/Profile'
import Onboarding from '../pages/Onboarding'

// Mock the stores
vi.mock('../store/authStore')
vi.mock('../store/memoriesStore')
vi.mock('../lib/supabaseClient')

// Mock react-router-dom navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Helper function to render components with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Page Rendering Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock auth store
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    })
    
    // Mock memories store
    vi.mocked(useMemoriesStore).mockReturnValue({
      memories: [],
      loading: false,
      error: null,
      total: 0,
      page: 1,
      totalPages: 0,
      currentType: null,
      typeFilter: 'all',
      fetchMemories: vi.fn(),
      createMemory: vi.fn(),
      updateMemory: vi.fn(),
      deleteMemory: vi.fn(),
      setFilter: vi.fn(),
      setTypeFilter: vi.fn(),
      clearError: vi.fn(),
      reset: vi.fn(),
      resetStore: vi.fn(),
    })
  })

  describe('Login Page', () => {
    it('should render without crashing', () => {
      renderWithRouter(<Login />)
      
      // Check for key elements
      expect(screen.getByText(/welcome to soulnet/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should have email and password inputs', () => {
      renderWithRouter(<Login />)
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    })
  })

  describe('Dashboard Page', () => {
    it('should render without crashing when authenticated', () => {
      // Mock authenticated state
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        user: { id: '1', email: 'test@example.com' },
        loading: false,
        error: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      })

      const { container } = renderWithRouter(<Dashboard />)
      
      // Check that component renders without crashing
      expect(container).toBeInTheDocument()
    })

    it('should redirect when not authenticated', () => {
      renderWithRouter(<Dashboard />)
      
      // Should call navigate to login
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  describe('Memories Page', () => {
    it('should render without crashing when authenticated', () => {
      // Mock authenticated state
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        user: { id: '1', email: 'test@example.com' },
        loading: false,
        error: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      })

      const { container } = renderWithRouter(<Memories />)
      
      // Check that component renders without crashing
      expect(container).toBeInTheDocument()
    })

    it('should redirect when not authenticated', () => {
      renderWithRouter(<Memories />)
      
      // Should call navigate to login
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  describe('Profile Page', () => {
    it('should render without crashing when authenticated', () => {
      // Mock authenticated state
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        user: { id: '1', email: 'test@example.com' },
        loading: false,
        error: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      })

      const { container } = renderWithRouter(<Profile />)
      
      // Check that component renders without crashing
      expect(container).toBeInTheDocument()
    })

    it('should redirect when not authenticated', () => {
      renderWithRouter(<Profile />)
      
      // Should call navigate to login
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  describe('Onboarding Page', () => {
    it('should render without crashing when authenticated', () => {
      // Mock authenticated state
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        user: { id: '1', email: 'test@example.com' },
        loading: false,
        error: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      })

      renderWithRouter(<Onboarding />)
      
      // Check for key elements
      expect(screen.getByText(/what is your name/i)).toBeInTheDocument()
      expect(screen.getByText(/help us understand you better/i)).toBeInTheDocument()
    })

    it('should redirect when not authenticated', () => {
      renderWithRouter(<Onboarding />)
      
      // Should call navigate to login
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })
})