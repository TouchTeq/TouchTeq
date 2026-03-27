import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import CertificateManagement from './CertificateManagement';

export default async function CertificateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Fetch Certificate
  const { data: certificate } = await supabase
    .from('certificates')
    .select(`
      *,
      clients (*)
    `)
    .eq('id', id)
    .single();

  if (!certificate) notFound();

  // 2. Fetch Business Profile
  const { data: profile } = await supabase
    .from('business_profile')
    .select('*')
    .single();

  return (
    <div className="space-y-8">
      <CertificateManagement 
        certificate={certificate} 
        businessProfile={profile} 
      />
    </div>
  );
}
