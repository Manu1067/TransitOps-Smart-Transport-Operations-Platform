-- =============================================================================
-- TransitOps – Sample seed data (Supabase-compatible)
-- Run AFTER database/schema.sql in the Supabase SQL editor or via psql.
--
-- Demo login password for all seeded users: TransitOps@2026
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Optional column for license expiry (used by demo drivers; safe to re-run)
-- -----------------------------------------------------------------------------

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS license_expiry_date DATE;

COMMENT ON COLUMN public.drivers.license_expiry_date IS
  'Commercial driving license expiry date (demo field added by seed.sql).';

-- -----------------------------------------------------------------------------
-- Re-run safety: remove previously seeded rows (fixed UUIDs below)
-- -----------------------------------------------------------------------------

DELETE FROM public.expenses
WHERE id IN (
  'e1111111-1111-1111-1111-111111111111',
  'e2222222-2222-2222-2222-222222222222',
  'e3333333-3333-3333-3333-333333333333',
  'e4444444-4444-4444-4444-444444444444',
  'e5555555-5555-5555-5555-555555555555'
);

DELETE FROM public.fuel_logs
WHERE id IN (
  'fl111111-1111-1111-1111-111111111111',
  'fl222222-2222-2222-2222-222222222222',
  'fl333333-3333-3333-3333-333333333333',
  'fl444444-4444-4444-4444-444444444444',
  'fl555555-5555-5555-5555-555555555555'
);

DELETE FROM public.maintenance_logs
WHERE id IN (
  'm1111111-1111-1111-1111-111111111111',
  'm2222222-2222-2222-2222-222222222222'
);

DELETE FROM public.trips
WHERE id IN (
  't1111111-1111-1111-1111-111111111111',
  't2222222-2222-2222-2222-222222222222',
  't3333333-3333-3333-3333-333333333333',
  't4444444-4444-4444-4444-444444444444'
);

DELETE FROM public.drivers
WHERE id IN (
  'f1111111-1111-1111-1111-111111111111',
  'f2222222-2222-2222-2222-222222222222',
  'f3333333-3333-3333-3333-333333333333',
  'f4444444-4444-4444-4444-444444444444',
  'f5555555-5555-5555-5555-555555555555'
);

DELETE FROM public.vehicles
WHERE id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
);

DELETE FROM auth.identities
WHERE user_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444'
);

DELETE FROM auth.users
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444'
);

-- -----------------------------------------------------------------------------
-- profiles (via Supabase auth.users + auto profile trigger)
-- Four demo users: admin, dispatcher, and two driver-linked accounts.
-- Password for all: TransitOps@2026
-- -----------------------------------------------------------------------------

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin
) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@transitops.in',
    crypt('TransitOps@2026', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Ananya Sharma"}',
    FALSE
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'dispatch@transitops.in',
    crypt('TransitOps@2026', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Rohit Mehta"}',
    FALSE
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'rajesh.kumar@transitops.in',
    crypt('TransitOps@2026', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Rajesh Kumar"}',
    FALSE
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'suresh.patel@transitops.in',
    crypt('TransitOps@2026', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Suresh Patel"}',
    FALSE
  );

-- Required for email/password sign-in on newer Supabase projects
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    jsonb_build_object(
      'sub', '11111111-1111-1111-1111-111111111111',
      'email', 'admin@transitops.in'
    ),
    'email',
    '11111111-1111-1111-1111-111111111111',
    NOW(), NOW(), NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    jsonb_build_object(
      'sub', '22222222-2222-2222-2222-222222222222',
      'email', 'dispatch@transitops.in'
    ),
    'email',
    '22222222-2222-2222-2222-222222222222',
    NOW(), NOW(), NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    jsonb_build_object(
      'sub', '33333333-3333-3333-3333-333333333333',
      'email', 'rajesh.kumar@transitops.in'
    ),
    'email',
    '33333333-3333-3333-3333-333333333333',
    NOW(), NOW(), NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '44444444-4444-4444-4444-444444444444',
    jsonb_build_object(
      'sub', '44444444-4444-4444-4444-444444444444',
      'email', 'suresh.patel@transitops.in'
    ),
    'email',
    '44444444-4444-4444-4444-444444444444',
    NOW(), NOW(), NOW()
  );

-- Enrich auto-created profiles with roles and Indian contact numbers
UPDATE public.profiles SET
  role = 'admin',
  full_name = 'Ananya Sharma',
  phone = '+91-98765-43210'
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE public.profiles SET
  role = 'dispatcher',
  full_name = 'Rohit Mehta',
  phone = '+91-98220-11445'
WHERE id = '22222222-2222-2222-2222-222222222222';

UPDATE public.profiles SET
  role = 'driver',
  full_name = 'Rajesh Kumar',
  phone = '+91-98190-22331'
WHERE id = '33333333-3333-3333-3333-333333333333';

UPDATE public.profiles SET
  role = 'driver',
  full_name = 'Suresh Patel',
  phone = '+91-97250-88901'
WHERE id = '44444444-4444-4444-4444-444444444444';

-- -----------------------------------------------------------------------------
-- vehicles (5 trucks – all four statuses represented)
-- Indian registration formats; mix of Tata, Ashok Leyland, Mahindra, etc.
-- -----------------------------------------------------------------------------

INSERT INTO public.vehicles (
  id,
  registration_number,
  make,
  model,
  year,
  status,
  current_odometer,
  acquisition_cost,
  vin,
  fuel_capacity_liters,
  notes
) VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'MH-12-AB-1234',
    'Tata',
    'LPT 1613',
    2021,
    'Available',
    84250.00,
    1850000.00,
    'MAT12345678901234',
    200.00,
    'Based at Nhava Sheva (JNPT) hub; preferred for Pune–Mumbai milk-run.'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'GJ-01-CD-5678',
    'Ashok Leyland',
    '3718 IL',
    2020,
    'On Trip',
    126400.00,
    2100000.00,
    'MBL98765432109876',
    250.00,
    'Currently hauling auto components Chennai → Bengaluru on NH-48.'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'DL-01-EF-9012',
    'Mahindra',
    'Blazo X 28',
    2019,
    'In Shop',
    198750.00,
    2450000.00,
    'MAH45678901234567',
    300.00,
    'Engine overhaul at Okhla workshop; expected back in 5 days.'
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'KA-05-GH-3456',
    'Eicher',
    'Pro 6031',
    2016,
    'Retired',
    412000.00,
    1650000.00,
    'EIC11223344556677',
    220.00,
    'Retired after 4.1 lakh km; sold for scrap in Peenya Industrial Area.'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'TN-07-IJ-7890',
    'BharatBenz',
    '3528',
    2022,
    'Available',
    56300.00,
    2750000.00,
    'BBZ99887766554433',
    280.00,
    'Refrigerated container unit for Chennai–Coimbatore perishables.'
  );

-- -----------------------------------------------------------------------------
-- drivers (5 – all four statuses; one Suspended, one upcoming license expiry)
-- -----------------------------------------------------------------------------

INSERT INTO public.drivers (
  id,
  profile_id,
  full_name,
  license_number,
  phone,
  email,
  status,
  safety_score,
  hire_date,
  license_expiry_date
) VALUES
  (
    'f1111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    'Rajesh Kumar',
    'MH-2020-0045123',
    '+91-98190-22331',
    'rajesh.kumar@transitops.in',
    'Available',
    92.50,
    '2020-03-15',
    '2028-06-30'
  ),
  (
    'f2222222-2222-2222-2222-222222222222',
    '44444444-4444-4444-4444-444444444444',
    'Suresh Patel',
    'GJ-2019-0089012',
    '+91-97250-88901',
    'suresh.patel@transitops.in',
    'On Trip',
    88.00,
    '2019-07-01',
    '2027-11-20'
  ),
  (
    'f3333333-3333-3333-3333-333333333333',
    NULL,
    'Amit Singh',
    'DL-2018-0033789',
    '+91-98101-44567',
    'amit.singh@transitops.in',
    'Off Duty',
    85.75,
    '2018-01-10',
    '2026-12-15'
  ),
  (
    'f4444444-4444-4444-4444-444444444444',
    NULL,
    'Vijay Reddy',
    'KA-2017-0022456',
    '+91-98450-11223',
    'vijay.reddy@transitops.in',
    'Suspended',
    62.00,
    '2017-05-22',
    '2027-03-10'
  ),
  (
    'f5555555-5555-5555-5555-555555555555',
    NULL,
    'Mohan Das',
    'TN-2021-0067890',
    '+91-94440-55667',
    'mohan.das@transitops.in',
    'Available',
    90.25,
    '2021-09-05',
    '2026-08-20'  -- upcoming license expiry (within ~5 weeks of seed date)
  );

-- -----------------------------------------------------------------------------
-- trips (4 – one per status: Draft, Dispatched, Completed, Cancelled)
-- Realistic Indian freight lanes and metrics in INR / km / tonnes.
-- -----------------------------------------------------------------------------

INSERT INTO public.trips (
  id,
  source,
  destination,
  vehicle_id,
  driver_id,
  cargo_weight,
  planned_distance,
  actual_distance,
  revenue,
  status,
  dispatched_at,
  completed_at,
  cancelled_at,
  start_odometer,
  end_odometer,
  fuel_consumed,
  notes
) VALUES
  (
    't1111111-1111-1111-1111-111111111111',
    'JNPT Port, Nhava Sheva, Maharashtra',
    'Chakan MIDC, Pune, Maharashtra',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'f1111111-1111-1111-1111-111111111111',
    12.50,
    145.00,
    NULL,
    28500.00,
    'Draft',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'Electronics consignment for Tata AutoComp; awaiting loading slot.'
  ),
  (
    't2222222-2222-2222-2222-222222222222',
    'Ennore Port, Chennai, Tamil Nadu',
    'Peenya Industrial Area, Bengaluru, Karnataka',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'f2222222-2222-2222-2222-222222222222',
    18.00,
    345.00,
    NULL,
    52000.00,
    'Dispatched',
    TIMESTAMPTZ '2026-07-11 06:30:00+05:30',
    NULL,
    NULL,
    126400.00,
    NULL,
    NULL,
    'Live trip on NH-48; ETA Bengaluru 18:00 IST.'
  ),
  (
    't3333333-3333-3333-3333-333333333333',
    'Tughlakabad ICD, Delhi',
    'Sitapura Industrial Area, Jaipur, Rajasthan',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'f3333333-3333-3333-3333-333333333333',
    10.00,
    280.00,
    292.00,
    41000.00,
    'Completed',
    TIMESTAMPTZ '2026-07-08 04:00:00+05:30',
    TIMESTAMPTZ '2026-07-08 14:45:00+05:30',
    NULL,
    55100.00,
    55392.00,
    85.50,
    'Textile export cartons delivered; minor NH-48 detour near Shahpura.'
  ),
  (
    't4444444-4444-4444-4444-444444444444',
    'Uppal Logistics Park, Hyderabad, Telangana',
    'Auto Nagar, Vijayawada, Andhra Pradesh',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'f5555555-5555-5555-5555-555555555555',
    8.00,
    275.00,
    NULL,
    32000.00,
    'Cancelled',
    NULL,
    NULL,
    TIMESTAMPTZ '2026-07-10 09:15:00+05:30',
    NULL,
    NULL,
    NULL,
    'Cancelled – consignor withdrew order due to warehouse strike at destination.'
  );

-- -----------------------------------------------------------------------------
-- maintenance_logs (2 – one Active on In Shop truck, one Closed)
-- -----------------------------------------------------------------------------

INSERT INTO public.maintenance_logs (
  id,
  vehicle_id,
  title,
  description,
  status,
  odometer_at_service,
  cost,
  started_at,
  closed_at
) VALUES
  (
    'm1111111-1111-1111-1111-111111111111',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Engine overhaul & turbo replacement',
    'Complete engine rebuild at Ashok Leyland authorised service centre, Okhla Phase-II, New Delhi.',
    'Active',
    198750.00,
    NULL,
    TIMESTAMPTZ '2026-07-09 08:00:00+05:30',
    NULL
  ),
  (
    'm2222222-2222-2222-2222-222222222222',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Scheduled brake & tyre service',
    'Replaced front brake pads and all six tyres before Chennai–Bengaluru run.',
    'Closed',
    125800.00,
    48500.00,
    TIMESTAMPTZ '2026-07-05 10:00:00+05:30',
    TIMESTAMPTZ '2026-07-06 17:30:00+05:30'
  );

-- -----------------------------------------------------------------------------
-- fuel_logs (5 fill-ups across fleet; one linked to completed trip)
-- Typical Indian highway fuel stops (IOCL / BPCL / HPCL).
-- -----------------------------------------------------------------------------

INSERT INTO public.fuel_logs (
  id,
  vehicle_id,
  trip_id,
  liters,
  cost,
  odometer_reading,
  filled_at,
  station_name,
  notes
) VALUES
  (
    'fl111111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    't2222222-2222-2222-2222-222222222222',
    180.00,
    16200.00,
    126100.00,
    TIMESTAMPTZ '2026-07-11 05:45:00+05:30',
    'IOCL – Sriperumbudur, TN',
    'Full tank before Chennai departure.'
  ),
  (
    'fl222222-2222-2222-2222-222222222222',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    't3333333-3333-3333-3333-333333333333',
    120.00,
    10800.00,
    55100.00,
    TIMESTAMPTZ '2026-07-08 03:30:00+05:30',
    'BPCL – Gurgaon Manesar, HR',
    'Pre-trip fill for Delhi–Jaipur leg.'
  ),
  (
    'fl333333-3333-3333-3333-333333333333',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    NULL,
    95.00,
    8550.00,
    84100.00,
    TIMESTAMPTZ '2026-07-07 19:00:00+05:30',
    'HPCL – Panvel, MH',
    'Routine top-up at JNPT hub.'
  ),
  (
    'fl444444-4444-4444-4444-444444444444',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    NULL,
    60.00,
    5400.00,
    198750.00,
    TIMESTAMPTZ '2026-07-09 07:30:00+05:30',
    'IOCL – Okhla, Delhi',
    'Moved truck to workshop bay; minimal fuel for yard shunt.'
  ),
  (
    'fl555555-5555-5555-5555-555555555555',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    NULL,
    110.00,
    9900.00,
    56300.00,
    TIMESTAMPTZ '2026-07-12 08:00:00+05:30',
    'BPCL – Ambattur, Chennai',
    'Post-trip refill after Jaipur delivery return leg.'
  );

-- -----------------------------------------------------------------------------
-- expenses (5 – mix of Toll, Maintenance, Other)
-- Amounts in INR; tied to trips, vehicles, or drivers.
-- -----------------------------------------------------------------------------

INSERT INTO public.expenses (
  id,
  trip_id,
  vehicle_id,
  driver_id,
  expense_type,
  amount,
  description,
  incurred_at
) VALUES
  (
    'e1111111-1111-1111-1111-111111111111',
    't3333333-3333-3333-3333-333333333333',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'f3333333-3333-3333-3333-333333333333',
    'Toll',
    1850.00,
    'FASTag tolls – Delhi–Jaipur Expressway (NH-48) both ways',
    TIMESTAMPTZ '2026-07-08 12:00:00+05:30'
  ),
  (
    'e2222222-2222-2222-2222-222222222222',
    't2222222-2222-2222-2222-222222222222',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'f2222222-2222-2222-2222-222222222222',
    'Toll',
    2400.00,
    'FASTag – Chennai Outer Ring Road + Krishnagiri plaza',
    TIMESTAMPTZ '2026-07-11 11:30:00+05:30'
  ),
  (
    'e3333333-3333-3333-3333-333333333333',
    NULL,
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    NULL,
    'Maintenance',
    125000.00,
    'Engine overhaul deposit – Ashok Leyland Okhla service centre',
    TIMESTAMPTZ '2026-07-09 08:30:00+05:30'
  ),
  (
    'e4444444-4444-4444-4444-444444444444',
    NULL,
    NULL,
    'f4444444-4444-4444-4444-444444444444',
    'Other',
    5000.00,
    'Traffic violation fine – overspeeding on NH-44 (Bengaluru); driver suspended pending review',
    TIMESTAMPTZ '2026-06-28 16:00:00+05:30'
  ),
  (
    'e5555555-5555-5555-5555-555555555555',
    't1111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'f1111111-1111-1111-1111-111111111111',
    'Other',
    750.00,
    'Port entry pass & weighbridge fee – JNPT Nhava Sheva',
    TIMESTAMPTZ '2026-07-12 07:00:00+05:30'
  );

COMMIT;