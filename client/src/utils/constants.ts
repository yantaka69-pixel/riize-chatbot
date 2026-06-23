import { MoodType, ChatMode, IntimacyLevelDef } from '../types';

// === Mood Options (需求文档规定的7种心情) ===
export interface MoodOption {
  value: MoodType;
  emoji: string;
  label: string;
  description: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { value: 'happy', emoji: '😊', label: '开心', description: '心情愉悦，想分享快乐' },
  { value: 'normal', emoji: '😐', label: '普通', description: '心情平静' },
  { value: 'tired', emoji: '😫', label: '有点累', description: '累了，需要安慰' },
  { value: 'sad', emoji: '😢', label: '难过', description: '心情低落，需要陪伴' },
  { value: 'anxious', emoji: '😰', label: '焦虑', description: '感到不安，需要安抚' },
  { value: 'wantEncourage', emoji: '💪', label: '想被鼓励', description: '需要正能量' },
  { value: 'wantPracticeKorean', emoji: '🇰🇷', label: '想练韩语', description: '想用韩语交流' },
];

// === Chat Mode Options (需求文档规定的5种模式) ===
export interface ChatModeOption {
  value: ChatMode;
  emoji: string;
  label: string;
  description: string;
}

export const CHAT_MODE_OPTIONS: ChatModeOption[] = [
  { value: 'daily', emoji: '💬', label: '日常聊天', description: '像朋友一样轻松聊天，语气自然' },
  { value: 'comfort', emoji: '🤗', label: '情绪安慰', description: '温柔安慰，给情绪支持' },
  { value: 'study', emoji: '📚', label: '学习/工作鼓励', description: '鼓励你学习，陪制定小目标' },
  { value: 'romantic', emoji: '💕', label: '恋爱感陪聊', description: '甜蜜温柔互动，但保持边界' },
  { value: 'korean', emoji: '🇰🇷', label: '韩语练习', description: '中文为主加入韩语短句练习' },
];

// === Intimacy Levels (需求文档规定的7档) ===
export const INTIMACY_LEVELS: IntimacyLevelDef[] = [
  { level: 1, title: '初识粉丝', minScore: 0 },
  { level: 2, title: '眼熟粉丝', minScore: 100 },
  { level: 3, title: '常来聊天的人', minScore: 300 },
  { level: 4, title: '熟悉朋友', minScore: 600 },
  { level: 5, title: '亲近粉丝', minScore: 1000 },
  { level: 6, title: '特别在意的人', minScore: 2000 },
  { level: 7, title: '专属陪伴', minScore: 4000 },
];

export function getIntimacyTitle(score: number): { level: number; title: string } {
  for (let i = INTIMACY_LEVELS.length - 1; i >= 0; i--) {
    if (score >= INTIMACY_LEVELS[i].minScore) {
      return { level: INTIMACY_LEVELS[i].level, title: INTIMACY_LEVELS[i].title };
    }
  }
  return INTIMACY_LEVELS[0];
}

// === Default Avatar Placeholder ===
export const DEFAULT_AVATAR_COLORS: Record<string, string> = {
  shotaro: '#F9A8D4', // pink
  eunseok: '#93C5FD', // blue
  sungchan: '#FCD34D', // amber
  wonbin: '#A7F3D0', // green
  sohee: '#FCA5A5', // red
  anton: '#C4B5FD', // purple
};

export const MEMBER_KEYS = ['shotaro', 'eunseok', 'sungchan', 'wonbin', 'sohee', 'anton'] as const;
