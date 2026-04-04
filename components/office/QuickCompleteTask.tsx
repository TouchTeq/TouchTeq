'use client';

import { useState } from 'react';
import { updateTask } from '@/lib/tasks/actions';
import { Check, AlertCircle } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  due_time: string | null;
  category: string | null;
  client?: { company_name: string } | null;
}

export default function QuickCompleteTask({ task }: { task: Task }) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(task.status === 'done');

  const handleComplete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isCompleted || isCompleting) return;
    
    setIsCompleting(true);
    
    try {
      await updateTask(task.id, { status: 'done' });
      setIsCompleted(true);
    } catch (error) {
      console.error('Failed to complete task:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const priorityColor = {
    urgent: 'text-red-400 bg-red-500/20',
    high: 'text-orange-400 bg-orange-500/20',
    medium: 'text-blue-400 bg-blue-500/20',
    low: 'text-slate-400 bg-slate-500/20',
  };

  const isOverdue = task.due_date && task.due_date < new Date().toISOString().split('T')[0] && task.status !== 'done';

  return (
    <div className={`flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors ${isOverdue ? 'border-l-2 border-red-500' : ''}`}>
      <button
        onClick={handleComplete}
        disabled={isCompleted || isCompleting}
        className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          isCompleted 
            ? 'bg-green-500 border-green-500 text-white' 
            : 'border-slate-600 hover:border-orange-500'
        } ${isCompleting ? 'opacity-50' : ''}`}
      >
        {isCompleted ? <Check size={12} /> : isCompleting ? null : null}
      </button>
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${isCompleted ? 'text-slate-500 line-through' : 'text-white'}`}>
          {task.title}
        </p>
        {(task.due_time || task.category || task.client?.company_name) && (
          <div className="flex items-center gap-2 mt-1">
            {task.due_time && (
              <span className="text-xs text-slate-500">{task.due_time}</span>
            )}
            {task.category && (
              <span className="text-xs text-slate-500">{task.category}</span>
            )}
            {task.client?.company_name && (
              <span className="text-xs text-slate-400">• {task.client.company_name}</span>
            )}
          </div>
        )}
      </div>
      
      <span className={`text-[10px] px-2 py-0.5 rounded ${priorityColor[task.priority as keyof typeof priorityColor] || priorityColor.medium}`}>
        {task.priority.toUpperCase()}
      </span>
    </div>
  );
}