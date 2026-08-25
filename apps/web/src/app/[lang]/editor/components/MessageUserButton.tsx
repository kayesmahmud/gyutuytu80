'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';

interface MessageUserButtonProps {
  userId: number;
  lang: string;
}

// Open (or create) the editor↔user direct chat, then jump to it.
// Auth rides on the editor's NextAuth session cookie — same-origin fetch.
// Same flow as the Message button on pending ads (AdCard), minus the ad link.
export function MessageUserButton({ userId, lang }: MessageUserButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantIds: [userId], type: 'direct' }),
      });
      const data = await res.json();
      if (data?.success && data.data?.id) {
        router.push(`/${lang}/messages?conversation=${data.data.id}`);
      } else {
        alert(data?.message || 'Could not open the conversation. Please try again.');
      }
    } catch {
      alert('Could not open the conversation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      <MessageCircle size={16} />
      {loading ? 'Opening…' : 'Message'}
    </button>
  );
}
