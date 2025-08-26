import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useMemoriesStore } from '@/store/memoriesStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Brain,
  Home,
  BookOpen,
  User,
  Settings,
  BarChart3,
  Plus,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  FileText,
  X,
  MessageCircle
} from 'lucide-react'

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { sidebarOpen, toggleSidebar, sidebarCollapsed, toggleSidebarCollapse } = useUIStore()
  const { memories } = useMemoriesStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      current: location.pathname === '/dashboard',
      disabled: false,
    },
    {
      name: 'Memories',
      href: '/memories',
      icon: Brain,
      current: location.pathname === '/memories',
      disabled: false,
    },
    {
      name: 'Chat IA',
      href: '/chat',
      icon: MessageCircle,
      current: location.pathname === '/chat',
      disabled: false,
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      current: location.pathname === '/profile',
      disabled: false,
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      current: location.pathname === '/analytics',
      disabled: false,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      current: location.pathname === '/settings',
      disabled: true,
    },
  ]

  const quickActions = [
    {
      name: 'New Memory',
      icon: Plus,
      action: () => navigate('/memories?new=true'),
      disabled: false,
    },
    {
      name: 'Quick Note',
      icon: FileText,
      action: () => navigate('/memories?quick=true'),
      disabled: true,
    },
  ]



  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 md:top-16 z-40 transition-all duration-300 ease-in-out bg-background border-r ${
          sidebarOpen 
            ? (sidebarCollapsed ? 'md:w-16' : 'md:w-60') 
            : '-translate-x-full md:w-60'
        } ${className}`}
      >
        <div className="flex flex-col flex-grow overflow-y-auto">
          {/* Collapse Toggle */}
          <div className="flex items-center justify-end p-2 border-b">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebarCollapse}
              className={`${sidebarCollapsed ? 'w-full justify-center' : ''}`}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.disabled
                      ? 'text-muted-foreground cursor-not-allowed'
                      : item.current
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  onClick={(e) => item.disabled && e.preventDefault()}
                  title={sidebarCollapsed ? item.name : ''}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${sidebarCollapsed ? '' : 'mr-3'}`} />
                  {!sidebarCollapsed && (
                    <>
                      <span>{item.name}</span>
                      {item.disabled && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          Soon
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Quick Actions Footer */}
          <div className="border-t border-border p-2">
            {!sidebarCollapsed && (
              <div className="text-xs font-medium text-muted-foreground px-3 py-2">
                Quick Actions
              </div>
            )}
            <div className="space-y-1">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Button
                    key={action.name}
                    variant="ghost"
                    size="sm"
                    onClick={action.action}
                    disabled={action.disabled}
                    className={`w-full justify-start text-sm ${
                      sidebarCollapsed ? 'justify-center px-2' : 'px-3'
                    } ${action.disabled ? 'opacity-50' : ''}`}
                    title={sidebarCollapsed ? action.name : ''}
                  >
                    <Icon className={`h-4 w-4 ${sidebarCollapsed ? '' : 'mr-2'}`} />
                    {!sidebarCollapsed && action.name}
                    {!sidebarCollapsed && action.disabled && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Soon
                      </Badge>
                    )}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-opacity duration-300 ease-in-out ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={toggleSidebar} />
        <div
          className={`relative flex flex-col w-64 h-full bg-background border-r shadow-xl transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="text-sm font-medium text-muted-foreground">
              Navigation
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile Navigation */}
          <ScrollArea className="flex-1">
            <nav className="px-2 py-4 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
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
                        toggleSidebar()
                      }
                    }}
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                    {item.disabled && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Soon
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Mobile Quick Actions */}
            <div className="px-2 py-4 border-t border-border">
              <div className="text-xs font-medium text-muted-foreground px-3 py-2">
                Quick Actions
              </div>
              <div className="space-y-1">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <Button
                      key={action.name}
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (!action.disabled) {
                          action.action()
                          toggleSidebar()
                        }
                      }}
                      disabled={action.disabled}
                      className={`w-full justify-start text-sm px-3 ${
                        action.disabled ? 'opacity-50' : ''
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {action.name}
                      {action.disabled && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          Soon
                        </Badge>
                      )}
                    </Button>
                  )
                })}
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  )
}