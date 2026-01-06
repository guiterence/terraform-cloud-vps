version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=postgres
      - POSTGRES_USER=guilhermeterence
      - POSTGRES_PASSWORD=${password}
      - PGDATA=/var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./pg_hba.conf:/etc/postgresql/pg_hba.conf:ro
    command: >
      postgres
      -c hba_file=/etc/postgresql/pg_hba.conf
      -c listen_addresses=*
      -c shared_preload_libraries=pg_stat_statements
    # Não expor a porta publicamente - apenas na rede Docker
    # ports:
    #   - "5432:5432"
    networks:
      - postgres-network

volumes:
  postgres_data:

networks:
  postgres-network:
    driver: bridge

