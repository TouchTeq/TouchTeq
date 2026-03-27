'use client';

import { useState, useEffect, useCallback, useMemo, useRef, useSyncExternalStore, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Activity,
  LayoutDashboard, 
  Users, 
  FileText, 
  Receipt, 
  CreditCard, 
  PieChart, 
  BarChart3, 
  Settings, 
  LogOut, 
  Bell, 
  Menu, 
  ChevronsLeft,
  ChevronsRight,
  Search,
  Sun,
  Moon,
  Building2,
  Mail,
  Car,
  Shield,
  Fuel,
  Sparkles,
  Wallet,
  ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { OfficeBrandingProvider } from '@/components/office/OfficeBrandingContext';
import { OfficeToastProvider } from '@/components/office/OfficeToastContext';
import { AiDraftProvider } from '@/components/office/AiDraftContext';
import { ActiveDocumentProvider } from '@/components/office/ActiveDocumentContext';
import { OfficeThemeProvider, type OfficeTheme } from '@/components/office/OfficeThemeContext';
import dynamic from 'next/dynamic';
import CommandPalette, { type CommandPaletteItem } from '@/components/office/CommandPalette';

const AiAssistant = dynamic(() => import('@/components/office/AiAssistant'), { 
  ssr: false,
  loading: () => null 
});

type NavGroup = {
  title: string;
  items: { name: string; href: string; icon: any }[];
};

const navGroups: NavGroup[] = [
  {
    title: 'CORE',
    items: [
      { name: 'Dashboard', href: '/office/dashboard', icon: LayoutDashboard },
      { name: 'Clients', href: '/office/clients', icon: Users },
      { name: 'AI Assistant', href: '/office/settings?tab=assistant', icon: Sparkles },
    ],
  },
  {
    title: 'REVENUE',
    items: [
      { name: 'Quotes', href: '/office/quotes', icon: FileText },
      { name: 'Invoices', href: '/office/invoices', icon: Receipt },
      { name: 'Credit Notes', href: '/office/invoices?tab=credit-notes', icon: Receipt },
      { name: 'Purchase Orders', href: '/office/purchase-orders', icon: ShoppingBag },
      { name: 'Expenses', href: '/office/expenses', icon: CreditCard },
      { name: 'VAT', href: '/office/vat', icon: PieChart },
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      { name: 'Timeline', href: '/office/timeline', icon: Activity },
      { name: 'Reports', href: '/office/reports', icon: BarChart3 },
      { name: 'Cash Flow', href: '/office/cash-flow', icon: Wallet },
    ],
  },
  {
    title: 'FLEET',
    items: [
      { name: 'Travel Logbook', href: '/office/travel', icon: Car },
      { name: 'Fuel Tracker', href: '/office/fuel', icon: Fuel },
    ],
  },
  {
    title: 'ADMIN',
    items: [
      { name: 'Certificates', href: '/office/certificates', icon: Shield },
      { name: 'Settings', href: '/office/settings', icon: Settings },
    ],
  },
];

function getStoredOfficeTheme(): OfficeTheme {
  if (typeof window === 'undefined') return 'dark';
  const savedTheme = window.localStorage.getItem('office-theme');
  return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark';
}

function subscribeToOfficeTheme(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleThemeChange = () => callback();
  window.addEventListener('storage', handleThemeChange);
  window.addEventListener('office-theme-change', handleThemeChange);

  return () => {
    window.removeEventListener('storage', handleThemeChange);
    window.removeEventListener('office-theme-change', handleThemeChange);
  };
}

// Create a small wrapper component to handle the searchParams
function SidebarNav({ 
  navGroups, 
  isCollapsed, 
  pathname 
}: { 
  navGroups: NavGroup[], 
  isCollapsed: boolean, 
  pathname: string 
}) {
  const searchParams = useSearchParams();
  
  return (
    <nav className={`flex-1 min-h-0 py-4 space-y-4 overflow-y-auto overflow-x-hidden ${isCollapsed ? 'px-2' : 'px-3'}`}>
      {navGroups.map((group) => (
        <div key={group.title}>
          {!isCollapsed && (
            <div className="px-3 mb-2">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">{group.title}</span>
            </div>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const itemUrl = item.href.includes('?') 
                ? new URL(item.href, 'http://localhost') 
                : { pathname: item.href, searchParams: new URLSearchParams() };
              const itemTab = (itemUrl as any).searchParams?.get('tab');
              const currentTab = searchParams.get('tab');
              
              let isActive = false;
              if (itemTab) {
                isActive = pathname === (itemUrl as any).pathname && currentTab === itemTab;
              } else {
                if (pathname === '/office/invoices' && currentTab) {
                  isActive = false; 
                } else {
                  isActive = item.href === '/office/dashboard' 
                    ? pathname === item.href 
                    : pathname.startsWith(item.href);
                }
              }
              return (
                <div key={item.name} className="relative group/tooltip">
                  <Link
                    href={item.href}
                    className={`group flex items-center rounded-lg transition-all ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'} ${isActive ? 'bg-orange-500 shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  >
                    <item.icon size={20} className={`flex-shrink-0 transition-colors ${isActive ? 'text-[#FFFFFF]' : 'text-slate-400 group-hover:text-[#FF6900]'}`} />
                    {!isCollapsed && (
                      <span className="font-bold text-[13px] uppercase tracking-wider whitespace-nowrap">
                        {item.name}
                      </span>
                    )}
                  </Link>
                  {isCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-xl border border-slate-700 whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-[200]">
                      {item.name}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function OfficeLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [overdueReminderCount, setOverdueReminderCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const theme = useSyncExternalStore<OfficeTheme>(
    subscribeToOfficeTheme,
    getStoredOfficeTheme,
    () => 'dark'
  );

  // Fetch business profile logo
  useEffect(() => {
    async function fetchLogo() {
      const { data } = await supabase
        .from('business_profile')
        .select('logo_url')
        .single();
      if (data?.logo_url) setLogoUrl(data.logo_url);
    }
    fetchLogo();
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;

    async function fetchReminderCount() {
      const { count, error } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Overdue');

      if (!isMounted) return;
      if (error) {
        console.error('Failed to load overdue reminder count:', error);
        return;
      }

      setOverdueReminderCount(count || 0);
    }

    void fetchReminderCount();

    return () => {
      isMounted = false;
    };
  }, [pathname, supabase]);

  // Handle responsiveness + localStorage persistence for collapsed state
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
        setIsCollapsed(false);
      } else {
        setIsSidebarOpen(true);
        const saved = localStorage.getItem('office-sidebar-collapsed');
        setIsCollapsed(saved === 'true');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('office-sidebar-collapsed', String(next));
  };

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toLowerCase();
      return (
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        target.isContentEditable
      );
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      const isK = e.key.toLowerCase() === 'k';
      if ((e.ctrlKey || e.metaKey) && isK) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/office/login');
  };

  const setTheme = useCallback((nextTheme: OfficeTheme) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('office-theme', nextTheme);
    window.dispatchEvent(new Event('office-theme-change'));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);

  const allNavItems = navGroups.flatMap(g => g.items);

  // Don't show layout on login page
  if (pathname === '/office/login') {
    return <>{children}</>;
  }

  const currentPageTitle = allNavItems.find(item => pathname === item.href)?.name || 'Office';
  
  const paletteItems: CommandPaletteItem[] = [
    ...allNavItems.map((it) => ({
      id: it.href,
      label: it.name,
      keywords: 'navigate page',
      Icon: it.icon as any,
      onSelect: () => router.push(it.href),
    })),
    { id: 'new-quote', label: 'New Quote', keywords: 'create quotation', Icon: FileText as any, onSelect: () => router.push('/office/quotes/new') },
    { id: 'new-invoice', label: 'New Invoice', keywords: 'create tax invoice', Icon: Receipt as any, onSelect: () => router.push('/office/invoices/new') },
    { id: 'new-client', label: 'New Client', keywords: 'create customer', Icon: Users as any, onSelect: () => router.push('/office/clients/new') },
    { id: 'settings-profile', label: 'Settings: Business Profile', keywords: 'profile details setup business making details', Icon: Building2 as any, onSelect: () => router.push('/office/settings?tab=profile') },
    { id: 'settings-banking', label: 'Settings: Banking Details', keywords: 'bank account payments bank set up making details', Icon: CreditCard as any, onSelect: () => router.push('/office/settings?tab=banking') },
    { id: 'settings-documents', label: 'Settings: Document Templates', keywords: 'templates quote invoice layout branding', Icon: FileText as any, onSelect: () => router.push('/office/settings?tab=documents') },
    { id: 'settings-emails', label: 'Settings: Email Settings', keywords: 'email templates mail smtp communication', Icon: Mail as any, onSelect: () => router.push('/office/settings?tab=emails') },
    { id: 'settings-assistant', label: 'Settings: AI Assistant', keywords: 'assistant voice language concise confirmation hands free', Icon: Search as any, onSelect: () => router.push('/office/settings?tab=assistant') },
    { id: 'settings-system', label: 'Settings: System Preferences', keywords: 'preferences currency vat export data system reference', Icon: Settings as any, onSelect: () => router.push('/office/settings?tab=system') },
    { id: 'fuel-tracker', label: 'Fuel Tracker', keywords: 'fuel petrol diesel log expense', Icon: Fuel as any, onSelect: () => router.push('/office/fuel') },
  ];

  return (
    <OfficeThemeProvider value={{ theme, setTheme, toggleTheme }}>
      <OfficeToastProvider>
        <AiDraftProvider>
          <ActiveDocumentProvider>
            <OfficeBrandingProvider value={{ logoUrl, setLogoUrl }}>
              <div data-office-theme={theme} className="office-theme min-h-screen bg-[#0B0F19] text-slate-200 font-sans flex transition-colors">
            <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} items={paletteItems} />
            
            {/* Mobile Overlay */}
            <AnimatePresence>
              {isMobile && isSidebarOpen && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSidebarOpen(false)}
                  className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
                />
              )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
              initial={false}
              animate={{ 
                width: isMobile ? (isSidebarOpen ? 236 : 0) : isCollapsed ? 61 : 220,
                x: isMobile && !isSidebarOpen ? -236 : 0
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="sticky top-0 inset-y-0 left-0 z-50 bg-[#151B28] border-r border-slate-800/50 flex flex-col h-screen overflow-y-auto overflow-x-hidden flex-shrink-0"
            >
              {/* Logo Area */}
              <div className={`flex items-center justify-between border-b border-slate-800/50 flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'p-4 justify-center' : 'p-5 gap-[10px]'}`}>
                <div className="flex items-center gap-[10px]">
                  <div className={`relative overflow-hidden flex-shrink-0 ${isCollapsed ? 'w-8 h-8' : 'w-9 h-9'}`}>
                    {logoUrl ? (
                      <Image
                        src={logoUrl}
                        alt="Logo"
                        fill
                        sizes={isCollapsed ? '32px' : '36px'}
                        className="object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-orange-500 flex items-center justify-center rounded-lg">
                        <span className="text-white font-black text-lg">T</span>
                      </div>
                    )}
                  </div>
                  {!isCollapsed && (
                    <div className="flex flex-col min-w-0 overflow-hidden">
                      <span className="font-black text-lg uppercase tracking-tighter text-white whitespace-nowrap overflow-hidden text-ellipsis">
                        Touch<span className="text-orange-500">Teq</span>
                      </span>
                      <span className="font-bold text-xs uppercase tracking-tighter text-[#888888] whitespace-nowrap overflow-hidden text-ellipsis">
                        Office
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation */}
              <Suspense fallback={<div className="flex-1" />}>
                <SidebarNav navGroups={navGroups} isCollapsed={isCollapsed} pathname={pathname} />
              </Suspense>

              {/* Bottom: Sign Out */}
              <div className={`border-t border-slate-800/50 flex flex-col gap-1 ${isCollapsed ? 'p-2' : 'p-3'}`}>
                <div className="relative group/tooltip">
                  <button onClick={handleSignOut} className={`w-full flex items-center rounded-lg text-slate-400 hover:text-white hover:bg-red-500/10 transition-all group ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'}`}>
                    <LogOut size={18} className="group-hover:text-red-500 flex-shrink-0" />
                    {!isCollapsed && <span className="font-bold text-[13px] uppercase tracking-wider">Sign Out</span>}
                  </button>
                  {isCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-xl border border-slate-700 whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-[200]">
                      Sign Out
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                    </div>
                  )}
                </div>
              </div>
            </motion.aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
              <header className="h-16 bg-[#151B28]/80 backdrop-blur-md border-b border-slate-800/50 flex items-center justify-between px-6 flex-shrink-0">
                <div className="flex items-center gap-4">
                  <button onClick={() => isMobile ? setIsSidebarOpen(!isSidebarOpen) : toggleCollapse()} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all">
                    <Menu size={20} />
                  </button>
                  <h1 className="text-lg font-black uppercase tracking-tight text-white">{currentPageTitle}</h1>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest leading-none">
                      {new Date().toLocaleDateString('en-ZA', { weekday: 'long' })}
                    </span>
                    <span className="text-xs font-black text-white uppercase tracking-tighter">
                      {new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  <button type="button" onClick={() => setPaletteOpen(true)} className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-800/60 bg-[#0B0F19]/60 text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all" title="Quick search (Ctrl/Cmd+K)">
                    <Search size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Search</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-2">Ctrl K</span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-800/60 bg-[#0B0F19]/60 text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all"
                    title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">
                      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => router.push('/office/reminders')}
                    className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800/40"
                    title={overdueReminderCount > 0 ? `Open reminders (${overdueReminderCount} overdue)` : 'Open reminders'}
                    aria-label={overdueReminderCount > 0 ? `Open reminders, ${overdueReminderCount} overdue invoices` : 'Open reminders'}
                  >
                    <Bell size={18} />
                    {overdueReminderCount > 0 ? (
                      <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-orange-500 text-white rounded-full border-2 border-[#151B28] flex items-center justify-center text-[9px] font-black leading-none">
                        {overdueReminderCount > 99 ? '99+' : overdueReminderCount}
                      </span>
                    ) : (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-slate-500 rounded-full border-2 border-[#151B28]"></span>
                    )}
                  </button>
                </div>
              </header>

              <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 lg:overflow-y-auto">
                {children}
              </main>
            </div>
            <AiAssistant />
              </div>
            </OfficeBrandingProvider>
          </ActiveDocumentProvider>
        </AiDraftProvider>
      </OfficeToastProvider>
    </OfficeThemeProvider>
  );
}
