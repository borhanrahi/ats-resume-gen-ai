'use client';

import { Users, BarChart3, Cpu, RefreshCw } from 'lucide-react';

export default function StatsOverview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="admin-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Total Users</h3>
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div className="text-2xl font-bold">1,234</div>
        <p className="text-sm text-muted-foreground">+12% from last month</p>
      </div>

      <div className="admin-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Analyses Today</h3>
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
        <div className="text-2xl font-bold">456</div>
        <p className="text-sm text-muted-foreground">+8% from yesterday</p>
      </div>

      <div className="admin-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">API Calls</h3>
          <Cpu className="w-5 h-5 text-primary" />
        </div>
        <div className="text-2xl font-bold">2,890</div>
        <p className="text-sm text-muted-foreground">Last 24 hours</p>
      </div>

      <div className="admin-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Success Rate</h3>
          <RefreshCw className="w-5 h-5 text-success" />
        </div>
        <div className="text-2xl font-bold text-success">98.5%</div>
        <p className="text-sm text-muted-foreground">API reliability</p>
      </div>
    </div>
  );
}