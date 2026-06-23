import { useNavigate, useParams } from 'react-router-dom';
import { useChat } from '../contexts/ChatContext';
import { CHAT_MODE_OPTIONS } from '../utils/constants';
import { ChatMode } from '../types';

export default function ModePage() {
  const navigate = useNavigate();
  const { memberId } = useParams<{ memberId: string }>();
  const { selectMode } = useChat();

  const handleSelectMode = (mode: ChatMode) => {
    selectMode(mode);
    navigate(`/chat/${memberId}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white px-6 py-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-lg font-medium text-gray-900 mb-1">选择聊天模式</div>
        <div className="text-sm text-gray-500">模式会影响成员的回复风格</div>
      </div>

      {/* Mode options */}
      <div className="flex-1 flex flex-col gap-3 max-w-xs mx-auto w-full">
        {CHAT_MODE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelectMode(option.value)}
            className="flex items-center gap-3 px-4 py-4 rounded-xl border border-gray-100 bg-white
              hover:border-blue-200 hover:bg-blue-50 active:bg-blue-100
              card-hover transition-all text-left"
          >
            <span className="text-2xl">{option.emoji}</span>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">{option.label}</div>
              <div className="text-xs text-gray-500">{option.description}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Back */}
      <div className="text-center mt-6">
        <button
          onClick={() => navigate('/members')}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← 返回成员选择
        </button>
      </div>
    </div>
  );
}
