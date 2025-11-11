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

