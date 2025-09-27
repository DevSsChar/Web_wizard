"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function RoomList({ rooms, onSelect, activeRoom }) {
  const [filter, setFilter] = useState('');
  const list = Object.values(rooms || {}).filter(r => !filter || r.roomId?.includes(filter));
  return (
    <div className="space-y-2 p-4 border rounded-md bg-background/60 backdrop-blur">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Your Rooms</h3>
      </div>
      <input className="text-xs w-full border rounded px-2 py-1 bg-transparent" placeholder="Filter" value={filter} onChange={e=>setFilter(e.target.value)} />
      <div className="space-y-1 max-h-56 overflow-auto pr-1">
        {list.length === 0 && <p className="text-xs text-muted-foreground">No rooms yet.</p>}
        {list.map(r => (
          <div key={r.roomId} className={`flex items-center justify-between text-xs px-2 py-1 rounded cursor-pointer ${activeRoom===r.roomId? 'bg-primary/20' : 'hover:bg-muted/50'}`} onClick={()=>onSelect(r.roomId)}>
            <span>{r.name} <span className="text-[10px] text-muted-foreground">#{r.roomId}</span></span>
            {r.isPrivate && <span className="text-[10px] px-1 rounded bg-yellow-500/20 text-yellow-600">Private</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
