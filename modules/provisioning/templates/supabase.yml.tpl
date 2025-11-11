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
      - POSTGRES_PASSWORD=${password}
      - POSTGRES_HOST=supabase-db
      - POSTGRES_PORT=5432
      - POSTGRES_DB=postgres
      - POSTGRES_USER=guilhermeterence
      - DATABASE_URL=postgresql://guilhermeterence:${password}@supabase-db:5432/postgres
      - STORAGE_BACKEND=s3
      - STORAGE_S3_ENDPOINT=http://minio:9000
      - STORAGE_S3_REGION=us-east-1
      - STORAGE_S3_BUCKET=${minio_bucket}
      - STORAGE_S3_ACCESS_KEY=${minio_access_key}
      - STORAGE_S3_SECRET_KEY=${minio_secret_key}
      - STORAGE_S3_FORCE_PATH_STYLE=true
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.supabase.rule=Host(`supabase.${domain}`)"
      - "traefik.http.routers.supabase.entrypoints=websecure"
      - "traefik.http.routers.supabase.tls.certresolver=letsencrypt"
      - "traefik.http.routers.supabase.service=supabase"
      - "traefik.http.services.supabase.loadbalancer.server.port=3000"
    networks:
      - traefik-network
      - supabase-network
    depends_on:
      - supabase-db

  supabase-db:
    image: postgres:15-alpine
    container_name: supabase-db
    restart: unless-stopped
    environment:
      - POSTGRES_PASSWORD=${password}
      - POSTGRES_DB=postgres
      - POSTGRES_USER=guilhermeterence
      - PGDATA=/var/lib/postgresql/data/pgdata
    volumes:
      - supabase_db_data:/var/lib/postgresql/data
    networks:
      - supabase-network

volumes:
  supabase_db_data:

networks:
  traefik-network:
    external: true
  supabase-network:
    driver: bridge

