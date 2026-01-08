version: '3.8'

services:
  supabase-studio:
    image: supabase/studio:latest
    container_name: supabase-studio
    restart: unless-stopped
    environment:
      - SUPABASE_URL=https://supabase.${domain}
      - DEFAULT_ORGANIZATION_NAME=Default Organization
      - DEFAULT_PROJECT_NAME=Default Project
      - SUPABASE_SERVICE_KEY=${service_key}
      - STUDIO_PG_META_URL=http://supabase-meta:8080
      - SUPABASE_PUBLIC_URL=https://supabase.${domain}
      - SUPABASE_ANON_KEY=${service_key}
      - SUPABASE_SERVICE_ROLE_KEY=${service_key}
      - API_URL=https://supabase.${domain}/rest
      - PGRST_URL=http://postgrest:3000
      - POSTGRES_PASSWORD=${password}
      - POSTGRES_HOST=postgres
      - POSTGRES_PORT=5432
      - POSTGRES_DB=postgres
      - POSTGRES_USER=guilhermeterence
      - DATABASE_URL=postgresql://guilhermeterence:${password}@postgres:5432/postgres
      - STORAGE_BACKEND=s3
      - STORAGE_S3_ENDPOINT=http://minio:9000
      - STORAGE_S3_REGION=us-east-1
      - STORAGE_S3_BUCKET=${minio_bucket}
      - STORAGE_S3_ACCESS_KEY=${minio_access_key}
      - STORAGE_S3_SECRET_KEY=${minio_secret_key}
      - STORAGE_S3_FORCE_PATH_STYLE=true
      - HOSTNAME=0.0.0.0
    ports:
      - "3000:3000"
    healthcheck:
      disable: true
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.supabase.rule=Host(`supabase.${domain}`)"
      - "traefik.http.routers.supabase.entrypoints=websecure"
      - "traefik.http.routers.supabase.tls.certresolver=letsencrypt"
      - "traefik.http.routers.supabase.service=supabase"
      - "traefik.http.services.supabase.loadbalancer.server.port=3000"
      - "traefik.docker.network=supabase_supabase-network"
    networks:
      - traefik-network
      - supabase-network
      - postgres-network
    depends_on:
      - supabase-meta
      - postgrest

  supabase-meta:
    image: supabase/postgres-meta:v0.93.1
    container_name: supabase-meta
    restart: unless-stopped
    environment:
      - PG_META_DB_HOST=postgres
      - PG_META_DB_PORT=5432
      - PG_META_DB_NAME=postgres
      - PG_META_DB_USER=guilhermeterence
      - PG_META_DB_PASSWORD=${password}
      - PG_META_PORT=8080
    networks:
      - supabase-network
      - postgres-network

  postgrest:
    image: postgrest/postgrest:v12.2.3
    container_name: postgrest
    restart: unless-stopped
    environment:
      - PGRST_DB_URI=postgresql://authenticator:${password}@postgres:5432/postgres
      - PGRST_DB_SCHEMAS=public,storage,auth
      - PGRST_DB_ANON_ROLE=anon
      - PGRST_DB_EXTRA_SEARCH_PATH=public,extensions
      - PGRST_JWT_SECRET=${service_key}
      - PGRST_DB_USE_LEGACY_GUCS=false
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.postgrest.rule=Host(`supabase.${domain}`) && PathPrefix(`/rest`)"
      - "traefik.http.routers.postgrest.entrypoints=websecure"
      - "traefik.http.routers.postgrest.tls.certresolver=letsencrypt"
      - "traefik.http.routers.postgrest.service=postgrest"
      - "traefik.http.services.postgrest.loadbalancer.server.port=3000"
      - "traefik.http.middlewares.postgrest-stripprefix.stripprefix.prefixes=/rest"
      - "traefik.http.routers.postgrest.middlewares=postgrest-stripprefix"
      - "traefik.http.routers.postgrest-v1.rule=Host(`supabase.${domain}`) && PathPrefix(`/rest/v1`)"
      - "traefik.http.routers.postgrest-v1.entrypoints=websecure"
      - "traefik.http.routers.postgrest-v1.tls.certresolver=letsencrypt"
      - "traefik.http.routers.postgrest-v1.service=postgrest"
      - "traefik.http.middlewares.postgrest-v1-stripprefix.stripprefix.prefixes=/rest/v1"
      - "traefik.http.routers.postgrest-v1.middlewares=postgrest-v1-stripprefix"
      - "traefik.docker.network=supabase_supabase-network"
    networks:
      - traefik-network
      - supabase-network
      - postgres-network
    depends_on:
      - supabase-meta

networks:
  traefik-network:
    external: true
  supabase-network:
    driver: bridge
  postgres-network:
    name: postgres_postgres-network
    external: true
  minio-network:
    name: minio_minio-network
    external: true

