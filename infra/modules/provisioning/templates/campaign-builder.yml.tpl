services:
  crm:
    build:
      context: /opt/docker/campaign-builder
      dockerfile: Dockerfile
    container_name: crm
    restart: unless-stopped
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.crm.rule=Host(`crm.${domain}`)"
      - "traefik.http.routers.crm.entrypoints=websecure"
      - "traefik.http.routers.crm.tls.certresolver=letsencrypt"
      - "traefik.http.routers.crm.service=crm"
      - "traefik.http.services.crm.loadbalancer.server.port=80"
      - "traefik.docker.network=traefik-network"
    networks:
      - traefik-network

networks:
  traefik-network:
    external: true

