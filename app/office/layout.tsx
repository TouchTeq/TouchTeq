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
  Clock,
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
  ShoppingBag,
  Bot,
  ChevronDown,
  CheckSquare,
  StickyNote,
  Calendar,
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
  collapsible: boolean;
  defaultExpanded: boolean;
  items: { name: string; href: string; icon: any }[];
};

const navGroups: NavGroup[] = [
  {
    title: 'CORE',
    collapsible: false,
    defaultExpanded: true,
    items: [
      { name: 'Dashboard', href: '/office/dashboard', icon: LayoutDashboard },
      { name: 'Clients', href: '/office/clients', icon: Users },
      { name: 'AI Assistant', href: '/office/ai-assistant', icon: Sparkles },
      { name: 'Tasks', href: '/office/tasks', icon: CheckSquare },
      { name: 'Notes', href: '/office/notes', icon: StickyNote },
      { name: 'Calendar', href: '/office/calendar', icon: Calendar },
      { name: 'Reminders', href: '/office/reminders', icon: Bell },
    ],
  },
  {
    title: 'REVENUE',
    collapsible: true,
    defaultExpanded: true,
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
    collapsible: true,
    defaultExpanded: true,
    items: [
      { name: 'Timeline', href: '/office/timeline', icon: Activity },
      { name: 'Reminders', href: '/office/reminders', icon: Bell },
      { name: 'Activity', href: '/office/activity', icon: Clock },
      { name: 'Reports', href: '/office/reports', icon: BarChart3 },
      { name: 'Cash Flow', href: '/office/cash-flow', icon: Wallet },
    ],
  },
  {
    title: 'FLEET',
    collapsible: true,
    defaultExpanded: false,
    items: [
      { name: 'Travel Logbook', href: '/office/travel', icon: Car },
      { name: 'Fuel Tracker', href: '/office/fuel', icon: Fuel },
    ],
  },
  {
    title: 'ADMIN',
    collapsible: true,
    defaultExpanded: false,
    items: [
      { name: 'Certificates', href: '/office/certificates', icon: Shield },
      { name: 'Settings', href: '/office/settings', icon: Settings },
      { name: 'AI Log', href: '/office/activity/ai-log', icon: Bot },
      { name: 'AI Diagnostics', href: '/office/ai-assistant/diagnostics', icon: Bot },
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
  pathname,
  sidebarRef,
  overdueReminderCount,
  onSignOut,
}: {
  navGroups: NavGroup[];
  isCollapsed: boolean;
  pathname: string;
  sidebarRef?: React.MutableRefObject<HTMLDivElement | null>;
  overdueReminderCount?: number;
  onSignOut: () => void;
}) {
  const searchParams = useSearchParams();

  // Initialise group open/closed state — expand the group that contains the active page
  const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {};
    for (const group of navGroups) {
      if (!group.collapsible) continue;
      const activeInGroup = group.items.some((item) => {
        const itemPath = item.href.split('?')[0];
        return (
          pathname === itemPath ||
          (itemPath !== '/office/dashboard' && pathname.startsWith(itemPath))
        );
      });
      state[group.title] = activeInGroup ? true : group.defaultExpanded;
    }
    return state;
  });

  // On mount, overlay with persisted localStorage values (but keep active group forced open)
  useEffect(() => {
    setGroupOpen((prev) => {
      const next = { ...prev };
      for (const group of navGroups) {
        if (!group.collapsible) continue;
        const activeInGroup = group.items.some((item) => {
          const itemPath = item.href.split('?')[0];
          return (
            pathname === itemPath ||
            (itemPath !== '/office/dashboard' && pathname.startsWith(itemPath))
          );
        });
        if (activeInGroup) {
          next[group.title] = true; // always open active group
        } else {
          const saved = window.localStorage.getItem(`nav-group-v2-${group.title}`);
          if (saved !== null) next[group.title] = saved === 'true';
        }
      }
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When pathname changes, force the active group open
  useEffect(() => {
    setGroupOpen((prev) => {
      const next = { ...prev };
      for (const group of navGroups) {
        if (!group.collapsible) continue;
        const activeInGroup = group.items.some((item) => {
          const itemPath = item.href.split('?')[0];
          return (
            pathname === itemPath ||
            (itemPath !== '/office/dashboard' && pathname.startsWith(itemPath))
          );
        });
        if (activeInGroup) next[group.title] = true;
      }
      return next;
    });
  }, [pathname, navGroups]);

  const toggleGroup = (title: string) => {
    setGroupOpen((prev) => {
      const next = { ...prev, [title]: !prev[title] };
      window.localStorage.setItem(`nav-group-v2-${title}`, String(next[title]));
      return next;
    });
  };

  // Handle wheel scrolling for sidebar - prevent main content from scrolling
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const sidebar = sidebarRef?.current;
      if (!sidebar) return;
      const rect = sidebar.getBoundingClientRect();
      const isOverSidebar =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (isOverSidebar) {
        e.stopPropagation();
        e.preventDefault();
        const { scrollTop, scrollHeight, clientHeight } = sidebar;
        const canScrollUp = scrollTop > 0;
        const canScrollDown = scrollTop + clientHeight < scrollHeight;
        if ((e.deltaY < 0 && canScrollUp) || (e.deltaY > 0 && canScrollDown)) {
          sidebar.scrollTop += e.deltaY;
        }
      }
    };
    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => document.removeEventListener('wheel', handleWheel);
  }, [sidebarRef]);

  const renderItem = (item: { name: string; href: string; icon: any }) => {
    const itemUrl = item.href.includes('?')
      ? new URL(item.href, 'http://localhost')
      : { pathname: item.href, searchParams: new URLSearchParams() };
    const itemTab = (itemUrl as any).searchParams?.get('tab');
    const currentTab = searchParams.get('tab');

    let isActive = false;
    if (itemTab) {
      isActive = pathname === (itemUrl as any).pathname && currentTab === itemTab;
    } else if (pathname === '/office/invoices' && currentTab) {
      isActive = false;
    } else {
      isActive =
        item.href === '/office/dashboard'
          ? pathname === item.href
          : pathname.startsWith(item.href.split('?')[0]);
    }

    // ── Collapsed (icon-only) ─────────────────────────────────────────────────
    if (isCollapsed) {
      return (
        <div key={item.name} className="relative group/tooltip">
          <Link
            href={item.href}
            className={`group flex items-center justify-center p-3 rounded-lg transition-all ${
              isActive
                ? 'bg-orange-500 shadow-lg shadow-orange-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <item.icon
              size={20}
              className={`flex-shrink-0 transition-colors ${
                isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#FF6900]'
              }`}
            />
            {item.name === 'Reminders' && overdueReminderCount && overdueReminderCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-orange-500 text-white rounded-full flex items-center justify-center text-[10px] font-black leading-none">
                {overdueReminderCount > 99 ? '99+' : overdueReminderCount}
              </span>
            )}
          </Link>
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-xl border border-slate-700 whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-[200]">
            {item.name}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
          </div>
        </div>
      );
    }

    // ── Expanded (tree-style with horizontal connector) ───────────────────────
    return (
      <div key={item.name} className="relative group/tooltip pl-[30px]">
        {/* Horizontal branch line — connects to the vertical tree line */}
        <div className="absolute left-[14px] top-1/2 -translate-y-1/2 w-[14px] h-px bg-slate-700/60 pointer-events-none" />
        <Link
          href={item.href}
          className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] transition-all ${
            isActive
              ? 'bg-orange-500 shadow-lg shadow-orange-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <item.icon
            size={16}
            className={`flex-shrink-0 transition-colors ${
              isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#FF6900]'
            }`}
          />
          <span className={`text-[12px] font-semibold uppercase tracking-wide whitespace-nowrap ${
            isActive ? 'text-white' : ''
          }`}>
            {item.name}
          </span>
          {item.name === 'Reminders' && overdueReminderCount && overdueReminderCount > 0 && (
            <span className="ml-auto min-w-5 h-5 px-1 bg-orange-500 text-white rounded-full flex items-center justify-center text-[10px] font-black leading-none">
              {overdueReminderCount > 99 ? '99+' : overdueReminderCount}
            </span>
          )}
        </Link>
      </div>
    );
  };

  return (
    <nav
      className={`flex-1 min-h-0 py-4 overflow-y-auto overflow-x-hidden ${
        isCollapsed ? 'px-2' : 'px-3'
      } scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent`}
      onWheel={(e) => e.stopPropagation()}
      style={{ overflowY: 'auto' }}
    >
      {navGroups.map((group, groupIndex) => {
        const isOpen = !group.collapsible || groupOpen[group.title] === true;

        return (
          <div key={group.title} className={groupIndex > 0 ? 'mt-5' : ''}>
            {/* Group header */}
            {!isCollapsed && (
              group.collapsible ? (
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex items-center justify-between px-1 py-1 mb-2 rounded-md hover:bg-slate-800/30 transition-colors group/header"
                >
                  <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-400 group-hover/header:text-slate-300 transition-colors">
                    {group.title}
                  </span>
                  <ChevronDown
                    size={11}
                    className={`text-slate-600 group-hover/header:text-slate-400 transition-all duration-200 ${
                      isOpen ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                </button>
              ) : (
                <div className="px-1 py-1 mb-2">
                  <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-400">
                    {group.title}
                  </span>
                </div>
              )
            )}

            {/* Group items — always visible when collapsed (icon-only), animate when expanded */}
            {isCollapsed ? (
              <div className="space-y-0.5">
                {group.items.map(renderItem)}
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="items"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    {/* Tree container: vertical connecting line + items */}
                    <div className="relative">
                      <div className="absolute left-[14px] top-[14px] bottom-[14px] w-px bg-slate-700/50 pointer-events-none" />
                      <div className="space-y-0.5">
                        {group.items.map(renderItem)}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        );
      })}

      {/* Sign out — inside nav so it scrolls with content when collapsed */}
      <div className="pt-2 border-t border-slate-800/50 mt-2">
        <div className="relative group/tooltip">
          <button
            onClick={onSignOut}
            className={`w-full flex items-center rounded-lg text-slate-400 hover:text-white hover:bg-red-500/10 transition-all group ${
              isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'
            }`}
          >
            <LogOut size={18} className="group-hover:text-red-500 flex-shrink-0" />
            {!isCollapsed && (
              <span className="font-bold text-[13px] uppercase tracking-wider">Sign Out</span>
            )}
          </button>
          {isCollapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-xl border border-slate-700 whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-[200]">
              Sign Out
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
            </div>
          )}
        </div>
      </div>
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
  const sidebarRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);
  const theme = useSyncExternalStore<OfficeTheme>(
    subscribeToOfficeTheme,
    getStoredOfficeTheme,
    () => 'dark'
  );

  const isEnvMissing = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (isEnvMissing) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-center p-6 text-center space-y-8 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>

        <div className="max-w-md w-full p-8 md:p-10 bg-[#151B28] border border-slate-800/50 shadow-2xl relative z-10 space-y-8">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-orange-500/20 shadow-lg shadow-orange-500/10">
              <Shield size={32} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Supabase Connection Required</h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">Your project's URL and API key are required to initialize the office dashboard. Please add them to your environment variables or the AI Studio secrets.</p>
          </div>

          <div className="text-left bg-[#0B0F19]/60 border border-slate-800/60 p-5 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Configuration Checklist:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-xs">
                <div className={`w-2 h-2 rounded-full ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                <span className={`font-mono ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-slate-500 line-through decoration-slate-700' : 'text-slate-300 font-bold'}`}>NEXT_PUBLIC_SUPABASE_URL</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className={`w-2 h-2 rounded-full ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                <span className={`font-mono ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'text-slate-500 line-through decoration-slate-700' : 'text-slate-300 font-bold'}`}>NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-3 bg-orange-500 hover:bg-orange-600/90 text-white font-black text-sm uppercase tracking-[0.2em] py-4 rounded-sm transition-all shadow-xl shadow-orange-500/10 active:scale-[0.98]"
            >
              REFRESH & RETRY
            </button>
            <p className="text-[10px] uppercase font-black tracking-[0.15em] text-slate-600">
              RESTART DEV SERVER AFTER ADDING SECRETS
            </p>
          </div>
        </div>

        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.4em] relative z-10">
          TouchTeq Office Management System
        </p>
      </div>
    );
  }

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
      // Fetch overdue invoices with client info to filter out orphaned invoices
      const { data, error } = await supabase
        .from('invoices')
        .select('*, clients(id)')
        .eq('status', 'Overdue');

      if (!isMounted) return;
      if (error) {
        console.error('Failed to load overdue reminder count:', error);
        return;
      }

      // Filter out invoices where the client has been deleted (orphaned invoices)
      const validOverdueInvoices = data?.filter(inv => inv.clients !== null) || [];
      setOverdueReminderCount(validOverdueInvoices.length);
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
    { id: 'tasks', label: 'Tasks', keywords: 'task todo', Icon: CheckSquare as any, onSelect: () => router.push('/office/tasks') },
    { id: 'notes', label: 'Notes', keywords: 'note sticky', Icon: StickyNote as any, onSelect: () => router.push('/office/notes') },
    { id: 'calendar', label: 'Calendar', keywords: 'cal date schedule', Icon: Calendar as any, onSelect: () => router.push('/office/calendar') },
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
                    width: isMobile ? (isSidebarOpen ? 236 : 0) : isCollapsed ? 70 : 220,
                    x: isMobile && !isSidebarOpen ? -236 : 0
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="sticky top-0 inset-y-0 left-0 z-50 bg-[#151B28] border-r border-slate-800/50 flex flex-col h-screen flex-shrink-0"
                >
                  {/* Logo Area */}
                  <div className={`flex items-center justify-between border-b border-slate-800/50 flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'p-4 justify-center' : 'p-5 gap-3'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`relative overflow-hidden flex-shrink-0 ${isCollapsed ? 'w-9 h-9' : 'w-10 h-10'}`}>
                        {logoUrl ? (
                          <Image
                            src={logoUrl}
                            alt="Logo"
                            fill
                            sizes={isCollapsed ? '36px' : '40px'}
                            className="object-contain"
                          />
                        ) : (
                          <Image
                            src="/TT-logo-orange-trans.png"
                            alt="TouchTeq Logo"
                            fill
                            sizes={isCollapsed ? '36px' : '40px'}
                            className="object-contain rounded"
                          />
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
                  <div ref={sidebarRef} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    <SidebarNav navGroups={navGroups} isCollapsed={isCollapsed} pathname={pathname} sidebarRef={sidebarRef} overdueReminderCount={overdueReminderCount} onSignOut={handleSignOut} />
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
                      <button type="button" onClick={() => setPaletteOpen(true)} className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-800/60 bg-[#0B0F19]/60 text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all min-w-[400px]" title="Quick search (Ctrl/Cmd+K)">
                        <Search size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Search</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-auto">Ctrl K</span>
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
                          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-orange-500 text-white rounded-full border-2 border-[#151B28] flex items-center justify-center text-[10px] font-black leading-none">
                            {overdueReminderCount > 99 ? '99+' : overdueReminderCount}
                          </span>
                        ) : (
                          <span className="absolute top-2 right-2 w-2 h-2 bg-slate-500 rounded-full border-2 border-[#151B28]"></span>
                        )}
                      </button>

                      <div className="hidden md:flex flex-col items-end">
                        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest leading-none">
                          {new Date().toLocaleDateString('en-ZA', { weekday: 'long' })}
                        </span>
                        <span className="text-xs font-black text-white uppercase tracking-tighter">
                          {new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </header>

                  <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 lg:overflow-y-auto">
                    {children}
                  </main>
                </div>
                {pathname !== '/office/ai-assistant' && <AiAssistant />}
              </div>
            </OfficeBrandingProvider>
          </ActiveDocumentProvider>
        </AiDraftProvider>
      </OfficeToastProvider>
    </OfficeThemeProvider>
  );
}
