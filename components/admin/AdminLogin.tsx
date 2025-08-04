'use client';

import { useState } from 'react';
import { Shield, Eye, EyeOff, Lock } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (password: string) => void;
  message: string;
}

export default function AdminLogin({ onLogin, message }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = () => {
    onLogin(password);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-card border border-border rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Access</h1>
            <p className="text-muted-foreground">
              Secure access to the ATS Resume Checker admin panel
            </p>
          </div>
          
          {/* Login Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                🔐 Admin Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full h-12 pl-12 pr-12 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background text-foreground placeholder:text-muted-foreground"
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                  ) : (
                    <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Error Message */}
            {message && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                <p className="text-sm text-destructive font-medium text-center">{message}</p>
              </div>
            )}
            
            {/* Login Button */}
            <button
              onClick={handleSubmit}
              className="w-full h-12 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Access Admin Panel
            </button>
            
            {/* Demo Info */}
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-muted/50 rounded-xl">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <p className="text-xs text-muted-foreground">
                  Demo password: <code className="font-mono bg-muted px-1 rounded">demo123admin</code>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            Secure admin access • ATS Resume Checker v1.0
          </p>
        </div>
      </div>
    </div>
  );
}