/*
# Real Estate Property Platform - Core Schema

## Overview
Multi-role real estate platform with four user types: tenants, property dealers,
customer support executives, and system admins. Tenants browse and save properties;
dealers manage their own listings; support has read-only oversight.

## New Tables
1. `profiles` - Extends auth.users with role and contact info.
2. `properties` - Real estate listings owned by dealers.
3. `tenant_inbox` - Properties saved by tenants for later review.
4. `visit_bookings` - Scheduled physical visits by tenants to properties.
5. `deals` - Brokerage deals between tenant and dealer for a property.
6. `payments` - Tracks visit charges and brokerage payments.

## Security (RLS)
- profiles: each user reads/updates own row; support+admin read all.
- properties: dealers CRUD own rows; tenants/support/admin read all.
- tenant_inbox: tenants CRUD own rows; support+admin read all.
- visit_bookings: tenants CRUD own; dealers update own (as payee); support+admin read all.
- deals: tenants read own; dealers read/update own; support+admin read all.
- payments: tenants read own (as payer); dealers read own (as payee); support+admin read all.

## Notes
1. All owner columns default to auth.uid() so client inserts omitting the owner succeed.
2. Policies are split into 4 CRUD verbs per table (no FOR ALL).
3. Auto-creates a profile row on signup via trigger reading raw_user_meta_data.
*/

-- ============================================================
-- profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL DEFAULT '',
  phone text,
  role text NOT NULL DEFAULT 'tenant' CHECK (role IN ('tenant','dealer','support','admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "support_admin_read_all_profiles" ON profiles;
CREATE POLICY "support_admin_read_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('support','admin')
    )
  );

-- ============================================================
-- properties
-- ============================================================
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  rent numeric(10,2) NOT NULL DEFAULT 0,
  deposit numeric(10,2) NOT NULL DEFAULT 0,
  bedrooms integer NOT NULL DEFAULT 1,
  bathrooms integer NOT NULL DEFAULT 1,
  area_sqft integer NOT NULL DEFAULT 0,
  property_type text NOT NULL DEFAULT 'apartment' CHECK (property_type IN ('apartment','house','villa','studio','commercial','plot')),
  video_url text NOT NULL DEFAULT '',
  available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dealer_read_own_properties" ON properties;
CREATE POLICY "dealer_read_own_properties" ON properties FOR SELECT
  TO authenticated USING (
    dealer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('tenant','support','admin')
    )
  );

DROP POLICY IF EXISTS "dealer_insert_own_properties" ON properties;
CREATE POLICY "dealer_insert_own_properties" ON properties FOR INSERT
  TO authenticated WITH CHECK (
    dealer_id = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'dealer')
  );

DROP POLICY IF EXISTS "dealer_update_own_properties" ON properties;
CREATE POLICY "dealer_update_own_properties" ON properties FOR UPDATE
  TO authenticated USING (dealer_id = auth.uid())
  WITH CHECK (dealer_id = auth.uid());

DROP POLICY IF EXISTS "dealer_delete_own_properties" ON properties;
CREATE POLICY "dealer_delete_own_properties" ON properties FOR DELETE
  TO authenticated USING (dealer_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_properties_dealer ON properties(dealer_id);
CREATE INDEX IF NOT EXISTS idx_properties_available ON properties(available);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);

-- ============================================================
-- tenant_inbox
-- ============================================================
CREATE TABLE IF NOT EXISTS tenant_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  saved_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, property_id)
);

ALTER TABLE tenant_inbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_select_own_inbox" ON tenant_inbox;
CREATE POLICY "tenant_select_own_inbox" ON tenant_inbox FOR SELECT
  TO authenticated USING (
    tenant_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('support','admin'))
  );

DROP POLICY IF EXISTS "tenant_insert_own_inbox" ON tenant_inbox;
CREATE POLICY "tenant_insert_own_inbox" ON tenant_inbox FOR INSERT
  TO authenticated WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS "tenant_delete_own_inbox" ON tenant_inbox;
CREATE POLICY "tenant_delete_own_inbox" ON tenant_inbox FOR DELETE
  TO authenticated USING (tenant_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_inbox_tenant ON tenant_inbox(tenant_id);

-- ============================================================
-- visit_bookings
-- ============================================================
CREATE TABLE IF NOT EXISTS visit_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  dealer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','confirmed','completed','cancelled')),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE visit_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_visit_bookings" ON visit_bookings;
CREATE POLICY "select_own_visit_bookings" ON visit_bookings FOR SELECT
  TO authenticated USING (
    tenant_id = auth.uid()
    OR dealer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('support','admin'))
  );

DROP POLICY IF EXISTS "tenant_insert_own_visit_bookings" ON visit_bookings;
CREATE POLICY "tenant_insert_own_visit_bookings" ON visit_bookings FOR INSERT
  TO authenticated WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS "update_own_visit_bookings" ON visit_bookings;
CREATE POLICY "update_own_visit_bookings" ON visit_bookings FOR UPDATE
  TO authenticated USING (tenant_id = auth.uid() OR dealer_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid() OR dealer_id = auth.uid());

DROP POLICY IF EXISTS "tenant_delete_own_visit_bookings" ON visit_bookings;
CREATE POLICY "tenant_delete_own_visit_bookings" ON visit_bookings FOR DELETE
  TO authenticated USING (tenant_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_visits_tenant ON visit_bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_visits_dealer ON visit_bookings(dealer_id);

-- ============================================================
-- deals
-- ============================================================
CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  dealer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  brokerage_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','finalized','cancelled')),
  finalized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_deals" ON deals;
CREATE POLICY "select_own_deals" ON deals FOR SELECT
  TO authenticated USING (
    tenant_id = auth.uid()
    OR dealer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('support','admin'))
  );

DROP POLICY IF EXISTS "tenant_insert_own_deals" ON deals;
CREATE POLICY "tenant_insert_own_deals" ON deals FOR INSERT
  TO authenticated WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS "dealer_update_own_deals" ON deals;
CREATE POLICY "dealer_update_own_deals" ON deals FOR UPDATE
  TO authenticated USING (dealer_id = auth.uid())
  WITH CHECK (dealer_id = auth.uid());

DROP POLICY IF EXISTS "tenant_delete_own_deals" ON deals;
CREATE POLICY "tenant_delete_own_deals" ON deals FOR DELETE
  TO authenticated USING (tenant_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_deals_tenant ON deals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deals_dealer ON deals(dealer_id);

-- ============================================================
-- payments
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  payee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES visit_bookings(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
  payment_type text NOT NULL CHECK (payment_type IN ('visit','brokerage')),
  amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_payments" ON payments;
CREATE POLICY "select_own_payments" ON payments FOR SELECT
  TO authenticated USING (
    payer_id = auth.uid()
    OR payee_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('support','admin'))
  );

DROP POLICY IF EXISTS "tenant_insert_own_payments" ON payments;
CREATE POLICY "tenant_insert_own_payments" ON payments FOR INSERT
  TO authenticated WITH CHECK (payer_id = auth.uid());

DROP POLICY IF EXISTS "update_own_payments" ON payments;
CREATE POLICY "update_own_payments" ON payments FOR UPDATE
  TO authenticated USING (payer_id = auth.uid())
  WITH CHECK (payer_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_payments_payer ON payments(payer_id);
CREATE INDEX IF NOT EXISTS idx_payments_payee ON payments(payee_id);

-- ============================================================
-- Trigger: auto-create profile on auth signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'tenant')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
