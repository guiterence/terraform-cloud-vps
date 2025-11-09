version: '3.8'

services:
  minio:
    image: minio/minio:latest
    container_name: minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=${user}
      - MINIO_ROOT_PASSWORD=${password}
    volumes:
      - minio_data:/data
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.minio.rule=Host(`minio.${domain}`)"
      - "traefik.http.routers.minio.entrypoints=websecure"
      - "traefik.http.routers.minio.tls.certresolver=letsencrypt"
      - "traefik.http.services.minio.loadbalancer.server.port=9000"
      - "traefik.http.routers.minio-console.rule=Host(`minio-console.${domain}`)"
      - "traefik.http.routers.minio-console.entrypoints=websecure"
      - "traefik.http.routers.minio-console.tls.certresolver=letsencrypt"
      - "traefik.http.services.minio-console.loadbalancer.server.port=9001"
    networks:
      - traefik-network

volumes:
  minio_data:

networks:
  traefik-network:
    external: true

