# Configurar conexão SSH
locals {
  ssh_user         = "root"
  ssh_host         = var.vps_ip
  minio_root_password = var.minio_root_password != "" ? nonsensitive(var.minio_root_password) : "minioadmin"
  traefik_basic_auth_hash = var.traefik_basic_auth_password != "" ? bcrypt(var.traefik_basic_auth_password) : ""
}

# Aguardar a VPS estar acessível via SSH (aguardar alguns segundos após criação)
resource "time_sleep" "wait_for_vps_ready" {
  create_duration = "120s"
}

# Setup inicial do servidor
resource "null_resource" "initial_setup" {
  depends_on = [time_sleep.wait_for_vps_ready]

  connection {
    type        = "ssh"
    host        = local.ssh_host
    user        = local.ssh_user
    # Usar apenas ssh-agent (não tentar ler chave com passphrase diretamente)
    # private_key só será usado se ssh-agent não estiver disponível
    timeout     = "10m"
    agent       = true  # Usar ssh-agent (resolve passphrase)
    host_key    = ""    # Não verificar host key (primeira conexão)
  }

  provisioner "remote-exec" {
    inline = [
      "apt-get update",
      "apt-get install -y curl wget git ufw",
      "ufw allow 22/tcp",
      "ufw allow 80/tcp",
      "ufw allow 443/tcp",
      "ufw --force enable"
    ]
  }
}

# Instalar Docker
resource "null_resource" "install_docker" {
  depends_on = [null_resource.initial_setup]

  connection {
    type        = "ssh"
    host        = local.ssh_host
    user        = local.ssh_user
    # Usar apenas ssh-agent (não tentar ler chave com passphrase diretamente)
    # private_key só será usado se ssh-agent não estiver disponível
    timeout     = "10m"
    agent       = true  # Usar ssh-agent (resolve passphrase)
    host_key    = ""    # Não verificar host key (primeira conexão)
  }

  provisioner "remote-exec" {
    inline = [
      "curl -fsSL https://get.docker.com -o get-docker.sh",
      "sh get-docker.sh",
      "usermod -aG docker root",
      "systemctl enable docker",
      "systemctl start docker"
    ]
  }
}

# Instalar Docker Compose
resource "null_resource" "install_docker_compose" {
  depends_on = [null_resource.install_docker]

  connection {
    type        = "ssh"
    host        = local.ssh_host
    user        = local.ssh_user
    # Usar apenas ssh-agent (não tentar ler chave com passphrase diretamente)
    # private_key só será usado se ssh-agent não estiver disponível
    timeout     = "10m"
    agent       = true  # Usar ssh-agent (resolve passphrase)
    host_key    = ""    # Não verificar host key (primeira conexão)
  }

  provisioner "remote-exec" {
    inline = [
      "curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)\" -o /usr/local/bin/docker-compose",
      "chmod +x /usr/local/bin/docker-compose"
    ]
  }
}

# Criar rede Docker do Traefik
resource "null_resource" "create_traefik_network" {
  depends_on = [null_resource.install_docker_compose]

  connection {
    type        = "ssh"
    host        = local.ssh_host
    user        = local.ssh_user
    # Usar apenas ssh-agent (não tentar ler chave com passphrase diretamente)
    # private_key só será usado se ssh-agent não estiver disponível
    timeout     = "10m"
    agent       = true  # Usar ssh-agent (resolve passphrase)
    host_key    = ""    # Não verificar host key (primeira conexão)
  }

  provisioner "remote-exec" {
    inline = [
      "docker network create traefik-network || true"
    ]
  }
}

# Criar diretórios para as ferramentas
resource "null_resource" "create_directories" {
  depends_on = [null_resource.create_traefik_network]

  connection {
    type        = "ssh"
    host        = local.ssh_host
    user        = local.ssh_user
    # Usar apenas ssh-agent (não tentar ler chave com passphrase diretamente)
    # private_key só será usado se ssh-agent não estiver disponível
    timeout     = "10m"
    agent       = true  # Usar ssh-agent (resolve passphrase)
    host_key    = ""    # Não verificar host key (primeira conexão)
  }

  provisioner "remote-exec" {
    inline = [
      "mkdir -p /opt/docker/traefik /opt/docker/n8n /opt/docker/portainer /opt/docker/supabase /opt/docker/postgres /opt/docker/minio /opt/docker/rabbitmq",
      "mkdir -p /opt/docker/traefik/acme /opt/docker/traefik/config",
      "mkdir -p /opt/docker/minio/data",
      "mkdir -p /opt/docker/postgres/data"
    ]
  }
}

# Provisionar Traefik
resource "null_resource" "provision_traefik" {
  count = var.enable_traefik ? 1 : 0

  depends_on = [null_resource.create_directories]

  triggers = {
    compose_hash      = filesha1("${path.module}/templates/traefik.yml.tpl")
    config_hash       = filesha1("${path.module}/templates/traefik-config.yml.tpl")
    basic_auth_user   = var.traefik_basic_auth_user
    basic_auth_hash   = local.traefik_basic_auth_hash
  }

  connection {
    type        = "ssh"
    host        = local.ssh_host
    user        = local.ssh_user
    # Usar apenas ssh-agent (não tentar ler chave com passphrase diretamente)
    # private_key só será usado se ssh-agent não estiver disponível
    timeout     = "10m"
    agent       = true  # Usar ssh-agent (resolve passphrase)
    host_key    = ""    # Não verificar host key (primeira conexão)
  }

  provisioner "file" {
    content = templatefile("${path.module}/templates/traefik.yml.tpl", {
      domain      = var.domain_name
      email       = var.traefik_email
      basic_auth_user = var.traefik_basic_auth_user
      basic_auth_hash = local.traefik_basic_auth_hash
    })
    destination = "/opt/docker/traefik/docker-compose.yml"
  }

  provisioner "remote-exec" {
    inline = [
      "rm -rf /opt/docker/traefik/config/traefik.yml",  # Remove se for diretório
      "mkdir -p /opt/docker/traefik/config",
      "mkdir -p /opt/docker/traefik/acme"
    ]
  }

  provisioner "file" {
    content = templatefile("${path.module}/templates/traefik-config.yml.tpl", {
      domain = var.domain_name
      email  = var.traefik_email
    })
    destination = "/opt/docker/traefik/config/traefik.yml"
  }

  provisioner "remote-exec" {
    inline = [
      "cd /opt/docker/traefik",
      "chmod 600 /opt/docker/traefik/acme/acme.json 2>/dev/null || true",
      "docker-compose up -d",
      "docker network inspect supabase_supabase-network >/dev/null 2>&1 && docker network connect supabase_supabase-network traefik 2>/dev/null || true"
    ]
  }
}

# Provisionar Portainer
resource "null_resource" "provision_portainer" {
  count = var.enable_portainer ? 1 : 0

  depends_on = [null_resource.provision_traefik]

  connection {
    type        = "ssh"
    host        = local.ssh_host
    user        = local.ssh_user
    # Usar apenas ssh-agent (não tentar ler chave com passphrase diretamente)
    # private_key só será usado se ssh-agent não estiver disponível
    timeout     = "10m"
    agent       = true  # Usar ssh-agent (resolve passphrase)
    host_key    = ""    # Não verificar host key (primeira conexão)
  }

  provisioner "file" {
    content = templatefile("${path.module}/templates/portainer.yml.tpl", {
      domain = var.domain_name
    })
    destination = "/opt/docker/portainer/docker-compose.yml"
  }

  provisioner "remote-exec" {
    inline = [
      "cd /opt/docker/portainer",
      "docker-compose up -d"
    ]
  }
}

# Provisionar PostgreSQL
resource "null_resource" "provision_postgres" {
  count = var.enable_postgres ? 1 : 0

  depends_on = [null_resource.create_directories]

  triggers = {
    compose_hash = filesha1("${path.module}/templates/postgres.yml.tpl")
    pg_hba_hash  = filesha1("${path.module}/templates/pg_hba.conf.tpl")
  }

  connection {
    type        = "ssh"
    host        = local.ssh_host
    user        = local.ssh_user
    # Usar apenas ssh-agent (não tentar ler chave com passphrase diretamente)
    # private_key só será usado se ssh-agent não estiver disponível
    timeout     = "10m"
    agent       = true  # Usar ssh-agent (resolve passphrase)
    host_key    = ""    # Não verificar host key (primeira conexão)
  }

  provisioner "file" {
    content = templatefile("${path.module}/templates/postgres.yml.tpl", {
      password = var.postgres_password != "" ? nonsensitive(var.postgres_password) : "postgres"
    })
    destination = "/opt/docker/postgres/docker-compose.yml"
  }

  provisioner "file" {
    content     = file("${path.module}/templates/pg_hba.conf.tpl")
    destination = "/opt/docker/postgres/pg_hba.conf"
  }

  provisioner "remote-exec" {
    inline = [
      "cd /opt/docker/postgres",
      "docker-compose down",
      "docker-compose up -d"
    ]
  }
}

# Provisionar MinIO
resource "null_resource" "provision_minio" {
  count = var.enable_minio ? 1 : 0

  depends_on = [null_resource.create_directories]

  triggers = {
    compose_hash = filesha1("${path.module}/templates/minio.yml.tpl")
    bucket       = var.minio_bucket_name
  }

  connection {
    type        = "ssh"
    host        = local.ssh_host
    user        = local.ssh_user
    # Usar apenas ssh-agent (não tentar ler chave com passphrase diretamente)
    # private_key só será usado se ssh-agent não estiver disponível
    timeout     = "10m"
    agent       = true  # Usar ssh-agent (resolve passphrase)
    host_key    = ""    # Não verificar host key (primeira conexão)
  }

  provisioner "file" {
    content = templatefile("${path.module}/templates/minio.yml.tpl", {
      domain   = var.domain_name
      user     = var.minio_root_user
      password = local.minio_root_password
    })
    destination = "/opt/docker/minio/docker-compose.yml"
  }

  provisioner "remote-exec" {
    inline = [
      "cd /opt/docker/minio",
      "docker-compose up -d",
      "sleep 10",
      "docker run --rm --network container:minio minio/mc:latest alias rm local >/dev/null 2>&1 || true",
      "docker run --rm --network container:minio minio/mc:latest alias set local http://127.0.0.1:9000 '${var.minio_root_user}' '${local.minio_root_password}'",
      "docker run --rm --network container:minio minio/mc:latest mb --ignore-existing local/${var.minio_bucket_name} || echo 'Bucket já existe ou erro ao criar'",
      "docker run --rm --network container:minio minio/mc:latest anonymous set private local/${var.minio_bucket_name} || echo 'Erro ao configurar anônimo'"
    ]
  }
}

# Provisionar N8N
resource "null_resource" "provision_n8n" {
  count = var.enable_n8n ? 1 : 0

  depends_on = [null_resource.provision_traefik, null_resource.provision_postgres]

  triggers = {
    compose_hash = filesha1("${path.module}/templates/n8n.yml.tpl")
  }

  connection {
    type        = "ssh"
    host        = local.ssh_host
    user        = local.ssh_user
    # Usar apenas ssh-agent (não tentar ler chave com passphrase diretamente)
    # private_key só será usado se ssh-agent não estiver disponível
    timeout     = "10m"
    agent       = true  # Usar ssh-agent (resolve passphrase)
    host_key    = ""    # Não verificar host key (primeira conexão)
  }

  provisioner "file" {
    content = templatefile("${path.module}/templates/n8n.yml.tpl", {
      domain           = var.domain_name
      anthropic_api_key = var.n8n_anthropic_api_key != "" ? nonsensitive(var.n8n_anthropic_api_key) : ""
    })
    destination = "/opt/docker/n8n/docker-compose.yml"
  }

  provisioner "remote-exec" {
    inline = [
      "cd /opt/docker/n8n",
      "docker-compose pull",
      "docker-compose up -d --force-recreate"
    ]
  }
}

# Provisionar Supabase
resource "null_resource" "provision_supabase" {
  count = var.enable_supabase ? 1 : 0

  depends_on = [null_resource.provision_traefik, null_resource.provision_postgres]

  triggers = {
    compose_hash = filesha1("${path.module}/templates/supabase.yml.tpl")
    minio_bucket = var.minio_bucket_name
    minio_access = sha256(nonsensitive(var.minio_service_account_access_key))
    minio_secret = sha256(nonsensitive(var.minio_service_account_secret_key))
    init_hash   = filesha1("${path.module}/templates/supabase-init.sql.tpl")
  }

  connection {
    type        = "ssh"
    host        = local.ssh_host
    user        = local.ssh_user
    # Usar apenas ssh-agent (não tentar ler chave com passphrase diretamente)
    # private_key só será usado se ssh-agent não estiver disponível
    timeout     = "10m"
    agent       = true  # Usar ssh-agent (resolve passphrase)
    host_key    = ""    # Não verificar host key (primeira conexão)
  }

  provisioner "file" {
    content = templatefile("${path.module}/templates/supabase.yml.tpl", {
      domain           = var.domain_name
      password         = var.postgres_password != "" ? nonsensitive(var.postgres_password) : "postgres"
      service_key      = var.supabase_service_key != "" ? nonsensitive(var.supabase_service_key) : "n78oYSAI5XiVxH5Ua4CYf4W+q1cS/QuSsbH9moX2onY="
      minio_bucket     = var.minio_bucket_name
      minio_access_key = var.minio_service_account_access_key != "" ? nonsensitive(var.minio_service_account_access_key) : ""
      minio_secret_key = var.minio_service_account_secret_key != "" ? nonsensitive(var.minio_service_account_secret_key) : ""
    })
    destination = "/opt/docker/supabase/docker-compose.yml"
  }

  provisioner "file" {
    content = templatefile("${path.module}/templates/supabase-init.sql.tpl", {
      password = replace(var.postgres_password != "" ? nonsensitive(var.postgres_password) : "postgres", "'", "''")
    })
    destination = "/opt/docker/supabase/init.sql"
  }

  # Copiar script de seed para customer_360
  provisioner "file" {
    source      = "${path.module}/../../../apps/seed-customer-360.sql"
    destination = "/opt/docker/supabase/seed-customer-360.sql"
  }

  provisioner "remote-exec" {
    inline = [
      "cd /opt/docker/supabase",
      "docker-compose down 2>/dev/null || true",
      "docker-compose up -d",
      "sleep 5",
      "docker cp /opt/docker/supabase/init.sql postgres:/tmp/init.sql",
      "docker exec -e PGPASSWORD='${var.postgres_password != "" ? replace(nonsensitive(var.postgres_password), "'", "'\"'\"'") : "postgres"}' postgres psql -U guilhermeterence -d postgres -f /tmp/init.sql",
      "docker cp /opt/docker/supabase/seed-customer-360.sql postgres:/tmp/seed-customer-360.sql",
      "docker exec -e PGPASSWORD='${var.postgres_password != "" ? replace(nonsensitive(var.postgres_password), "'", "'\"'\"'") : "postgres"}' postgres psql -U guilhermeterence -d postgres -f /tmp/seed-customer-360.sql",
      "docker network inspect supabase_supabase-network >/dev/null 2>&1 && docker network connect supabase_supabase-network traefik 2>/dev/null || true"
    ]
  }
}

# Provisionar Supabase Edge Functions
resource "null_resource" "provision_supabase_functions" {
  count = var.enable_supabase ? 1 : 0

  depends_on = [null_resource.provision_supabase, null_resource.provision_campaign_builder]

  triggers = {
    compose_hash = filesha1("${path.module}/templates/supabase-functions.yml.tpl")
    functions_hash = sha256(join("", [
      for f in fileset("${path.module}/../../apps/campaign-builder/supabase/functions", "**/*.ts") :
      filesha1("${path.module}/../../apps/campaign-builder/supabase/functions/${f}")
    ]))
  }

  connection {
    type        = "ssh"
    host        = local.ssh_host
    user        = local.ssh_user
    timeout     = "10m"
    agent       = true
    host_key    = ""
  }

  provisioner "remote-exec" {
    inline = [
      "mkdir -p /opt/docker/supabase-functions/functions",
      "mkdir -p /opt/docker/supabase-functions/functions/_shared",
      "mkdir -p /opt/docker/supabase-functions/functions/target-groups",
      "mkdir -p /opt/docker/supabase-functions/functions/campaigns",
      "mkdir -p /opt/docker/supabase-functions/functions/auth"
    ]
  }

  # Copiar docker-compose.yml
  provisioner "file" {
    content = templatefile("${path.module}/templates/supabase-functions.yml.tpl", {
      domain      = var.domain_name
      service_key = var.supabase_service_key != "" ? nonsensitive(var.supabase_service_key) : "n78oYSAI5XiVxH5Ua4CYf4W+q1cS/QuSsbH9moX2onY="
      password    = var.postgres_password != "" ? nonsensitive(var.postgres_password) : "postgres"
    })
    destination = "/opt/docker/supabase-functions/docker-compose.yml"
  }

  # Copiar arquivos das Edge Functions usando tar
  provisioner "local-exec" {
    working_dir = "${path.module}/../../.."
    command = <<-EOT
      tar -czf /tmp/supabase-functions.tar.gz \
        -C apps/campaign-builder/supabase/functions \
        . 2>/dev/null || \
      tar -czf /tmp/supabase-functions.tar.gz \
        apps/campaign-builder/supabase/functions
    EOT
  }

  # Copiar arquivo tar para o servidor
  provisioner "file" {
    source      = "/tmp/supabase-functions.tar.gz"
    destination = "/tmp/supabase-functions.tar.gz"
  }

  # Extrair arquivos no servidor
  provisioner "remote-exec" {
    inline = [
      "cd /opt/docker/supabase-functions",
      "tar -xzf /tmp/supabase-functions.tar.gz -C functions --strip-components=1 || tar -xzf /tmp/supabase-functions.tar.gz",
      "rm /tmp/supabase-functions.tar.gz",
      "chmod +x functions/index.ts functions/target-groups/index.ts functions/campaigns/index.ts 2>/dev/null || true"
    ]
  }

  # Iniciar container
  provisioner "remote-exec" {
    inline = [
      "cd /opt/docker/supabase-functions",
      "docker-compose down || true",
      "docker-compose up -d",
      "sleep 3",
      "docker-compose ps",
      # Garantir que está na rede correta
      "docker network connect traefik-network supabase-functions 2>/dev/null || true",
      "docker network inspect supabase_supabase-network >/dev/null 2>&1 && docker network connect supabase_supabase-network supabase-functions 2>/dev/null || true",
      "docker network inspect postgres_postgres-network >/dev/null 2>&1 && docker network connect postgres_postgres-network supabase-functions 2>/dev/null || true"
    ]
  }
}

# Provisionar RabbitMQ
resource "null_resource" "provision_rabbitmq" {
  count = var.enable_rabbitmq ? 1 : 0

  depends_on = [null_resource.create_directories, null_resource.provision_traefik]

  connection {
    type        = "ssh"
    host        = local.ssh_host
    user        = local.ssh_user
    # Usar apenas ssh-agent (não tentar ler chave com passphrase diretamente)
    # private_key só será usado se ssh-agent não estiver disponível
    timeout     = "10m"
    agent       = true  # Usar ssh-agent (resolve passphrase)
    host_key    = ""    # Não verificar host key (primeira conexão)
  }

  provisioner "file" {
    content = templatefile("${path.module}/templates/rabbitmq.yml.tpl", {
      domain   = var.domain_name
      user     = var.rabbitmq_user
      password = var.rabbitmq_password != "" ? nonsensitive(var.rabbitmq_password) : "admin"
    })
    destination = "/opt/docker/rabbitmq/docker-compose.yml"
  }

  provisioner "remote-exec" {
    inline = [
      "cd /opt/docker/rabbitmq",
      "docker-compose up -d"
    ]
  }
}

# Provisionar Campaign Builder
resource "null_resource" "provision_campaign_builder" {
  count = var.enable_campaign_builder ? 1 : 0

  depends_on = [null_resource.provision_traefik]

  triggers = {
    compose_hash = filesha1("${path.module}/templates/campaign-builder.yml.tpl")
    dockerfile_hash = filesha1("${path.module}/templates/campaign-builder.Dockerfile")
    nginx_hash = filesha1("${path.module}/templates/campaign-builder.nginx.conf")
    login_tsx_hash = sha256(join("", [
      for f in fileset("${path.module}/../../../apps/campaign-builder/src/components/Auth", "**/*") :
      filesha1("${path.module}/../../../apps/campaign-builder/src/components/Auth/${f}")
    ]))
    login_css_hash = filesha1("${path.module}/../../../apps/campaign-builder/src/components/Auth/Login.css")
    supabase_auth_hash = filesha1("${path.module}/../../../apps/campaign-builder/src/services/supabaseAuth.ts")
    app_tsx_hash = filesha1("${path.module}/../../../apps/campaign-builder/src/App.tsx")
    settings_hash = sha256(join("", [
      for f in fileset("${path.module}/../../../apps/campaign-builder/src/components/Settings", "**/*") :
      filesha1("${path.module}/../../../apps/campaign-builder/src/components/Settings/${f}")
    ]))
    ai_insights_hash = sha256(join("", [
      for f in fileset("${path.module}/../../../apps/campaign-builder/src/components/AIInsights", "**/*") :
      filesha1("${path.module}/../../../apps/campaign-builder/src/components/AIInsights/${f}")
    ]))
    dashboard_hash = sha256(join("", [
      for f in fileset("${path.module}/../../../apps/campaign-builder/src/components/Dashboard", "**/*") :
      filesha1("${path.module}/../../../apps/campaign-builder/src/components/Dashboard/${f}")
    ]))
    customer360_api_hash = filesha1("${path.module}/../../../apps/campaign-builder/src/services/customer360Api.ts")
  }

  connection {
    type        = "ssh"
    host        = local.ssh_host
    user        = local.ssh_user
    timeout     = "10m"
    agent       = true
    host_key    = ""
  }

  provisioner "remote-exec" {
    inline = [
      "mkdir -p /opt/docker/campaign-builder",
      "mkdir -p /opt/docker/campaign-builder/src",
      "mkdir -p /opt/docker/campaign-builder/public"
    ]
  }

  # Copiar docker-compose.yml
  provisioner "file" {
    content = templatefile("${path.module}/templates/campaign-builder.yml.tpl", {
      domain = var.domain_name
    })
    destination = "/opt/docker/campaign-builder/docker-compose.yml"
  }

  # Copiar Dockerfile
  provisioner "file" {
    source      = "${path.module}/templates/campaign-builder.Dockerfile"
    destination = "/opt/docker/campaign-builder/Dockerfile"
  }

  # Copiar nginx.conf
  provisioner "file" {
    source      = "${path.module}/templates/campaign-builder.nginx.conf"
    destination = "/opt/docker/campaign-builder/nginx.conf"
  }

  # Copiar arquivos do frontend usando tar (mais eficiente para múltiplos arquivos)
  provisioner "local-exec" {
    working_dir = "${path.module}/../../.."
    command = <<-EOT
      tar -czf /tmp/campaign-builder.tar.gz \
        -C apps/campaign-builder \
        src public package.json tsconfig.json .gitignore 2>/dev/null || \
      tar -czf /tmp/campaign-builder.tar.gz \
        apps/campaign-builder/src \
        apps/campaign-builder/public \
        apps/campaign-builder/package.json \
        apps/campaign-builder/tsconfig.json \
        apps/campaign-builder/.gitignore
    EOT
  }

  # Copiar arquivo tar para o servidor
  provisioner "file" {
    source      = "/tmp/campaign-builder.tar.gz"
    destination = "/tmp/campaign-builder.tar.gz"
  }

  # Extrair arquivos no servidor
  provisioner "remote-exec" {
    inline = [
      "cd /opt/docker/campaign-builder",
      "tar -xzf /tmp/campaign-builder.tar.gz",
      "rm /tmp/campaign-builder.tar.gz"
    ]
  }

  # Build e iniciar container
  provisioner "remote-exec" {
    inline = [
      "cd /opt/docker/campaign-builder",
      # Remover containers antigos (tanto campaign-builder quanto crm)
      "docker-compose down || true",
      "docker stop campaign-builder 2>/dev/null || true",
      "docker rm campaign-builder 2>/dev/null || true",
      "docker stop crm 2>/dev/null || true",
      "docker rm crm 2>/dev/null || true",
      # Garantir que a rede existe
      "docker network inspect traefik-network >/dev/null 2>&1 || docker network create traefik-network",
      # Build e iniciar
      "docker-compose build --no-cache",
      "docker-compose up -d",
      "sleep 5",
      "docker-compose ps",
      # Garantir que o container está na rede traefik-network
      "docker network connect traefik-network crm 2>/dev/null || true",
      # Verificar se está na rede
      "docker inspect crm | grep -A 10 Networks || echo 'Container crm não encontrado'",
      # Reiniciar Traefik para forçar detecção do novo container
      "docker restart traefik || true",
      "sleep 3"
    ]
  }
}

