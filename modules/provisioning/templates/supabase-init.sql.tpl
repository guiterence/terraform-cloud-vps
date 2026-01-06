DO
$$
DECLARE
  pass text := '${password}';
BEGIN
  -- Create helper to upsert login role with password
  PERFORM 1 FROM pg_roles WHERE rolname = 'supabase_admin';
  IF NOT FOUND THEN
    EXECUTE 'CREATE ROLE supabase_admin LOGIN PASSWORD ' || quote_literal(pass);
  ELSE
    EXECUTE 'ALTER ROLE supabase_admin WITH PASSWORD ' || quote_literal(pass);
  END IF;

  PERFORM 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin';
  IF NOT FOUND THEN
    EXECUTE 'CREATE ROLE supabase_auth_admin LOGIN PASSWORD ' || quote_literal(pass);
  ELSE
    EXECUTE 'ALTER ROLE supabase_auth_admin WITH PASSWORD ' || quote_literal(pass);
  END IF;

  PERFORM 1 FROM pg_roles WHERE rolname = 'supabase_storage_admin';
  IF NOT FOUND THEN
    EXECUTE 'CREATE ROLE supabase_storage_admin LOGIN PASSWORD ' || quote_literal(pass);
  ELSE
    EXECUTE 'ALTER ROLE supabase_storage_admin WITH PASSWORD ' || quote_literal(pass);
  END IF;

  PERFORM 1 FROM pg_roles WHERE rolname = 'authenticator';
  IF NOT FOUND THEN
    EXECUTE 'CREATE ROLE authenticator LOGIN NOINHERIT PASSWORD ' || quote_literal(pass);
  ELSE
    EXECUTE 'ALTER ROLE authenticator WITH PASSWORD ' || quote_literal(pass);
  END IF;

  PERFORM 1 FROM pg_roles WHERE rolname = 'anon';
  IF NOT FOUND THEN
    EXECUTE 'CREATE ROLE anon NOLOGIN';
  END IF;

  PERFORM 1 FROM pg_roles WHERE rolname = 'authenticated';
  IF NOT FOUND THEN
    EXECUTE 'CREATE ROLE authenticated NOLOGIN';
  END IF;

  PERFORM 1 FROM pg_roles WHERE rolname = 'service_role';
  IF NOT FOUND THEN
    EXECUTE 'CREATE ROLE service_role NOLOGIN';
  END IF;

  EXECUTE 'GRANT anon TO authenticator';
  EXECUTE 'GRANT authenticated TO authenticator';
  EXECUTE 'GRANT service_role TO authenticator';

  EXECUTE 'GRANT ALL PRIVILEGES ON DATABASE postgres TO supabase_admin';
END
$$;

-- Create extensions in the extensions schema (Supabase best practice)
CREATE SCHEMA IF NOT EXISTS extensions;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
-- pgjwt extension may not be available, skip if not found
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA extensions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Extension pgjwt not available, skipping';
END $$;
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA extensions;

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE SCHEMA IF NOT EXISTS realtime;
CREATE SCHEMA IF NOT EXISTS _realtime;

-- Grant permissions on schemas (using current user instead of postgres)
DO $$
DECLARE
  current_user_name text;
BEGIN
  SELECT current_user INTO current_user_name;
  -- Grant usage and create on schemas
  EXECUTE format('GRANT USAGE, CREATE ON SCHEMA auth TO %I, anon, authenticated, service_role, supabase_admin, supabase_auth_admin', current_user_name);
  EXECUTE format('GRANT USAGE, CREATE ON SCHEMA storage TO %I, anon, authenticated, service_role, supabase_admin, supabase_storage_admin', current_user_name);
  EXECUTE format('GRANT USAGE, CREATE ON SCHEMA extensions TO %I, anon, authenticated, service_role, supabase_admin', current_user_name);
  EXECUTE format('GRANT USAGE, CREATE ON SCHEMA realtime TO %I, anon, authenticated, service_role', current_user_name);
  EXECUTE format('GRANT USAGE, CREATE ON SCHEMA _realtime TO %I, anon, authenticated, service_role', current_user_name);
  -- Grant all privileges on schemas to admin roles
  EXECUTE format('GRANT ALL ON SCHEMA auth TO supabase_auth_admin, supabase_admin, %I', current_user_name);
  EXECUTE format('GRANT ALL ON SCHEMA storage TO supabase_storage_admin, supabase_admin, %I', current_user_name);
  EXECUTE format('GRANT ALL ON SCHEMA extensions TO supabase_admin, %I', current_user_name);
END $$;

-- Create auth.users table (basic structure)
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid,
  email text,
  encrypted_password text,
  email_confirmed_at timestamptz,
  invited_at timestamptz,
  confirmation_token text,
  confirmation_sent_at timestamptz,
  recovery_token text,
  recovery_sent_at timestamptz,
  email_change_token_new text,
  email_change text,
  email_change_sent_at timestamptz,
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  is_super_admin boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  phone text,
  phone_confirmed_at timestamptz,
  phone_change text,
  phone_change_token text,
  phone_change_sent_at timestamptz,
  confirmed_at timestamptz GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
  email_change_token_current text,
  email_change_confirm_status smallint,
  banned_until timestamptz,
  reauthentication_token text,
  reauthentication_sent_at timestamptz,
  is_sso_user boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  is_anonymous boolean NOT NULL DEFAULT false
);

-- Create auth.sessions table
CREATE TABLE IF NOT EXISTS auth.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  factor_id uuid,
  aal text,
  not_after timestamptz
);

-- Create auth.identities table
CREATE TABLE IF NOT EXISTS auth.identities (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  identity_data jsonb NOT NULL,
  provider text NOT NULL,
  last_sign_in_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT identities_provider_unique UNIQUE (provider, id)
);

-- Create auth.refresh_tokens table
CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
  id bigserial PRIMARY KEY,
  token text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  revoked boolean,
  parent text,
  session_id uuid REFERENCES auth.sessions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Create storage.buckets table
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  public boolean DEFAULT false,
  avif_autodetection boolean DEFAULT false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

-- Create storage.objects table
CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text REFERENCES storage.buckets(id),
  name text NOT NULL,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  metadata jsonb,
  path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
  version text,
  owner_id text
);

-- Create indexes
CREATE INDEX IF NOT EXISTS users_email_idx ON auth.users(email);
CREATE INDEX IF NOT EXISTS users_instance_id_idx ON auth.users(instance_id);
CREATE INDEX IF NOT EXISTS identities_user_id_idx ON auth.identities(user_id);
CREATE INDEX IF NOT EXISTS identities_provider_idx ON auth.identities(provider);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON auth.sessions(user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON auth.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_session_id_idx ON auth.refresh_tokens(session_id);
CREATE INDEX IF NOT EXISTS objects_bucket_id_idx ON storage.objects(bucket_id);
CREATE INDEX IF NOT EXISTS objects_name_idx ON storage.objects(name);

-- Grant permissions on tables
DO $$
DECLARE
  current_user_name text;
BEGIN
  SELECT current_user INTO current_user_name;
  -- Auth tables permissions
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin, supabase_admin, %I', current_user_name);
  EXECUTE format('GRANT SELECT ON ALL TABLES IN SCHEMA auth TO anon, authenticated, service_role');
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON auth.users TO supabase_auth_admin, supabase_admin, %I', current_user_name);
  EXECUTE format('GRANT SELECT ON auth.users TO anon, authenticated, service_role');
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON auth.identities TO supabase_auth_admin, supabase_admin, %I', current_user_name);
  EXECUTE format('GRANT SELECT ON auth.identities TO anon, authenticated, service_role');
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON auth.sessions TO supabase_auth_admin, supabase_admin, %I', current_user_name);
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON auth.refresh_tokens TO supabase_auth_admin, supabase_admin, %I', current_user_name);
  
  -- Storage tables permissions
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA storage TO supabase_storage_admin, supabase_admin, %I', current_user_name);
  EXECUTE format('GRANT SELECT ON ALL TABLES IN SCHEMA storage TO anon, authenticated, service_role');
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON storage.buckets TO supabase_storage_admin, supabase_admin, %I', current_user_name);
  EXECUTE format('GRANT SELECT ON storage.buckets TO anon, authenticated, service_role');
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO supabase_storage_admin, supabase_admin, %I', current_user_name);
  EXECUTE format('GRANT SELECT ON storage.objects TO anon, authenticated, service_role');
  
  -- Grant usage on sequences
  EXECUTE format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin, supabase_admin, %I', current_user_name);
  EXECUTE format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA storage TO supabase_storage_admin, supabase_admin, %I', current_user_name);
END $$;

-- Add missing column to auth.users if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' 
    AND table_name = 'users' 
    AND column_name = 'is_anonymous'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN is_anonymous boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Grant permissions to access system catalogs (needed by supabase-meta and supabase-studio)
DO $$
DECLARE
  current_user_name text;
BEGIN
  SELECT current_user INTO current_user_name;
  -- Grant read access to system catalogs for performance monitoring
  EXECUTE format('GRANT SELECT ON pg_authid TO %I, supabase_admin, supabase_auth_admin, service_role, anon, authenticated', current_user_name);
  EXECUTE format('GRANT SELECT ON pg_roles TO %I, supabase_admin, supabase_auth_admin, service_role, anon, authenticated', current_user_name);
  EXECUTE format('GRANT SELECT ON pg_namespace TO %I, supabase_admin, supabase_auth_admin, service_role', current_user_name);
  EXECUTE format('GRANT SELECT ON pg_database TO %I, supabase_admin, supabase_auth_admin, service_role', current_user_name);
  -- Grant access to pg_stat_statements for query performance monitoring
  EXECUTE format('GRANT SELECT ON pg_stat_statements TO %I, supabase_admin, supabase_auth_admin, service_role', current_user_name);
  -- Grant usage on pg_catalog schema (needed for system catalog access)
  EXECUTE format('GRANT USAGE ON SCHEMA pg_catalog TO %I, supabase_admin, supabase_auth_admin, service_role', current_user_name);
END $$;

-- Allow roles to configure pg_stat_statements settings (must be done outside DO block)
-- Note: These settings apply to the roles, but the user connecting (guilhermeterence) also needs permission
ALTER ROLE supabase_admin SET pg_stat_statements.track = 'all';
ALTER ROLE supabase_auth_admin SET pg_stat_statements.track = 'all';
ALTER ROLE service_role SET pg_stat_statements.track = 'all';
-- Grant permission to the main database user used by supabase-meta
DO $$
DECLARE
  current_user_name text;
BEGIN
  SELECT current_user INTO current_user_name;
  EXECUTE format('ALTER ROLE %I SET pg_stat_statements.track = ''all''', current_user_name);
END $$;

-- Grant permissions on public schema for Supabase roles
DO $$
DECLARE
  current_user_name text;
BEGIN
  SELECT current_user INTO current_user_name;
  -- Grant usage and create on public schema
  EXECUTE format('GRANT USAGE, CREATE ON SCHEMA public TO %I, anon, authenticated, service_role, supabase_admin', current_user_name);
  
  -- Grant all privileges on existing tables in public schema
  EXECUTE format('GRANT ALL ON ALL TABLES IN SCHEMA public TO %I, anon, authenticated, service_role, supabase_admin', current_user_name);
  
  -- Grant all privileges on existing sequences in public schema
  EXECUTE format('GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO %I, anon, authenticated, service_role, supabase_admin', current_user_name);
  
  -- Grant all privileges on existing functions in public schema
  EXECUTE format('GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO %I, anon, authenticated, service_role, supabase_admin', current_user_name);
  
  -- Set default privileges for future tables created by current user
  EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role, supabase_admin', current_user_name);
  EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role, supabase_admin', current_user_name);
  EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role, supabase_admin', current_user_name);
END $$;

-- Grant service_role full access (bypass RLS) - this is the admin role
ALTER ROLE service_role BYPASSRLS;

