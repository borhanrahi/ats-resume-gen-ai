export interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
  emailUpdates: boolean;
}

export interface UserUsage {
  dailyCount: number;
  lastReset: Date;
  totalAnalyses: number;
  isPremium: boolean;
}

export interface PaymentRecord {
  $id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  transactionId: string;
  createdAt: Date;
}

export interface User {
  $id: string;
  email: string;
  name: string;
  subscription: {
    plan: 'free' | 'premium';
    status: 'active' | 'cancelled' | 'expired';
    expiresAt: Date;
    paymentHistory: PaymentRecord[];
  };
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}