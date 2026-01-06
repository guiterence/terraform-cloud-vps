version: '3.8'

services:
  minio:
    image: minio/minio:RELEASE.2023-09-23T03-47-50Z
    container_name: minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=${user}
      - MINIO_ROOT_PASSWORD=${password}
      - MINIO_BROWSER_REDIRECT_URL=https://minio-console.${domain}
      - MINIO_SERVER_URL=https://minio.${domain}
    volumes:
      - minio_data:/data
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.minio.rule=Host(`minio.${domain}`)"
      - "traefik.http.routers.minio.entrypoints=websecure"
      - "traefik.http.routers.minio.tls.certresolver=letsencrypt"
      - "traefik.http.routers.minio.service=minio-api"
      - "traefik.http.services.minio-api.loadbalancer.server.port=9000"
      - "traefik.http.routers.minio-console.rule=Host(`minio-console.${domain}`)"
      - "traefik.http.routers.minio-console.entrypoints=websecure"
      - "traefik.http.routers.minio-console.tls.certresolver=letsencrypt"
      - "traefik.http.routers.minio-console.service=minio-console"
      - "traefik.http.services.minio-console.loadbalancer.server.port=9001"
    networks:
      - traefik-network
      - minio-network

volumes:
  minio_data:

networks:
  traefik-network:
    external: true
  minio-network:
    driver: bridge

