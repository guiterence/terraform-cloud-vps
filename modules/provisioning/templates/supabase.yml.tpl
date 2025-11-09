version: '3.8'

services:
  supabase-studio:
    image: supabase/studio:latest
    container_name: supabase-studio
    restart: unless-stopped
    environment:
      - SUPABASE_URL=http://localhost:8000
      - STUDIO_PG_META_URL=http://localhost:8080
      - DEFAULT_ORGANIZATION_NAME=Default Organization
      - DEFAULT_PROJECT_NAME=Default Project
      - SUPABASE_SERVICE_KEY=your-service-key-here
      - POSTGRES_PASSWORD=${password}
    ports:
      - "3000:3000"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.supabase.rule=Host(`supabase.${domain}`)"
      - "traefik.http.routers.supabase.entrypoints=websecure"
      - "traefik.http.routers.supabase.tls.certresolver=letsencrypt"
      - "traefik.http.services.supabase.loadbalancer.server.port=3000"
    networks:
      - traefik-network
      - supabase-network

  supabase-db:
    image: supabase/postgres:15.1.0.117
    container_name: supabase-db
    restart: unless-stopped
    environment:
      - POSTGRES_PASSWORD=${password}
      - POSTGRES_HOST=/var/run/postgresql
      - PGDATA=/var/lib/postgresql/data/pgdata
    volumes:
      - supabase_db_data:/var/lib/postgresql/data
    # Não expor porta 5432 para evitar conflito com PostgreSQL existente
    # Acesso via rede Docker apenas
    networks:
      - supabase-network

volumes:
  supabase_db_data:

networks:
  traefik-network:
    external: true
  supabase-network:
    driver: bridge

