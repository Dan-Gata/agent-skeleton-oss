# 🚀 Quick Start - Agent Skeleton OSS

## ⚡ TL;DR - Deploy in 5 Minutes

```bash
# 1. Verify setup
./verify-deployment.sh

# 2. Push to GitHub
git push

# 3. Deploy on Coolify
# - New Application → Docker
# - Repository: https://github.com/Dan-Gata/agent-skeleton-oss
# - Port: 3000
# - Health Check: /health
# - Environment: NODE_ENV=production, PORT=3000

# 4. Access your app
# https://your-domain.com/health
```

## ✅ What's Fixed

The **"error server no active"** issue is RESOLVED! ✨

**Root causes identified and fixed:**
- ✅ Missing Dockerfile → Created optimized Dockerfile
- ✅ Corrupted file → Using working `src/index.js`
- ✅ Wrong entry point → Fixed `server.js`
- ✅ No build optimization → Added `.dockerignore`

## 📦 What's Included

### New Files
- `Dockerfile` - Container configuration with health check
- `.dockerignore` - Build optimization
- `verify-deployment.sh` - Automated testing script

### Documentation
- `COOLIFY_FIX.md` - Technical details of the fix
- `TROUBLESHOOTING.md` - Solutions to 8 common issues
- `DEPLOYMENT_SUCCESS.md` - Complete deployment guide

## 🧪 Test Before Deploy

```bash
# Run the verification script
./verify-deployment.sh
```

**Expected output:**
```
✅ Prêt pour le déploiement Coolify !
```

## 🌐 Local Testing

```bash
# Start the server
npm start

# Test health check
curl http://localhost:3000/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-10-04T...",
  "version": "1.0.0",
  "services": {
    "coolify": "configured",
    "n8n": "configured"
  }
}
```

## 🔧 Coolify Configuration

### Minimal Setup
```yaml
Build Pack: Docker
Port: 3000
Health Check Path: /health
Environment Variables:
  NODE_ENV: production
  PORT: 3000
```

### Full Setup (Optional)
```env
# Required
NODE_ENV=production
PORT=3000

# Optional - AI APIs
OPENROUTER_API_KEY=sk-or-v1-xxxxx
OPENAI_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Optional - Integrations
N8N_API_URL=https://your-n8n.com/api/v1
N8N_API_KEY=your-key
COOLIFY_API_URL=https://your-coolify.com/api
COOLIFY_API_KEY=your-key
BASEROW_URL=https://api.baserow.io
BASEROW_API_TOKEN=your-token
```

## 🎯 Deployment Steps

### 1. Verify Locally
```bash
./verify-deployment.sh
```

### 2. Create Coolify Application
1. Open Coolify dashboard
2. Click "New Resource" → "Application"
3. Select "Git Repository"

### 3. Configure Source
```
Repository URL: https://github.com/Dan-Gata/agent-skeleton-oss
Branch: main
Build Pack: Docker
```

### 4. Set Port & Health Check
```
Port: 3000
Health Check Path: /health
```

### 5. Add Environment Variables
At minimum:
```env
NODE_ENV=production
PORT=3000
```

### 6. Deploy
Click "Deploy" and wait 2-5 minutes

### 7. Verify
```bash
curl https://your-domain.com/health
```

## ✨ Features

- 🤖 **Multi-Model AI** - Claude, GPT-4, Gemini, and more
- 🎨 **Modern Interface** - Dark/light mode, responsive
- 🔗 **Integrations** - n8n, Coolify, Baserow
- 🔒 **Secure** - Helmet, CORS, rate limiting
- 📊 **Monitoring** - Health checks, metrics
- 🚀 **Fast** - Optimized Docker build

## 📚 Need Help?

- **Quick Fix** → `COOLIFY_FIX.md`
- **Problems** → `TROUBLESHOOTING.md`
- **Complete Guide** → `DEPLOYMENT_SUCCESS.md`
- **Script Check** → `./verify-deployment.sh`

## 🆘 Common Issues

### Server won't start
```bash
# Check dependencies
npm install

# Test locally
npm start
```

### Health check fails
```bash
# Verify endpoint
curl http://localhost:3000/health

# Check Coolify logs
```

### Build fails
```bash
# Clear cache in Coolify
# Redeploy
```

## 🎉 Success Indicators

✅ Server starts without errors
✅ Health check returns 200 OK  
✅ Coolify shows "healthy" status
✅ Domain accessible
✅ No errors in logs

## 🚀 Next Steps

After successful deployment:

1. **Configure AI APIs** - Add API keys for AI features
2. **Set up n8n** - Connect workflow automation
3. **Enable monitoring** - Activate logs and alerts
4. **Auto-deploy** - Add GitHub webhook
5. **Customize** - Adapt to your needs

## 💡 Pro Tips

- Test locally before deploying: `./verify-deployment.sh`
- Use environment variables in Coolify, not in code
- Monitor logs during first deployment
- Start with minimal config, add features incrementally
- Keep documentation updated

## 📞 Support

- **GitHub Issues** - Report bugs
- **Documentation** - Check guides
- **Verification Script** - Auto-diagnose issues

---

**Ready to deploy? Run `./verify-deployment.sh` and get started! 🚀**
