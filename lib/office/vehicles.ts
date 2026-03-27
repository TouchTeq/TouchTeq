'use server';

import { createClient } from '@/lib/supabase/server';

export interface Vehicle {
  id: string;
  vehicle_description: string;
  registration_number: string;
  opening_odometer: number;
  fuel_type: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
  is_default: boolean;
  is_active: boolean;
}

export async function getVehicles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('vehicle_description');

  if (error) throw error;
  return data as Vehicle[];
}
