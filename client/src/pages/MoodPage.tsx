import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MOOD_OPTIONS } from '../utils/constants';
import { MoodType } from '../types';

export default function MoodPage() {
  const navigate = useNavigate();
  const { user, updateMood } = useAuth();

  const handleSelectMood = async (mood: MoodType) => {
    try {
      await updateMood(mood);
      navigate('/members');
    } catch (error) {
      console.error('Failed to update mood:', error);
      // Still navigate even if API fails
      navigate('/members');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white px-6 py-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-lg font-medium text-gray-900 mb-1">
          {user?.nickname}，你好！
        </div>
        <div className="text-sm text-gray-500">今天心情怎么样？</div>
        <div className="text-xs text-gray-400 mt-1">会影响成员的回复风格</div>
      </div>

      {/* Mood options */}
      <div className="flex-1 flex flex-col gap-3 max-w-xs mx-auto w-full">
        {MOOD_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelectMood(option.value)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-white
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

      {/* Skip option */}
      <div className="text-center mt-6">
        <button
          onClick={() => navigate('/members')}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          不选，直接进入 →
        </button>
      </div>
    </div>
  );
}
