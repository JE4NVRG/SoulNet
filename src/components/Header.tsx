import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Brain,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  BookOpen,
  BarChart3,
  Moon,
  Sun,
  Bell
} from 'lucide-react'

interface HeaderProps {
  className?: string
}

export default function Header({ className = '' }: HeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme, toggleSidebar } = useUIStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const getUserInitials = () => {
    if (user?.user_metadata?.name) {
      return user.user_metadata.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Dashboard'
      case '/memories':
        return 'Memories'
      case '/profile':
        return 'Profile'
      case '/onboarding':
        return 'Onboarding'
      default:
        return 'SoulNet'
    }
  }

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
      current: location.pathname === '/memories'
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      current: location.pathname === '/analytics',
      disabled: true
    }
  ]

  return (
    <header className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>

            {/* Desktop sidebar toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex"
              onClick={toggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-primary" />
              <div className="hidden sm:block">
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  SoulNet
                </span>
                <div className="text-xs text-muted-foreground -mt-1">
                  Digital Consciousness
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1 ml-8">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      item.disabled
                        ? 'text-muted-foreground cursor-not-allowed'
                        : item.current
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    onClick={(e) => item.disabled && e.preventDefault()}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                    {item.disabled && (
                      <Badge variant="secondary" className="text-xs">
                        Soon
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Center - Page Title (Mobile) */}
          <div className="flex-1 text-center md:hidden">
            <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
          </div>

          {/* Right side - Theme toggle, Notifications, User menu */}
          <div className="flex items-center space-x-2">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="hidden sm:flex"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative hidden sm:flex">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.user_metadata?.name || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => navigate('/settings')} disabled>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Soon
                  </Badge>
                </DropdownMenuItem>
                
                {/* Mobile theme toggle */}
                <DropdownMenuItem onClick={toggleTheme} className="sm:hidden">
                  {theme === 'dark' ? (
                    <Sun className="mr-2 h-4 w-4" />
                  ) : (
                    <Moon className="mr-2 h-4 w-4" />
                  )}
                  <span>Toggle theme</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <nav className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      item.disabled
                        ? 'text-muted-foreground cursor-not-allowed'
                        : item.current
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    onClick={(e) => {
                      if (item.disabled) {
                        e.preventDefault()
                      } else {
                        setMobileMenuOpen(false)
                      }
                    }}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                    {item.disabled && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Soon
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}