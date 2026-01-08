version: '3.8'

services:
  supabase-functions:
    image: denoland/deno:alpine-1.40.0
    container_name: supabase-functions
    restart: unless-stopped
    command: >
      sh -c "
        deno run --allow-net --allow-env --allow-read --allow-write /app/functions/index.ts
      "
    working_dir: /app
    volumes:
      - ./functions:/app/functions:ro
      - ./_shared:/app/_shared:ro
    environment:
      - SUPABASE_URL=https://supabase.${domain}
      - SUPABASE_SERVICE_ROLE_KEY=${service_key}
      - DENO_ENV=production
      - POSTGRES_HOST=postgres
      - POSTGRES_PORT=5432
      - POSTGRES_DB=postgres
      - POSTGRES_USER=guilhermeterence
      - POSTGRES_PASSWORD=${password}
      - ADMIN_EMAIL=admin@terenceconsultoria.com.br
    ports:
      - "8000:8000"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.supabase-functions.rule=Host(`supabase.${domain}`) && PathPrefix(`/functions/v1`)"
      - "traefik.http.routers.supabase-functions.entrypoints=websecure"
      - "traefik.http.routers.supabase-functions.tls.certresolver=letsencrypt"
      - "traefik.http.routers.supabase-functions.service=supabase-functions"
      - "traefik.http.services.supabase-functions.loadbalancer.server.port=8000"
      - "traefik.http.services.supabase-functions.loadbalancer.server.scheme=http"
      - "traefik.http.middlewares.supabase-functions-stripprefix.stripprefix.prefixes=/functions/v1"
      - "traefik.http.routers.supabase-functions.middlewares=supabase-functions-stripprefix"
      - "traefik.docker.network=supabase_supabase-network"
    networks:
      - traefik-network
      - supabase-network
      - postgres-network

networks:
  traefik-network:
    external: true
  supabase-network:
    name: supabase_supabase-network
    external: true
  postgres-network:
    name: postgres_postgres-network
    external: true

