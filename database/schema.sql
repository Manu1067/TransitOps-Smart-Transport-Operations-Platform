-- =============================================================================
-- TransitOps – PostgreSQL schema (Supabase-compatible)
-- Run this file in the Supabase SQL editor or via psql against your project DB.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Shared trigger: keep updated_at in sync
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS
  'Sets updated_at to the current timestamp on row update.';

-- -----------------------------------------------------------------------------
-- profiles
-- Extends Supabase auth.users with application-specific identity data.
-- -----------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  role          TEXT NOT NULL DEFAULT 'dispatcher'
                CHECK (role IN ('admin', 'dispatcher', 'driver', 'viewer')),
  phone         TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT profiles_email_unique UNIQUE (email)
);

COMMENT ON TABLE public.profiles IS
  'Application user profile linked 1:1 with Supabase auth.users.';
COMMENT ON COLUMN public.profiles.role IS
  'Application role used for authorization (admin, dispatcher, driver, viewer).';

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- vehicles
-- Fleet assets tracked by registration number and operational status.
-- -----------------------------------------------------------------------------

CREATE TABLE public.vehicles (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number  TEXT NOT NULL,
  make                 TEXT NOT NULL,
  model                TEXT NOT NULL,
  year                 SMALLINT
                         CHECK (year IS NULL OR (year >= 1900 AND year <= 2100)),
  status               TEXT NOT NULL DEFAULT 'Available'
                         CHECK (status IN ('Available', 'On Trip', 'In Shop', 'Retired')),
  current_odometer     NUMERIC(12, 2) NOT NULL DEFAULT 0
                         CHECK (current_odometer >= 0),
  acquisition_cost     NUMERIC(14, 2)
                         CHECK (acquisition_cost IS NULL OR acquisition_cost >= 0),
  vin                  TEXT,
  fuel_capacity_liters NUMERIC(10, 2)
                         CHECK (fuel_capacity_liters IS NULL OR fuel_capacity_liters > 0),
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT vehicles_registration_number_unique UNIQUE (registration_number)
);

COMMENT ON TABLE public.vehicles IS
  'Fleet vehicles with registration, status, and odometer tracking.';
COMMENT ON COLUMN public.vehicles.status IS
  'Operational state: Available, On Trip, In Shop, or Retired.';

CREATE INDEX idx_vehicles_status ON public.vehicles (status);
CREATE INDEX idx_vehicles_make_model ON public.vehicles (make, model);

CREATE TRIGGER vehicles_set_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- drivers
-- Driver roster with license, safety score, and availability status.
-- -----------------------------------------------------------------------------

CREATE TABLE public.drivers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  full_name        TEXT NOT NULL,
  license_number   TEXT NOT NULL,
  phone            TEXT,
  email            TEXT,
  status           TEXT NOT NULL DEFAULT 'Available'
                   CHECK (status IN ('Available', 'On Trip', 'Off Duty', 'Suspended')),
  safety_score     NUMERIC(5, 2)
                   CHECK (safety_score IS NULL OR (safety_score >= 0 AND safety_score <= 100)),
  hire_date        DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT drivers_license_number_unique UNIQUE (license_number)
);

COMMENT ON TABLE public.drivers IS
  'Drivers available for trip assignment; optionally linked to a user profile.';
COMMENT ON COLUMN public.drivers.safety_score IS
  'Driver safety score from 0 to 100 (higher is better).';

CREATE INDEX idx_drivers_status ON public.drivers (status);
CREATE INDEX idx_drivers_profile_id ON public.drivers (profile_id);

CREATE TRIGGER drivers_set_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- trips
-- Transport jobs from source to destination with planned vs actual metrics.
-- -----------------------------------------------------------------------------

CREATE TABLE public.trips (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source            TEXT NOT NULL,
  destination       TEXT NOT NULL,
  vehicle_id        UUID NOT NULL REFERENCES public.vehicles (id) ON DELETE RESTRICT,
  driver_id         UUID NOT NULL REFERENCES public.drivers (id) ON DELETE RESTRICT,
  cargo_weight      NUMERIC(12, 2)
                    CHECK (cargo_weight IS NULL OR cargo_weight >= 0),
  planned_distance  NUMERIC(12, 2)
                    CHECK (planned_distance IS NULL OR planned_distance >= 0),
  actual_distance   NUMERIC(12, 2)
                    CHECK (actual_distance IS NULL OR actual_distance >= 0),
  revenue           NUMERIC(14, 2)
                    CHECK (revenue IS NULL OR revenue >= 0),
  status            TEXT NOT NULL DEFAULT 'Draft'
                    CHECK (status IN ('Draft', 'Dispatched', 'Completed', 'Cancelled')),
  dispatched_at     TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  start_odometer    NUMERIC(12, 2)
                    CHECK (start_odometer IS NULL OR start_odometer >= 0),
  end_odometer      NUMERIC(12, 2)
                    CHECK (end_odometer IS NULL OR end_odometer >= 0),
  fuel_consumed     NUMERIC(10, 2)
                    CHECK (fuel_consumed IS NULL OR fuel_consumed >= 0),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT trips_odometer_range_valid CHECK (
    start_odometer IS NULL
    OR end_odometer IS NULL
    OR end_odometer >= start_odometer
  ),
  CONSTRAINT trips_status_timestamps_valid CHECK (
    (status <> 'Dispatched' OR dispatched_at IS NOT NULL)
    AND (status <> 'Completed' OR completed_at IS NOT NULL)
    AND (status <> 'Cancelled' OR cancelled_at IS NOT NULL)
  )
);

COMMENT ON TABLE public.trips IS
  'Transport trips linking vehicles and drivers with lifecycle timestamps.';
COMMENT ON COLUMN public.trips.fuel_consumed IS
  'Total fuel used for the trip in liters.';
COMMENT ON COLUMN public.trips.status IS
  'Lifecycle: Draft → Dispatched → Completed, or Cancelled from any stage.';

CREATE INDEX idx_trips_vehicle_id ON public.trips (vehicle_id);
CREATE INDEX idx_trips_driver_id ON public.trips (driver_id);
CREATE INDEX idx_trips_status ON public.trips (status);
CREATE INDEX idx_trips_dispatched_at ON public.trips (dispatched_at DESC);
CREATE INDEX idx_trips_created_at ON public.trips (created_at DESC);

CREATE TRIGGER trips_set_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- maintenance_logs
-- Vehicle maintenance records with Active / Closed lifecycle.
-- -----------------------------------------------------------------------------

CREATE TABLE public.maintenance_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id          UUID NOT NULL REFERENCES public.vehicles (id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT,
  status              TEXT NOT NULL DEFAULT 'Active'
                      CHECK (status IN ('Active', 'Closed')),
  odometer_at_service NUMERIC(12, 2)
                      CHECK (odometer_at_service IS NULL OR odometer_at_service >= 0),
  cost                NUMERIC(14, 2)
                      CHECK (cost IS NULL OR cost >= 0),
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT maintenance_logs_closed_at_valid CHECK (
    (status = 'Active' AND closed_at IS NULL)
    OR (status = 'Closed' AND closed_at IS NOT NULL)
  )
);

COMMENT ON TABLE public.maintenance_logs IS
  'Maintenance work orders; Active records are open, Closed records are finished.';
COMMENT ON COLUMN public.maintenance_logs.status IS
  'Active = work in progress; Closed = maintenance completed.';

CREATE INDEX idx_maintenance_logs_vehicle_id ON public.maintenance_logs (vehicle_id);
CREATE INDEX idx_maintenance_logs_status ON public.maintenance_logs (status);
CREATE INDEX idx_maintenance_logs_started_at ON public.maintenance_logs (started_at DESC);

CREATE TRIGGER maintenance_logs_set_updated_at
  BEFORE UPDATE ON public.maintenance_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- fuel_logs
-- Fuel fill-up events tied to vehicles (and optionally to a trip).
-- -----------------------------------------------------------------------------

CREATE TABLE public.fuel_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id       UUID NOT NULL REFERENCES public.vehicles (id) ON DELETE CASCADE,
  trip_id          UUID REFERENCES public.trips (id) ON DELETE SET NULL,
  liters           NUMERIC(10, 2) NOT NULL
                   CHECK (liters >= 0),
  cost             NUMERIC(14, 2)
                   CHECK (cost IS NULL OR cost >= 0),
  odometer_reading NUMERIC(12, 2)
                   CHECK (odometer_reading IS NULL OR odometer_reading >= 0),
  filled_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  station_name     TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.fuel_logs IS
  'Fuel purchases and consumption records per vehicle.';
COMMENT ON COLUMN public.fuel_logs.liters IS
  'Volume of fuel in liters (must be non-negative).';

CREATE INDEX idx_fuel_logs_vehicle_id ON public.fuel_logs (vehicle_id);
CREATE INDEX idx_fuel_logs_trip_id ON public.fuel_logs (trip_id);
CREATE INDEX idx_fuel_logs_filled_at ON public.fuel_logs (filled_at DESC);

CREATE TRIGGER fuel_logs_set_updated_at
  BEFORE UPDATE ON public.fuel_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- expenses
-- Operational costs categorized by type, optionally linked to trips/vehicles.
-- -----------------------------------------------------------------------------

CREATE TABLE public.expenses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id       UUID REFERENCES public.trips (id) ON DELETE SET NULL,
  vehicle_id    UUID REFERENCES public.vehicles (id) ON DELETE SET NULL,
  driver_id     UUID REFERENCES public.drivers (id) ON DELETE SET NULL,
  expense_type  TEXT NOT NULL
                CHECK (expense_type IN ('Toll', 'Maintenance', 'Other')),
  amount        NUMERIC(14, 2) NOT NULL
                CHECK (amount >= 0),
  description   TEXT,
  incurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT expenses_at_least_one_reference CHECK (
    trip_id IS NOT NULL OR vehicle_id IS NOT NULL OR driver_id IS NOT NULL
  )
);

COMMENT ON TABLE public.expenses IS
  'Financial expenses (tolls, maintenance, misc.) tied to trips, vehicles, or drivers.';
COMMENT ON COLUMN public.expenses.expense_type IS
  'Category: Toll, Maintenance, or Other.';

CREATE INDEX idx_expenses_trip_id ON public.expenses (trip_id);
CREATE INDEX idx_expenses_vehicle_id ON public.expenses (vehicle_id);
CREATE INDEX idx_expenses_driver_id ON public.expenses (driver_id);
CREATE INDEX idx_expenses_expense_type ON public.expenses (expense_type);
CREATE INDEX idx_expenses_incurred_at ON public.expenses (incurred_at DESC);

CREATE TRIGGER expenses_set_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Auto-create profile when a Supabase auth user signs up (optional helper)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Creates a profiles row when a new auth.users record is inserted.';

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
