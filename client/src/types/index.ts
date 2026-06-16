export interface User {
  id: number;
  email: string;
  name: string;
  country: string;
  monthlyTarget: number | null;
}

export type Category = 'transport' | 'food' | 'energy' | 'shopping' | 'waste';

export interface Activity {
  id: number;
  user_id: number;
  category: Category;
  sub_type: string;
  quantity: number;
  unit: string;
  emission_kg: number;
  date: string;
  notes: string | null;
  origin?: string | null;
  destination?: string | null;
}

export interface Tip {
  title: string;
  description: string;
  estimatedSavingKg: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: Category;
}

export interface InsightsResponse {
  tips: Tip[];
}
