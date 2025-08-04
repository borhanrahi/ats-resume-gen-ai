'use client';

// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Cpu, 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings,
  Sparkles
} from 'lucide-react';

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const sidebarItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Overview & Stats'
  },
  {
    id: 'models',
    label: 'AI Models',
    icon: Cpu,
    description: 'Model Configuration'
  },
  {
    id: 'users',
    label: 'Users',
    icon: Users,
    description: 'User Management'
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: CreditCard,
    description: 'Billing & Subscriptions'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'Performance Metrics'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    description: 'System Configuration'
  }
];

export default function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  return (
    <div className="w-64 bg-card border-r border-border h-full flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-foreground">Admin Panel</h2>
            <p className="text-xs text-muted-foreground">ATS Resume Checker</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left
                  ${isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.label}</p>
                  <p className={`text-xs truncate ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          <p>Admin Dashboard v1.0</p>
          <p className="mt-1">© 2024 ATS Resume Checker</p>
        </div>
      </div>
    </div>
  );
}