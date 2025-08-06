'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, LogIn, LogOut, User, Crown, LayoutDashboard, FileEdit, History, Settings } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAuth, useAuthStatus, usePremiumStatus } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { logout } = useAuth();
  const { isAuthenticated, user } = useAuthStatus();
  const { isPremium } = usePremiumStatus();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50 backdrop-blur-sm">
      <div className="container-mobile">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">ATS</span>
            </div>
            <span className="font-bold text-xl text-foreground">Resume Checker</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              href="/" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link 
              href="/analyze" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Analyze
            </Link>
            
            {/* Premium Navigation Items */}
            {isAuthenticated && isPremium && (
              <>
                <Link 
                  href="/dashboard" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/editor" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Editor
                </Link>
              </>
            )}
            
            {/* Free tier results link */}
            {!isAuthenticated && (
              <Link 
                href="/results" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Results
              </Link>
            )}
            
            {/* Dark Mode Toggle */}
            <ThemeToggle />

            {/* Authentication */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span className="max-w-[100px] truncate">{user?.name || 'User'}</span>
                    {isPremium && <Crown className="w-3 h-3 text-yellow-500" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex items-center space-x-2">
                    <span>My Account</span>
                    {isPremium && <Crown className="w-3 h-3 text-yellow-500" />}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {isPremium ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="flex items-center space-x-2">
                          <LayoutDashboard className="w-4 h-4" />
                          <span>Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/editor" className="flex items-center space-x-2">
                          <FileEdit className="w-4 h-4" />
                          <span>Resume Editor</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/history" className="flex items-center space-x-2">
                          <History className="w-4 h-4" />
                          <span>Analysis History</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link href="/pricing" className="flex items-center space-x-2">
                        <Crown className="w-4 h-4" />
                        <span>Upgrade to Premium</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center space-x-2">
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center space-x-2 text-red-600">
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className="btn-touch text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/analyze" 
                className="btn-touch text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Analyze Resume
              </Link>
              
              {/* Premium Mobile Navigation */}
              {isAuthenticated && isPremium && (
                <>
                  <Link 
                    href="/dashboard" 
                    className="btn-touch text-muted-foreground hover:text-foreground transition-colors py-2 flex items-center space-x-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  <Link 
                    href="/editor" 
                    className="btn-touch text-muted-foreground hover:text-foreground transition-colors py-2 flex items-center space-x-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FileEdit className="w-4 h-4" />
                    <span>Resume Editor</span>
                  </Link>
                  <Link 
                    href="/dashboard/history" 
                    className="btn-touch text-muted-foreground hover:text-foreground transition-colors py-2 flex items-center space-x-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <History className="w-4 h-4" />
                    <span>Analysis History</span>
                  </Link>
                </>
              )}
              
              {/* Free tier results link */}
              {!isAuthenticated && (
                <Link 
                  href="/results" 
                  className="btn-touch text-muted-foreground hover:text-foreground transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Results
                </Link>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>

              {/* Mobile Authentication */}
              {isAuthenticated ? (
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-center space-x-2 px-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground font-medium">
                      {user?.name || 'User'}
                    </span>
                    {isPremium && <Crown className="w-3 h-3 text-yellow-500" />}
                  </div>
                  
                  {!isPremium && (
                    <Link
                      href="/pricing"
                      className="btn-touch flex items-center justify-center space-x-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Crown className="w-4 h-4" />
                      <span>Upgrade to Premium</span>
                    </Link>
                  )}
                  
                  <Link
                    href="/settings"
                    className="btn-touch flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                  
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="btn-touch flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors py-2 w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="btn-touch flex items-center justify-center space-x-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}