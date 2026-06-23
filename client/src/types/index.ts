// === Mood Types ===
export type MoodType =
  | 'happy'
  | 'normal'
  | 'tired'
  | 'sad'
  | 'anxious'
  | 'wantEncourage'
  | 'wantPracticeKorean';

// === Chat Mode Types ===
export type ChatMode = 'daily' | 'comfort' | 'study' | 'romantic' | 'korean';

// === User ===
export interface User {
  id: string;
  nickname: string;
  deviceId: string;
  currentMood: MoodType;
  createdAt: string;
}

// === Member ===
export interface Member {
  id: string;
  memberKey: string;
  name: string;
  displayName: string;
  koreanName: string;
  avatarUrl: string;
  backgroundUrl: string;
  sortOrder: number;
  basePrompt?: string;
  customPrompt?: string;
  personalitySettings?: string;
  // User-specific data (from API with userId)
  lastMessage?: string | null;
  lastChatAt?: string | null;
  intimacy?: {
    score: number;
    level: number;
    title: string;
  } | null;
  userNote?: string | null;
  unreadCount?: number;
}

// === Message ===
export interface Message {
  id: string;
  role: 'user' | 'member' | 'system';
  content: string;
  messageType: 'text' | 'emoji_card' | 'image_placeholder' | 'system';
  mode: ChatMode;
  createdAt: string;
}

// === Proactive Message ===
export interface ProactiveMessage {
  id: string;
  content: string;
  triggerType: 'daily_first' | 'intimacy_upgrade' | 'long_absence';
  createdAt: string;
}

// === Intimacy ===
export interface IntimacyData {
  score: number;
  level: number;
  title: string;
  nextLevel: number | null;
  nextTitle: string | null;
  nextScore: number | null;
  lastChatAt: string | null;
  lastDailyBonusDate: string;
}

// === Chat Response ===
export interface ChatResponse {
  response: {
    content: string;
    isFallback: boolean;
  };
  intimacy: {
    score: number;
    level: number;
    title: string;
    upgraded: boolean;
    previousLevel: number;
    upgradeMessage: string | null;
  };
  dailyBonus: {
    bonusAdded: boolean;
    points: number;
  };
}

// === Settings ===
export interface ApiConfig {
  baseUrl: string;
  modelName: string;
  // apiKey is never sent to frontend
}

// === Intimacy Level Constants ===
export interface IntimacyLevelDef {
  level: number;
  title: string;
  minScore: number;
}
