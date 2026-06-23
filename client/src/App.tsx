import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import LoginPage from './pages/LoginPage';
import MoodPage from './pages/MoodPage';
import MembersPage from './pages/MembersPage';
import ModePage from './pages/ModePage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import { useAuth } from './contexts/AuthContext';

// Protected route wrapper - requires login
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-gray-400 text-sm">加载中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-white text-gray-900">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/mood" element={<ProtectedRoute><MoodPage /></ProtectedRoute>} />
              <Route path="/members" element={<ProtectedRoute><MembersPage /></ProtectedRoute>} />
              <Route path="/mode/:memberId" element={<ProtectedRoute><ModePage /></ProtectedRoute>} />
              <Route path="/chat/:memberId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </BrowserRouter>
      </ChatProvider>
    </AuthProvider>
  );
}
