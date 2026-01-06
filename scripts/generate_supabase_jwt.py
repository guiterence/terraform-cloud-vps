#!/usr/bin/env python3
"""
Script para gerar JWT tokens para autenticação com PostgREST/Supabase self-hosted.

O PostgREST requer JWT tokens válidos no header Authorization: Bearer,
mas o N8N Supabase plugin espera usar o service_key diretamente.

Este script gera JWT tokens válidos que podem ser usados no lugar do service_key.
"""

import jwt
import sys
from datetime import datetime, timedelta

def generate_jwt_token(secret: str, role: str = "service_role", expires_in_days: int = 365):
    """
    Gera um JWT token válido para PostgREST.
    
    Args:
        secret: O JWT secret (service_key)
        role: O role do PostgreSQL a ser usado (anon, authenticated, service_role)
        expires_in_days: Quantos dias até o token expirar
    
    Returns:
        JWT token como string
    """
    # Payload do JWT conforme esperado pelo PostgREST
    payload = {
        "role": role,
        "exp": datetime.utcnow() + timedelta(days=expires_in_days),
        "iat": datetime.utcnow()
    }
    
    # Gerar o token usando HS256 (HMAC SHA-256)
    token = jwt.encode(payload, secret, algorithm="HS256")
    
    return token

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python3 generate_supabase_jwt.py <service_key> [role] [expires_in_days]")
        print("\nExemplo:")
        print("  python3 generate_supabase_jwt.py 'n78oYSAI5XiVxH5Ua4CYf4W+q1cS/QuSsbH9moX2onY='")
        print("  python3 generate_supabase_jwt.py 'n78oYSAI5XiVxH5Ua4CYf4W+q1cS/QuSsbH9moX2onY=' service_role 365")
        sys.exit(1)
    
    secret = sys.argv[1]
    role = sys.argv[2] if len(sys.argv) > 2 else "service_role"
    expires_in_days = int(sys.argv[3]) if len(sys.argv) > 3 else 365
    
    token = generate_jwt_token(secret, role, expires_in_days)
    
    print(f"\nJWT Token gerado para role '{role}':")
    print(f"{token}\n")
    print("Use este token no campo 'Service Role Secret' do N8N Supabase.")
    print(f"Token expira em {expires_in_days} dias.\n")

