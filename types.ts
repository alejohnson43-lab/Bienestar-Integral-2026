export enum Dimension {
  Mind = 'Mente',
  Body = 'Cuerpo',
  Spirit = 'Espíritu'
}

export enum HabitStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Completed = 'completed',
  Deleted = 'deleted'
}

export interface Habit {
  id: string;
  title: string;
  description: string;
  dimension: Dimension;
  subDimension: string;
  status: HabitStatus;
  week: number;
  isDaily: boolean;
  dateAdded?: string; // ISO date string for when habit was added to the list
}

export interface AssessmentArea {
  id: string;
  name: string;
  description: string;
  dimension: Dimension;
  score: number; // 1 (Bad), 2 (Regular), 3 (Good)
}

export interface UserProfile {
  name: string;
  hasPin: boolean;
  level: string; // e.g., "Buscador"
  streak: number;
  medals: number;
  avatarUrl?: string;
  pin?: string;
}