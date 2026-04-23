import { Suspense } from 'react';
import { Metadata } from 'next';
import SettingsClient from './SettingsClient';
import { getBusinessProfile } from '@/lib/settings/actions';

export const metadata: Metadata = {
  title: 'Settings | Touch Teq Office',
  description: 'Manage your business profile, banking details, and application settings.',
};

export default async function SettingsPage() {
  const profile = await getBusinessProfile();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Settings</h1>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">Operational Configuration Hub</p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <SettingsClient initialProfile={profile} />
      </Suspense>
    </div>
  );
}
