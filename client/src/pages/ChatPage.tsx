import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { membersApi, chatApi } from '../utils/api';
import { Message, Member, ChatResponse } from '../types';
import { DEFAULT_AVATAR_COLORS, CHAT_MODE_OPTIONS } from '../utils/constants';

export default function ChatPage() {
  const navigate = useNavigate();
  const { memberId } = useParams<{ memberId: string }>();
  const { user } = useAuth();
  const { selectedMode, selectMember } = useChat();

  const [member, setMember] = useState<Member | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [proactiveMessages, setProactiveMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [intimacyData, setIntimacyData] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFallbackNotice, setShowFallbackNotice] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (memberId && user) {
      selectMember(memberId);
      loadData();
    }
  }, [memberId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const loadData = async () => {
    if (!memberId || !user) return;

    setIsLoading(true);
    try {
      // Load member info
      const memberRes = await membersApi.getMember(memberId, user.id);
      setMember(memberRes.member);

      // Load chat history
      const historyRes = await chatApi.getHistory(user.id, memberId, { limit: 100 });
      setMessages(historyRes.history || []);
      setProactiveMessages(historyRes.proactiveMessages || []);
      setIntimacyData(historyRes.intimacy);

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load data:', error);
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!inputText.trim() || !memberId || !user || isTyping) return;

    const content = inputText.trim();
    setInputText('');

    // Add user message immediately
    const userMsg: Message = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content,
      messageType: 'text',
      mode: selectedMode,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    // Show typing indicator
    setIsTyping(true);
    setShowFallbackNotice(false);

    // Simulate typing delay (1-3 seconds)
    const typingDelay = 1000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, typingDelay));

    try {
      const mood = user.currentMood || 'normal';
      const response: ChatResponse = await chatApi.sendMessage({
        userId: user.id,
        memberId,
        content,
        mode: selectedMode,
        mood,
      });

      // Add member message
      const memberMsg: Message = {
        id: `temp-member-${Date.now()}`,
        role: 'member',
        content: response.response.content,
        messageType: 'text',
        mode: selectedMode,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, memberMsg]);

      // Update intimacy
      if (response.intimacy) {
        setIntimacyData(response.intimacy);

        // Show upgrade message if intimacy upgraded
        if (response.intimacy.upgraded && response.intimacy.upgradeMessage) {
          const upgradeMsg: Message = {
            id: `temp-upgrade-${Date.now()}`,
            role: 'system',
            content: response.intimacy.upgradeMessage,
            messageType: 'system',
            mode: selectedMode,
            createdAt: new Date().toISOString(),
          };
          setMessages(prev => [...prev, upgradeMsg]);
        }
      }

      // Show fallback notice
      if (response.response.isFallback) {
        setShowFallbackNotice(true);
      }
    } catch (error) {
      console.error('Send message failed:', error);
      // Show error as member message
      const errorMsg: Message = {
        id: `temp-error-${Date.now()}`,
        role: 'member',
        content: '抱歉，发送失败了。请稍后再试。',
        messageType: 'text',
        mode: selectedMode,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !memberId || !user) return;

    try {
      const response = await chatApi.getHistory(user.id, memberId, { search: searchQuery.trim() });
      setSearchResults(response.history || []);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleDeleteHistory = async () => {
    if (!memberId || !user) return;

    try {
      await chatApi.deleteHistory(user.id, memberId);
      setMessages([]);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      handleSend();
    }
  };

  if (isLoading || !member) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-gray-400 text-sm">加载中...</div>
      </div>
    );
  }

  const modeLabel = CHAT_MODE_OPTIONS.find(m => m.value === selectedMode)?.label || '日常聊天';
  const avatarColor = DEFAULT_AVATAR_COLORS[member.memberKey] || '#CBD5E1';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 z-20">
        <div className="flex items-center gap-3">
          {/* Back button */}
          <button
            onClick={() => navigate('/members')}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0"
            style={{ backgroundColor: avatarColor }}
          >
            {member.avatarUrl ? (
              <img src={member.avatarUrl} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              member.name.charAt(0)
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-gray-900 truncate">
                {member.userNote || member.name}
              </span>
              <span className="text-xs text-blue-400 bg-blue-50 px-1.5 py-0.5 rounded-full shrink-0">
                {intimacyData?.title || member.intimacy?.title || '初识粉丝'}
              </span>
            </div>
            <div className="text-xs text-gray-400">
              {modeLabel} · {member.displayName}
            </div>
          </div>

          {/* Search & Delete buttons */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="搜索"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="删除聊天"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M3 7h18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search overlay */}
      {showSearch && (
        <div className="sticky top-[57px] bg-white border-b border-gray-100 px-4 py-2 z-10">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索聊天记录..."
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
              autoFocus
            />
            <button onClick={handleSearch} className="text-sm text-blue-500 px-2">搜索</button>
            <button onClick={() => { setShowSearch(false); setSearchResults([]); }} className="text-sm text-gray-400 px-2">关闭</button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
              {searchResults.map(msg => (
                <div key={msg.id} className="text-xs text-gray-600 px-2 py-1 rounded bg-gray-50">
                  <span className={msg.role === 'user' ? 'text-blue-500' : 'text-gray-800'}>
                    {msg.role === 'user' ? '你' : member.name}:
                  </span>
                  {msg.content}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 chat-bg-default">
        {/* Proactive messages */}
        {proactiveMessages.map(pm => (
          <div key={pm.id} className="bubble-system text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-yellow-50 text-xs text-yellow-700">
              💬 {pm.content}
            </div>
          </div>
        ))}

        {/* Messages */}
        {messages.map(msg => {
          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="bubble-user flex justify-end">
                <div className="max-w-[75%] px-4 py-2 rounded-2xl bg-blue-500 text-white text-sm leading-relaxed">
                  {msg.content}
                </div>
              </div>
            );
          }

          if (msg.role === 'system') {
            return (
              <div key={msg.id} className="bubble-system text-center">
                <div className="inline-block px-3 py-1 rounded-full bg-green-50 text-xs text-green-700">
                  {msg.content}
                </div>
              </div>
            );
          }

          // Member message
          return (
            <div key={msg.id} className="bubble-member flex items-start gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0 mt-1"
                style={{ backgroundColor: avatarColor }}
              >
                {member.avatarUrl ? (
                  <img src={member.avatarUrl} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  member.name.charAt(0)
                )}
              </div>
              <div className="max-w-[75%] px-4 py-2 rounded-2xl bg-white border border-gray-100 text-sm text-gray-800 leading-relaxed shadow-sm">
                {msg.content}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="bubble-member flex items-start gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
              style={{ backgroundColor: avatarColor }}
            >
              {member.avatarUrl ? (
                <img src={member.avatarUrl} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                member.name.charAt(0)
              )}
            </div>
            <div className="px-4 py-2 rounded-2xl bg-white border border-gray-100 text-sm text-gray-400 typing-indicator">
              正在输入中...
            </div>
          </div>
        )}

        {/* Fallback notice */}
        {showFallbackNotice && (
          <div className="text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-orange-50 text-xs text-orange-500">
              当前使用离线兜底回复
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Intimacy bar */}
      {intimacyData && (
        <div className="bg-white border-t border-gray-50 px-4 py-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{intimacyData.title}</span>
            <span>{intimacyData.score} / {intimacyData.nextScore ?? '∞'}</span>
          </div>
          <div className="mt-1 h-1 rounded-full bg-gray-100">
            <div
              className="intimacy-bar h-1 rounded-full bg-blue-400"
              style={{
                width: intimacyData.nextScore
                  ? `${Math.min(100, (intimacyData.score / intimacyData.nextScore) * 100)}%`
                  : '100%',
              }}
            />
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3 pb-[env(safe-area-inset-bottom,0)]">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="说点什么..."
            disabled={isTyping}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm
              focus:outline-none focus:border-blue-400 focus:bg-white
              disabled:bg-gray-100 disabled:text-gray-400 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={isTyping || !inputText.trim()}
            className="px-4 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-medium
              hover:bg-blue-600 active:bg-blue-700
              disabled:bg-gray-300 disabled:text-gray-500 transition-colors shrink-0"
          >
            发送
          </button>
        </div>
      </div>

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="text-base font-medium text-gray-900 mb-2">删除聊天记录</div>
            <div className="text-sm text-gray-500 mb-4">
              将删除与 {member.name} 的全部聊天记录。此操作不可恢复。
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleDeleteHistory}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm hover:bg-red-600"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
