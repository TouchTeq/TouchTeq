-- Travel Logbook Tables v2 - Multiple Vehicles Support
-- Run this SQL in Supabase SQL Editor to upgrade your database

-- Drop existing tables if they exist (for fresh install)
DROP TABLE IF EXISTS travel_trips CASCADE;
DROP TABLE IF EXISTS travel_settings CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;

-- Vehicles table
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_description TEXT NOT NULL DEFAULT 'Toyota Hilux',
  registration_number TEXT NOT NULL,
  opening_odometer INTEGER NOT NULL DEFAULT 0,
  fuel_type TEXT NOT NULL DEFAULT 'Diesel' CHECK (fuel_type IN ('Petrol', 'Diesel', 'Electric', 'Hybrid')),
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default vehicle
INSERT INTO vehicles (vehicle_description, registration_number, opening_odometer, fuel_type, is_default)
VALUES ('Toyota Hilux', 'ABC 123 GP', 0, 'Diesel', true);

-- Travel trips table - now references vehicle
CREATE TABLE travel_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  odometer_start INTEGER NOT NULL,
  odometer_end INTEGER NOT NULL,
  distance_km INTEGER NOT NULL,
  purpose TEXT NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE RESTRICT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  notes TEXT,
  source TEXT DEFAULT 'Manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Travel settings (for fuel price)
CREATE TABLE travel_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fuel_price_per_litre DECIMAL(10,2) NOT NULL DEFAULT 22.50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO travel_settings (fuel_price_per_litre)
SELECT 22.50
WHERE NOT EXISTS (SELECT 1 FROM travel_settings LIMIT 1);

-- Enable RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vehicles
CREATE POLICY "Users can view vehicles" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Users can insert vehicles" ON vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update vehicles" ON vehicles FOR UPDATE USING (true);

-- RLS Policies for travel_trips
CREATE POLICY "Users can view own trips" ON travel_trips FOR SELECT USING (true);
CREATE POLICY "Users can insert trips" ON travel_trips FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update trips" ON travel_trips FOR UPDATE USING (true);
CREATE POLICY "Users can delete trips" ON travel_trips FOR DELETE USING (true);

-- RLS Policies for travel_settings
CREATE POLICY "Users can view settings" ON travel_settings FOR SELECT USING (true);
CREATE POLICY "Users can update settings" ON travel_settings FOR UPDATE USING (true);

-- Add indexes
CREATE INDEX idx_travel_trips_date ON travel_trips(date);
CREATE INDEX idx_travel_trips_vehicle ON travel_trips(vehicle_id);
CREATE INDEX idx_travel_trips_client ON travel_trips(client_id);
CREATE INDEX idx_vehicles_active ON vehicles(is_active);
CREATE INDEX idx_vehicles_default ON vehicles(is_default);

-- Function to ensure only one default vehicle
CREATE OR REPLACE FUNCTION ensure_single_default_vehicle()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE vehicles SET is_default = false WHERE id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_single_default_vehicle
AFTER INSERT OR UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION ensure_single_default_vehicle();
