"use client";
import { useEffect, useState } from 'react';
import ChatDashboard from '@/components/chat/ChatDashboard';
import { ToastProvider } from '@/components/ui/toast';
import { MessageCircle, AlertCircle, User } from 'lucide-react';

export default function ChatPage() {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed');
        if (json.user && !json.user.isProfileCompleted) {
          setProfileIncomplete(true);
        }
        if (mounted) {
          setToken(json.token);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; }
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <div className="text-white text-lg font-medium">Loading Chat...</div>
            <div className="text-gray-400 text-sm">Please wait while we set things up</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <div className="text-red-400 text-lg font-medium">Connection Error</div>
            <div className="text-gray-400 text-sm">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (profileIncomplete) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-yellow-500/20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-yellow-400" />
            </div>
            <div className="text-yellow-400 text-lg font-medium">Profile Incomplete</div>
            <div className="text-gray-400 text-sm">Please complete your profile before using chat</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-6 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Chat Hub</h1>
            <p className="text-gray-400">Connect and communicate in real-time</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 px-6 pb-6 min-h-0">
        <ToastProvider>
          <ChatDashboard token={token} />
        </ToastProvider>
      </div>
    </div>
  );
}
