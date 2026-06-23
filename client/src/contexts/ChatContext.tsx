import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Message, ChatMode, ChatResponse } from '../types';

interface ChatContextType {
  // Current chat state
  selectedMemberId: string | null;
  selectedMode: ChatMode;
  messages: Message[];
  proactiveMessages: any[];
  isLoading: boolean;
  isTyping: boolean; // "正在输入中" simulation
  intimacyData: any;
  searchQuery: string;

  // Actions
  selectMember: (memberId: string) => void;
  selectMode: (mode: ChatMode) => void;
  sendMessage: (content: string) => Promise<ChatResponse>;
  loadHistory: (memberId: string) => Promise<void>;
  searchMessages: (query: string) => Promise<void>;
  deleteHistory: (memberId: string) => Promise<void>;
  clearChatState: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<ChatMode>('daily');
  const [messages, setMessages] = useState<Message[]>([]);
  const [proactiveMessages, setProactiveMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [intimacyData, setIntimacyData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selectMember = useCallback((memberId: string) => {
    setSelectedMemberId(memberId);
    setMessages([]);
    setProactiveMessages([]);
    setIntimacyData(null);
  }, []);

  const selectMode = useCallback((mode: ChatMode) => {
    setSelectedMode(mode);
  }, []);

  const sendMessage = useCallback(async (_content: string) => {
    // Actual implementation is in ChatPage which directly calls chatApi
    setIsTyping(true);
    try {
      return null as any;
    } catch (error) {
      setIsTyping(false);
      throw error;
    }
  }, []);

  const loadHistory = useCallback(async (_memberId: string) => {
    // Actual implementation is in ChatPage which directly calls chatApi
    setIsLoading(true);
    try {
      return null as any;
    } catch (error) {
      console.error('Load history failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchMessages = useCallback(async (query: string) => {
    setSearchQuery(query);
  }, []);

  const deleteHistory = useCallback(async (_memberId: string) => {
    // Actual implementation is in ChatPage which directly calls chatApi
    return null as any;
  }, []);

  const clearChatState = useCallback(() => {
    setSelectedMemberId(null);
    setSelectedMode('daily');
    setMessages([]);
    setProactiveMessages([]);
    setIntimacyData(null);
    setSearchQuery('');
  }, []);

  const value: ChatContextType = {
    selectedMemberId,
    selectedMode,
    messages,
    proactiveMessages,
    isLoading,
    isTyping,
    intimacyData,
    searchQuery,
    selectMember,
    selectMode,
    sendMessage,
    loadHistory,
    searchMessages,
    deleteHistory,
    clearChatState,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextType {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
