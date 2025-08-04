"use client";

// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Cpu,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Sparkles,
} from "lucide-react";

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const sidebarItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Overview & Stats",
  },
  {
    id: "models",
    label: "AI Models",
    icon: Cpu,
    description: "Model Configuration",
  },
  {
    id: "users",
    label: "Users",
    icon: Users,
    description: "User Management",
  },
  {
    id: "payments",
    label: "Payments",
    icon: CreditCard,
    description: "Billing & Subscriptions",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    description: "Performance Metrics",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    description: "System Configuration",
  },
];

export default function AdminSidebar({
  activeSection,
  onSectionChange,
}: AdminSidebarProps) {
  return (
    <div className="bg-card border border-border rounded-lg h-fit sticky top-6">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Admin Panel</h2>
            <p className="text-xs text-muted-foreground">ATS Resume Checker</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3">
        <div className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-left text-sm
                  ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
