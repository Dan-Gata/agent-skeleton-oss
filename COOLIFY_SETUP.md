# Configuration Coolify pour Agent Skeleton OSS

## Variables d'environnement REQUISES

### Configuration serveur
```
NODE_ENV=production
PORT=3000
```

**Important** : Ces variables doivent être configurées comme **Runtime Variables** (PAS Build Time)

### Configuration OpenRouter (optionnel)
```
OPENROUTER_API_KEY=sk-or-v1-xxxxx
```
Cochez "Is Secret" pour cette variable.

### Configurations optionnelles
```
N8N_API_URL=https://n8n.votredomaine.com
N8N_API_KEY=votre_cle_n8n

COOLIFY_API_URL=https://coolify.votredomaine.com
COOLIFY_API_KEY=votre_cle_coolify

BASEROW_URL=http://baserow:80
BASEROW_API_TOKEN=votre_token_baserow
```

## Configuration Coolify

### Port exposé
- **Container Port**: 3000
- **Public Port**: 80 ou 443 (géré par Coolify/Traefik)

### Health Check
- **Endpoint**: `/health`
- **Interval**: 30s
- **Timeout**: 10s
- **Start Period**: 15s
- **Retries**: 3

### Domain Configuration
- Ajoutez votre domaine dans Coolify
- Exemple: `app.votredomaine.com`
- Le certificat SSL sera généré automatiquement

## Endpoints disponibles

- `/` - Informations de l'application
- `/health` - Health check pour Coolify
- `/metrics` - Métriques système
- `/dashboard` - Dashboard principal
- `/api/chat` - API de chat

## Troubleshooting

### Le serveur n'est pas accessible

1. **Vérifiez que PORT=3000** est bien configuré en Runtime Variable
2. **Vérifiez le domaine** dans Coolify
3. **Testez le health check** :
   ```bash
   docker logs <container-id> | grep "Health check"
   ```
4. **Vérifiez les logs de démarrage** :
   ```bash
   docker logs <container-id> | grep "démarré"
   ```

### Container unhealthy

Si le container est marqué "unhealthy" :
1. Attendez 15 secondes (start period)
2. Vérifiez que `/health` répond HTTP 200
3. Consultez les logs du container
4. Vérifiez que `wget` ou `curl` est disponible dans l'image

### Build échoue

1. Supprimez le cache : "Force Rebuild Without Cache"
2. Vérifiez que les dépendances npm s'installent correctement
3. Consultez les logs de build complets

## Support

Pour plus d'aide, consultez :
- Logs Coolify : Deployments → Dernier déploiement → Logs
- Logs Container : Service → Logs
- Documentation Coolify : https://coolify.io/docs
