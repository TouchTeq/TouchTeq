'use client';

import { useEffect, useMemo, useState } from 'react';
import { 
  Building2, 
  CreditCard, 
  FileText, 
  Mail, 
  Settings as SettingsIcon,
  Car,
  Bot,
  KeyRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter, useSearchParams } from 'next/navigation';
import BusinessProfileTab from './BusinessProfileTab';
import BankingDetailsTab from './BankingDetailsTab';
import DocumentTemplatesTab from './DocumentTemplatesTab';
import EmailSettingsTab from './EmailSettingsTab';
import SystemPreferencesTab from './SystemPreferencesTab';
import TravelSettingsTab from './TravelSettingsTab';
import AiAssistantSettingsTab from './AiAssistantSettingsTab';
import ApiKeysTab from './ApiKeysTab';

export default function SettingsClient({ 
  initialProfile, 
  profile: propProfile, 
  setProfile: propSetProfile 
}: { 
  initialProfile?: any; 
  profile?: any; 
  setProfile?: any; 
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState(initialProfile || propProfile);

const TABS = useMemo(() => [
  { id: 'profile', label: 'Business Profile', icon: Building2 },
  { id: 'banking', label: 'Banking Details', icon: CreditCard },
  { id: 'documents', label: 'Document Templates', icon: FileText },
  { id: 'emails', label: 'Email Settings', icon: Mail },
  { id: 'assistant', label: 'AI Assistant Settings', icon: Bot },
  { id: 'travel', label: 'Travel Logbook Settings', icon: Car },
  { id: 'system', label: 'System Preferences', icon: SettingsIcon },
  { id: 'api-keys', label: 'API Keys', icon: KeyRound },
] as const, []);

  type TabId = (typeof TABS)[number]['id'];
  
  const requestedTab = searchParams.get('tab') as TabId | null;
  const resolvedTab = TABS.some((tab) => tab.id === requestedTab) ? (requestedTab as TabId) : 'profile';
  const [activeTab, setActiveTab] = useState<TabId>(resolvedTab);

  useEffect(() => {
    setActiveTab(resolvedTab);
  }, [resolvedTab]);

  const handleTabChange = (value: string) => {
    const nextTab = TABS.some((tab) => tab.id === value) ? (value as TabId) : 'profile';
    setActiveTab(nextTab);

    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', nextTab);
    router.replace(`/office/settings?${params.toString()}`, { scroll: false });
  };

    const renderActiveTab = () => {
      switch (activeTab) {
        case 'banking':
          return <BankingDetailsTab profile={profile} setProfile={setProfile} />;
        case 'documents':
          return <DocumentTemplatesTab profile={profile} setProfile={setProfile} />;
        case 'emails':
          return <EmailSettingsTab profile={profile} />;
        case 'assistant':
          return <AiAssistantSettingsTab profile={profile} setProfile={setProfile} />;
        case 'travel':
          return <TravelSettingsTab profile={profile} />;
        case 'system':
          return <SystemPreferencesTab profile={profile} />;
        case 'api-keys':
          return <ApiKeysTab />;
        case 'profile':
        default:
          return <BusinessProfileTab profile={profile} setProfile={setProfile} />;
      }
    };

  return (
    <div className="w-full z-20 relative">
      <div className="flex flex-col lg:flex-row gap-10 w-full">
        <div className="flex flex-row lg:flex-col gap-2 bg-[#0B0F19] p-2 rounded-2xl border border-slate-800/50 h-fit lg:w-72 sticky top-24 overflow-x-auto lg:overflow-x-visible no-scrollbar z-50">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                aria-pressed={isActive}
                className={`group flex items-center gap-3 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap lg:whitespace-normal cursor-pointer ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                    : 'text-slate-500 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon
                  size={18}
                  className={`transition-colors ${isActive ? 'text-[#FF6900]' : 'text-slate-500 group-hover:text-[#FF6900]'}`}
                />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="outline-none"
            >
              {renderActiveTab()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
