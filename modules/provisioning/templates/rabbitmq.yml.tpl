version: '3.8'

services:
  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: rabbitmq
    restart: unless-stopped
    environment:
      - RABBITMQ_DEFAULT_USER=${user}
      - RABBITMQ_DEFAULT_PASS=${password}
      - RABBITMQ_DEFAULT_VHOST=/
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    ports:
      - "5672:5672"   # AMQP port
      - "15672:15672" # Management UI port
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.rabbitmq.rule=Host(`rabbitmq.${domain}`)"
      - "traefik.http.routers.rabbitmq.entrypoints=websecure"
      - "traefik.http.routers.rabbitmq.tls.certresolver=letsencrypt"
      - "traefik.http.services.rabbitmq.loadbalancer.server.port=15672"
      - "traefik.http.routers.rabbitmq-api.rule=Host(`rabbitmq-api.${domain}`)"
      - "traefik.http.routers.rabbitmq-api.entrypoints=websecure"
      - "traefik.http.routers.rabbitmq-api.tls.certresolver=letsencrypt"
      - "traefik.http.services.rabbitmq-api.loadbalancer.server.port=15672"
    networks:
      - traefik-network
      - rabbitmq-network

volumes:
  rabbitmq_data:

networks:
  traefik-network:
    external: true
  rabbitmq-network:
    driver: bridge

