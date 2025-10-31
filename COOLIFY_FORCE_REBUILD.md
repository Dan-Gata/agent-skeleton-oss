# 🔥 FORCE REBUILD - Infrastructure Fix

**Date**: 2025-10-31
**Commit**: Infrastructure complete rebuild
**Reason**: Coolify caching old corrupted JavaScript files

## Changes Made:

1. **Dockerfile**: Added CACHEBUST argument to invalidate Docker layer cache
2. **package.json**: Version bumped to 1.0.2-infrastructure-fix
3. **index.js**: Restored from e66725a (last known working version)

## Coolify Instructions:

### STEP 1: Delete ALL environment variables
Go to Coolify → Service → Environment Variables → **DELETE ALL**

### STEP 2: Recreate ONLY these 3 variables:
```
NODE_ENV=production
  ☑️ Runtime ONLY (NOT Build Time)
  ☐ Is Secret

PORT=3000
  ☑️ Runtime ONLY
  ☐ Is Secret

OPENROUTER_API_KEY=sk-or-v1-xxx
  ☑️ Runtime ONLY
  ☑️ Is Secret
```

### STEP 3: Force rebuild WITHOUT cache
Click: **"Force Rebuild Without Cache"**

### STEP 4: Clear browser cache COMPLETELY
- Chrome/Edge: Ctrl+Shift+Delete → "All time" → Clear
- OR use Incognito: Ctrl+Shift+N

### STEP 5: Test
Open: https://superairloup080448.kaussan-air.org/dashboard
F12 → Console should show: **0 errors** ✅

## Expected Container Logs:
```
✅ Session store initialized with SQLite
✅ [FilePersistence] Table files initialisée
✅ [ConversationMemory] Tables initialisées
✅ [N8NAgent] Initialisé avec URL: https://n8n.kaussan-air.org
✅ [CoolifyAgent] Initialisé avec URL: https://kaussan-air.org
✅ [BaserowAgent] Initialisé avec URL: http://baserow:80
✅ [SecurityAgent] Initialisé
🎯 [OrchestratorAgent] Orchestrateur initialisé avec 6 sous-agents
🚀 Agent Skeleton OSS (Simple) démarré sur le port 3000
```

## If Still Failing:

Check container name in Coolify. If it's using old image hash, manually delete the container:
```bash
docker ps -a | grep ug44kc8kgcw0ww40848wggwc
docker stop <container-id>
docker rm <container-id>
docker rmi ug44kc8kgcw0ww40848wggwc:*
```

Then redeploy from Coolify UI.
