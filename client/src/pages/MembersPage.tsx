import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { membersApi } from '../utils/api';
import { Member } from '../types';
import { DEFAULT_AVATAR_COLORS } from '../utils/constants';

export default function MembersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectMember } = useChat();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, [user]);

  const loadMembers = async () => {
    if (!user) return;

    try {
      const response = await membersApi.getMembers(user.id);
      setMembers(response.members);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMember = (memberId: string) => {
    selectMember(memberId);
    navigate(`/mode/${memberId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-gray-400 text-sm">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-medium text-gray-900">RIIZE</div>
            <div className="text-xs text-gray-500">选择想聊天的成员</div>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="设置"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-1.756.426-2.924-.426-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Member list */}
      <div className="flex-1 px-4 py-3 space-y-2">
        {members.map((member) => {
          const intimacyTitle = member.intimacy?.title || '初识粉丝';
          const hasUnread = (member.unreadCount || 0) > 0;

          return (
            <button
              key={member.id}
              onClick={() => handleSelectMember(member.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white
                border border-gray-100 hover:border-blue-200 hover:bg-blue-50
                card-hover transition-all text-left"
            >
              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0"
                style={{ backgroundColor: DEFAULT_AVATAR_COLORS[member.memberKey] || '#CBD5E1' }}
              >
                {member.avatarUrl ? (
                  <img src={member.avatarUrl} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  member.name.charAt(0)
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-gray-900">
                    {member.userNote || member.name}
                  </span>
                  {member.userNote && (
                    <span className="text-xs text-gray-400">{member.name}</span>
                  )}
                  <span className="text-xs text-blue-400 bg-blue-50 px-1.5 py-0.5 rounded-full">
                    {intimacyTitle}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-gray-400 truncate flex-1">
                    {member.lastMessage || '还没有聊天记录'}
                  </span>
                  <span className="text-xs text-gray-300 ml-2 shrink-0">
                    {member.lastChatAt ? formatTime(member.lastChatAt) : ''}
                  </span>
                </div>
              </div>

              {/* Unread badge */}
              {hasUnread && (
                <div className="w-3 h-3 rounded-full bg-red-500 unread-badge shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return '刚刚';
    if (diffMin < 60) return `${diffMin}分钟前`;
    if (diffHour < 24) return `${diffHour}小时前`;
    if (diffDay < 7) return `${diffDay}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}
