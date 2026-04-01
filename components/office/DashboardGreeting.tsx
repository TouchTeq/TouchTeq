'use client';

import { useState, useEffect } from 'react';

interface DashboardGreetingProps {
  name: string;
}

export default function DashboardGreeting({ name }: DashboardGreetingProps) {
  const [greeting, setGreeting] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();

    let text: string;
    if (hour >= 5 && hour < 12) {
      text = `Good morning, ${name}.`;
    } else if (hour >= 12 && hour < 17) {
      text = `Good afternoon, ${name}.`;
    } else if (hour >= 17 && hour < 21) {
      text = `Good evening, ${name}.`;
    } else {
      text = `Working late, ${name}.`;
    }

    setGreeting(text);

    // Format: "Wednesday, 01 April 2026"
    setDate(
      now.toLocaleDateString('en-ZA', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    );
  }, [name]);

  // Render a fixed-height placeholder until client-side hydration completes
  if (!greeting) {
    return <div className="h-[60px]" />;
  }

  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-3xl font-black text-white leading-tight">{greeting}</h2>
        <p className="text-slate-500 text-sm font-medium mt-1">Welcome back to Touch Teq Office.</p>
      </div>
      <p className="text-sm font-bold text-orange-400 uppercase tracking-wider whitespace-nowrap pb-0.5">
        {date}
      </p>
    </div>
  );
}
