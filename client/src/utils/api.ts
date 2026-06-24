// API utility - all requests go through Vite proxy (/api -> localhost:3001/api)
// No hardcoded external URLs

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
}

async function apiFetch<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = 'GET', body } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`/api${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// === Auth API ===
export const authApi = {
  login: (nickname: string, deviceId: string) =>
    apiFetch<{ user: any; isNew: boolean }>('/auth/login', {
      method: 'POST',
      body: { nickname, deviceId },
    }),

  getMe: (deviceId: string) =>
    apiFetch<{ user: any }>(`/auth/me?deviceId=${deviceId}`),

  updateMood: (userId: string, mood: string) =>
    apiFetch<{ message: string; mood: string }>('/auth/mood', {
      method: 'PUT',
      body: { userId, mood },
    }),

  updateNickname: (userId: string, nickname: string) =>
    apiFetch<{ message: string; nickname: string }>('/auth/nickname', {
      method: 'PUT',
      body: { userId, nickname },
    }),
};

// === Members API ===
export const membersApi = {
  getMembers: (userId?: string) =>
    apiFetch<{ members: any[] }>(`/members${userId ? `?userId=${userId}` : ''}`),

  getMember: (memberId: string, userId?: string) =>
    apiFetch<{ member: any }>(`/members/${memberId}${userId ? `?userId=${userId}` : ''}`),

  updateMember: (data: {
    userId: string;
    memberId: string;
    avatarUrl?: string;
    backgroundUrl?: string;
    userNote?: string;
    customPrompt?: string;
    personalitySettings?: Record<string, string>;
  }) =>
    apiFetch<{ message: string }>('/members/update', {
      method: 'POST',
      body: data,
    }),

  uploadAvatar: (memberId: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return fetch(`/api/settings/avatar/${memberId}`, {
      method: 'POST',
      body: formData,
    }).then(r => r.json());
  },

  uploadBackground: (memberId: string, file: File) => {
    const formData = new FormData();
    formData.append('background', file);
    return fetch(`/api/settings/background/${memberId}`, {
      method: 'POST',
      body: formData,
    }).then(r => r.json());
  },
};

// === Chat API ===
export const chatApi = {
  sendMessage: (data: {
    userId: string;
    memberId: string;
    content: string;
    mode: string;
    mood?: string;
  }) =>
    apiFetch<any>('/chat/message', {
      method: 'POST',
      body: data,
    }),

  getHistory: (userId: string, memberId: string, options?: {
    limit?: number;
    search?: string;
  }) =>
    apiFetch<any>(
      `/chat/history/${userId}/${memberId}${options?.search ? `?search=${encodeURIComponent(options.search)}` : `?limit=${options?.limit || 100}`}`
    ),

  deleteHistory: (userId: string, memberId: string) =>
    apiFetch<{ message: string }>(`/chat/history/${userId}/${memberId}`, {
      method: 'DELETE',
    }),

  deleteAllHistory: (userId: string) =>
    apiFetch<{ message: string }>(`/chat/history/${userId}`, {
      method: 'DELETE',
    }),

  translate: (text: string, memberId: string) =>
    apiFetch<{ translation: string }>('/chat/translate', {
      method: 'POST',
      body: { text, memberId },
    }),
};

// === Intimacy API ===
export const intimacyApi = {
  getIntimacy: (userId: string, memberId: string) =>
    apiFetch<{ intimacy: any }>(`/intimacy/${userId}/${memberId}`),

  getAllIntimacy: (userId: string) =>
    apiFetch<{ intimacyList: any[] }>(`/intimacy/${userId}`),
};

// === Settings API ===
export const settingsApi = {
  verifyPassword: (password: string) =>
    apiFetch<{ verified: boolean }>('/settings/verify-password', {
      method: 'POST',
      body: { password },
    }),

  getApiConfig: () =>
    apiFetch<{ baseUrl: string; modelName: string }>('/settings/api-config'),

  updateApiConfig: (data: {
    apiKey?: string;
    baseUrl?: string;
    modelName?: string;
    adminPassword: string;
  }) =>
    apiFetch<{ message: string }>('/settings/api-config', {
      method: 'POST',
      body: data,
    }),

  deleteAccount: (userId: string, adminPassword: string) =>
    apiFetch<{ message: string }>(`/settings/account/${userId}`, {
      method: 'DELETE',
      body: { adminPassword },
    }),
};

// === Device ID Utility ===
export function generateDeviceId(): string {
  // Generate a unique device ID and persist in localStorage
  const STORAGE_KEY = 'riize_device_id';
  let deviceId = localStorage.getItem(STORAGE_KEY);

  if (!deviceId) {
    // Create a fingerprint from browser properties + random
    const nav = navigator;
    const screen = window.screen;
    const raw = [
      nav.userAgent,
      nav.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      Math.random().toString(36).substring(2, 10),
    ].join('|');

    // Simple hash
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    deviceId = 'device_' + Math.abs(hash).toString(36) + '_' + Math.random().toString(36).substring(2, 8);
    localStorage.setItem(STORAGE_KEY, deviceId);
  }

  return deviceId;
}
