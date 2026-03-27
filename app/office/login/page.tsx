'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'motion/react';
import { Mail, Lock, LogIn, AlertCircle, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/office/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md"
      >
        <div className="bg-[#151B28] border border-slate-800/50 p-8 md:p-10 shadow-2xl relative z-10">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-20 h-20 relative mb-6">
              <Image 
                src="/logo.png" 
                alt="TouchTeq Logo" 
                fill 
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-white">
              Touch<span className="text-orange-500">Teq</span> Office
            </h1>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-2">
              Business Management Portal
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@touchteq.co.za"
                  className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none p-4 pl-12 text-white transition-all font-medium placeholder:text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={20} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none p-4 pl-12 text-white transition-all font-medium placeholder:text-slate-700"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm font-medium"
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full group relative flex items-center justify-between bg-orange-500 hover:bg-orange-600 transition-all rounded-sm overflow-hidden shadow-xl shadow-orange-500/20 py-4 px-10 disabled:opacity-50"
            >
              <span className="text-white font-black text-sm uppercase tracking-[0.2em]">
                {loading ? 'Authenticating...' : 'Sign In To Portal'}
              </span>
              <div className="bg-[#1A2B4C] absolute right-0 top-0 bottom-0 px-4 flex items-center justify-center group-hover:bg-black transition-colors">
                <ArrowRight className="text-white w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-slate-600 text-[10px] uppercase font-bold tracking-[0.3em]">
              Authorized Personnel Only
            </p>
          </div>
        </div>
        
        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-xs font-medium">
            &copy; {new Date().getFullYear()} Touch Teqniques Engineering Services
          </p>
        </div>
      </motion.div>
    </div>
  );
}
