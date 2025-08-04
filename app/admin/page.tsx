'use client';

import { useState, useEffect } from 'react';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminSidebar from '@/components/admin/AdminSidebar';
import StatsOverview from '@/components/admin/StatsOverview';
import ModelManagement from '@/components/admin/ModelManagement';
import { LogOut } from 'lucide-react';

interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  model: string;
  tier: 'free' | 'premium';
  isActive: boolean;
  priority: number;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check if already authenticated
    const auth = localStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      loadModels();
    }
  }, []);

  const handleLogin = (password: string) => {
    if (password === 'demo123admin') {
      setIsAuthenticated(true);
      localStorage.setItem('admin_auth', 'true');
      setMessage('');
      loadModels();
    } else {
      setMessage('Invalid password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_auth');
  };

  const loadModels = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/models');
      if (response.ok) {
        const data = await response.json();
        setModels(data.models);
      }
    } catch {
      console.error('Failed to load models');
    } finally {
      setLoading(false);
    }
  };

  const updateModel = async (modelId: string, updates: Partial<ModelConfig>) => {
    try {
      const response = await fetch('/api/admin/models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, updates }),
      });

      if (response.ok) {
        setMessage('Model updated successfully');
        loadModels();
      } else {
        setMessage('Failed to update model');
      }
    } catch {
      setMessage('Error updating model');
    }
  };

  const testModel = async (modelId: string) => {
    setLoading(true);
    try {
      // Special handling for Gemini models
      if (modelId.includes('gemini')) {
        const response = await fetch('/api/admin/test-gemini', {
          method: 'POST',
        });
        const result = await response.json();
        setMessage(result.success ? 'Gemini API test successful' : `Gemini test failed: ${result.error}`);
      } else {
        const response = await fetch('/api/admin/test-model', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modelId }),
        });
        const result = await response.json();
        setMessage(result.success ? 'Model test successful' : `Model test failed: ${result.error}`);
      }
    } catch {
      setMessage('Model test failed');
    } finally {
      setLoading(false);
    }
  };

  const addModel = async (modelData: {
    name: string;
    provider: string;
    model: string;
    tier: 'free' | 'premium';
    priority: number;
  }) => {
    try {
      const response = await fetch('/api/admin/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelData),
      });

      if (response.ok) {
        setMessage('Model added successfully');
        loadModels();
      } else {
        setMessage('Failed to add model');
      }
    } catch {
      setMessage('Error adding model');
    }
  };

  const setPrimaryModel = async (modelId: string) => {
    try {
      const response = await fetch('/api/admin/models/set-primary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId }),
      });

      if (response.ok) {
        setMessage('Primary model updated successfully');
        loadModels();
      } else {
        setMessage('Failed to set primary model');
      }
    } catch {
      setMessage('Error setting primary model');
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <StatsOverview />;
      case 'models':
        return (
          <ModelManagement
            models={models}
            loading={loading}
            message={message}
            onRefresh={loadModels}
            onUpdateModel={updateModel}
            onTestModel={testModel}
            onSetPrimary={setPrimaryModel}
            onAddModel={addModel}
          />
        );
      case 'users':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-foreground mb-2">User Management</h3>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        );
      case 'payments':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-foreground mb-2">Payment Management</h3>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        );
      case 'analytics':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-foreground mb-2">Analytics Dashboard</h3>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-foreground mb-2">System Settings</h3>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        );
      default:
        return <StatsOverview />;
    }
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} message={message} />;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar */}
      <div className="w-full lg:w-64 flex-shrink-0">
        <AdminSidebar 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 min-h-[calc(100vh-8rem)]">
        {/* Top Bar */}
        <div className="bg-card border border-border rounded-lg p-4 lg:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-foreground capitalize">
                {activeSection === 'models' ? 'AI Models' : activeSection}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {activeSection === 'dashboard' && 'System overview and statistics'}
                {activeSection === 'models' && 'Configure AI models and fallback chains'}
                {activeSection === 'users' && 'Manage user accounts and permissions'}
                {activeSection === 'payments' && 'Monitor billing and subscriptions'}
                {activeSection === 'analytics' && 'View performance metrics and insights'}
                {activeSection === 'settings' && 'System configuration and preferences'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all self-start sm:self-auto"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="bg-card border border-border rounded-lg p-4 lg:p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}