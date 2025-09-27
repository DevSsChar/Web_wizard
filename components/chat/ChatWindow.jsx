"use client";
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChat } from './ChatProvider';

export default function ChatWindow({ room }) {
  const { rooms, sendMessage, activeRoom } = useChat();
  const [text, setText] = useState('');
  const messages = rooms[activeRoom]?.messages || [];
  const bottomRef = useRef(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({ behavior:'smooth'}); }, [messages.length]);

  if (!room) {
    return <div className="flex flex-col h-full items-center justify-center text-sm text-muted-foreground">Select or join a room</div>
  }

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(activeRoom, { text });
    setText('');
  }

  return (
    <div className="flex flex-col h-full border rounded-md overflow-hidden bg-background/60 backdrop-blur">
      <div className="px-4 py-2 border-b text-sm font-medium flex items-center justify-between">
        <span>{room.name} <span className="text-xs text-muted-foreground">#{room.roomId}</span></span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 p-4 text-xs">
        {messages.map(m => (
          <div key={m.id} className="space-y-0.5">
            <div className="font-medium">{m.sender?.username || m.sender?.name || 'User'} <span className="text-[10px] text-muted-foreground">{new Date(m.createdAt).toLocaleTimeString()}</span> {m.isEdited && <span className="text-[10px] italic">(Edited)</span>}</div>
            {m.text && <div className="text-sm leading-snug whitespace-pre-wrap break-words">{m.text}</div>}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={submit} className="p-2 flex gap-2 border-t">
        <Input value={text} onChange={e=>setText(e.target.value)} placeholder="Type a message" className="text-sm" />
        <Button type="submit" size="sm">Send</Button>
      </form>
    </div>
  );
}
