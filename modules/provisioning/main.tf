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

  provisioner "remote-exec" {
    inline = [
      "cd /opt/docker/postgres",
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
      "docker exec minio mc alias rm local >/dev/null 2>&1 || true",
      "docker exec minio mc alias set local http://127.0.0.1:9000 '${var.minio_root_user}' '${local.minio_root_password}'",
      "docker exec minio mc mb --ignore-existing local/${var.minio_bucket_name}",
      "docker exec minio mc anonymous set private local/${var.minio_bucket_name}"
    ]
  }
}

# Provisionar N8N
resource "null_resource" "provision_n8n" {
  count = var.enable_n8n ? 1 : 0

  depends_on = [null_resource.provision_traefik, null_resource.provision_postgres]

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
      "docker-compose up -d"
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
      password         = var.supabase_db_password != "" ? nonsensitive(var.supabase_db_password) : "postgres"
      service_key      = var.supabase_service_key != "" ? nonsensitive(var.supabase_service_key) : "n78oYSAI5XiVxH5Ua4CYf4W+q1cS/QuSsbH9moX2onY="
      minio_bucket     = var.minio_bucket_name
      minio_access_key = var.minio_service_account_access_key != "" ? nonsensitive(var.minio_service_account_access_key) : ""
      minio_secret_key = var.minio_service_account_secret_key != "" ? nonsensitive(var.minio_service_account_secret_key) : ""
    })
    destination = "/opt/docker/supabase/docker-compose.yml"
  }

  provisioner "remote-exec" {
    inline = [
      "cd /opt/docker/supabase",
      "docker-compose down 2>/dev/null || true",
      "docker volume rm supabase_supabase_db_data 2>/dev/null || true",
      "docker-compose up -d",
      "sleep 5",
      "docker exec supabase-db chown -R postgres:postgres /var/lib/postgresql/data 2>/dev/null || true",
      "docker-compose restart supabase-db",
      "docker network inspect supabase_supabase-network >/dev/null 2>&1 && docker network connect supabase_supabase-network traefik 2>/dev/null || true"
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

