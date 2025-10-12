# Intégration Réseaux Sociaux via n8n

Ce document détaille la configuration des 7 plateformes sociales dans n8n pour l'automatisation de publication.

## 🌐 Plateformes Supportées

1. **YouTube** - Vidéos longues, Shorts
2. **TikTok** - Vidéos courtes virales
3. **Instagram** - Posts, Stories, Reels
4. **X/Twitter** - Tweets, Threads
5. **LinkedIn** - Posts professionnels, Articles
6. **Pinterest** - Épingles, Tableaux
7. **Threads** - Posts courts (Meta)

## 🔧 Configuration n8n par Plateforme

### 1. YouTube

#### Credentials n8n
- **Type:** YouTube OAuth2 API
- **Scopes requis:**
  - `https://www.googleapis.com/auth/youtube.upload`
  - `https://www.googleapis.com/auth/youtube.readonly`
  - `https://www.googleapis.com/auth/yt-analytics.readonly`

#### Configuration dans Google Cloud Console
1. Créer un projet: https://console.cloud.google.com
2. Activer YouTube Data API v3
3. Créer des identifiants OAuth 2.0
4. Ajouter URL de redirection n8n: `https://n8n.votre-domaine.tld/rest/oauth2-credential/callback`

#### Workflow n8n - Upload YouTube
```json
{
  "nodes": [
    {
      "name": "YouTube Upload",
      "type": "n8n-nodes-base.youtube",
      "credentials": "youtubeOAuth2Api",
      "parameters": {
        "operation": "upload",
        "title": "={{ $json.title }}",
        "description": "={{ $json.description }}",
        "videoUrl": "={{ $json.videoUrl }}",
        "privacyStatus": "public",
        "categoryId": "22"
      }
    }
  ]
}
```

#### Quotas YouTube
- **Quota quotidien:** 10,000 unités
- **Upload vidéo:** 1,600 unités
- **Limite:** ~6 uploads/jour avec quota standard

### 2. TikTok

#### Credentials n8n
- **Type:** HTTP Request avec Custom Auth
- **Headers:**
  - `Authorization: Bearer YOUR_ACCESS_TOKEN`
  - `Content-Type: application/json`

#### Configuration TikTok Developer
1. Créer une app: https://developers.tiktok.com
2. Demander accès à Content Posting API
3. Générer Access Token

#### Workflow n8n - Upload TikTok
```json
{
  "nodes": [
    {
      "name": "TikTok Upload",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://open-api.tiktok.com/share/video/upload/",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "tiktokApi",
        "sendBody": true,
        "bodyParameters": {
          "video_url": "={{ $json.videoUrl }}",
          "caption": "={{ $json.caption }}",
          "privacy_level": "PUBLIC_TO_EVERYONE"
        }
      }
    }
  ]
}
```

#### Quotas TikTok
- **Limite par app:** 100 posts/jour
- **Limite par utilisateur:** 10 posts/jour

### 3. Instagram

#### Credentials n8n
- **Type:** Instagram Graph API
- **Requirements:** Facebook Business Account + Instagram Professional Account

#### Configuration Meta Developer
1. Créer une app: https://developers.facebook.com
2. Ajouter Instagram Graph API
3. Générer Access Token (User Token)
4. Convertir en Long-Lived Token

#### Workflow n8n - Post Instagram
```json
{
  "nodes": [
    {
      "name": "Instagram Post",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $json.instagramAccountId }}/media",
        "sendQuery": true,
        "queryParameters": {
          "image_url": "={{ $json.imageUrl }}",
          "caption": "={{ $json.caption }}",
          "access_token": "={{ $credentials.accessToken }}"
        }
      }
    },
    {
      "name": "Publish Post",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $json.instagramAccountId }}/media_publish",
        "sendQuery": true,
        "queryParameters": {
          "creation_id": "={{ $json.id }}",
          "access_token": "={{ $credentials.accessToken }}"
        }
      }
    }
  ]
}
```

#### Quotas Instagram
- **Rate Limit:** 200 appels/heure
- **Publications:** 25 posts/jour recommandé

### 4. X/Twitter

#### Credentials n8n
- **Type:** Twitter OAuth 1.0a
- **Ou:** Twitter OAuth 2.0 (API v2)

#### Configuration Twitter Developer
1. Créer une app: https://developer.twitter.com
2. Obtenir API Key, API Secret, Access Token, Access Token Secret
3. Activer Read & Write permissions

#### Workflow n8n - Tweet
```json
{
  "nodes": [
    {
      "name": "Post Tweet",
      "type": "n8n-nodes-base.twitter",
      "credentials": "twitterOAuth1Api",
      "parameters": {
        "operation": "tweet",
        "text": "={{ $json.tweetText }}",
        "attachments": "={{ $json.mediaIds }}"
      }
    }
  ]
}
```

#### Quotas Twitter
- **Tweets:** 2,400/jour (Free tier)
- **API v2 Free:** 1,500 tweets/mois
- **Media uploads:** 50 images/jour

### 5. LinkedIn

#### Credentials n8n
- **Type:** LinkedIn OAuth2

#### Configuration LinkedIn Developer
1. Créer une app: https://www.linkedin.com/developers
2. Demander access pour Share API
3. Configurer OAuth 2.0

#### Workflow n8n - Post LinkedIn
```json
{
  "nodes": [
    {
      "name": "LinkedIn Post",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://api.linkedin.com/v2/ugcPosts",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "linkedInOAuth2Api",
        "sendHeaders": true,
        "headerParameters": {
          "X-Restli-Protocol-Version": "2.0.0"
        },
        "sendBody": true,
        "bodyParameters": {
          "author": "urn:li:person:{{ $json.personId }}",
          "lifecycleState": "PUBLISHED",
          "specificContent": {
            "com.linkedin.ugc.ShareContent": {
              "shareCommentary": {
                "text": "={{ $json.postText }}"
              },
              "shareMediaCategory": "NONE"
            }
          },
          "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
          }
        }
      }
    }
  ]
}
```

#### Quotas LinkedIn
- **Rate Limit:** 100 appels/jour par membre
- **Posts:** Recommandé 1-2/jour pour engagement optimal

### 6. Pinterest

#### Credentials n8n
- **Type:** Pinterest OAuth2

#### Configuration Pinterest Developer
1. Créer une app: https://developers.pinterest.com
2. Générer Access Token
3. Scopes: `pins:read`, `pins:write`, `boards:read`, `boards:write`

#### Workflow n8n - Create Pin
```json
{
  "nodes": [
    {
      "name": "Pinterest Pin",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://api.pinterest.com/v5/pins",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "pinterestOAuth2Api",
        "sendBody": true,
        "bodyParameters": {
          "board_id": "={{ $json.boardId }}",
          "title": "={{ $json.title }}",
          "description": "={{ $json.description }}",
          "link": "={{ $json.link }}",
          "media_source": {
            "source_type": "image_url",
            "url": "={{ $json.imageUrl }}"
          }
        }
      }
    }
  ]
}
```

#### Quotas Pinterest
- **Rate Limit:** 1,000 appels/jour
- **Pins:** 150-200/jour recommandé

### 7. Threads (Meta)

#### Credentials n8n
- **Type:** Instagram Graph API (même que Instagram)
- **Note:** Threads utilise l'infrastructure Instagram

#### Configuration Meta Developer
1. Même app que Instagram
2. Activer Threads API (beta)
3. Utiliser même Access Token qu'Instagram

#### Workflow n8n - Post Threads
```json
{
  "nodes": [
    {
      "name": "Threads Post",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://graph.threads.net/v1.0/{{ $json.threadsUserId }}/threads",
        "sendQuery": true,
        "queryParameters": {
          "text": "={{ $json.threadText }}",
          "access_token": "={{ $credentials.accessToken }}"
        }
      }
    }
  ]
}
```

#### Quotas Threads
- **Rate Limit:** Similaire à Instagram (200/heure)
- **Posts:** 25/jour recommandé

## 📋 Checklist Pré-Production

### Pour Chaque Plateforme

- [ ] **Compte créé et vérifié**
- [ ] **App développeur configurée**
- [ ] **Credentials OAuth obtenues**
- [ ] **Permissions/Scopes validés**
- [ ] **Credentials ajoutées dans n8n**
- [ ] **Workflow de test créé**
- [ ] **Publication test réussie**
- [ ] **Quotas et limites notés**
- [ ] **Gestion d'erreurs implémentée**
- [ ] **Logs de publication configurés**

## 🔄 Workflow Orchestré - Multi-Plateforme

### Workflow "Social Publisher" dans n8n

```
[Webhook Trigger]
      │
      ├─→ [Format pour YouTube]  → [YouTube Upload]
      │
      ├─→ [Format pour TikTok]   → [TikTok Upload]
      │
      ├─→ [Format pour Instagram]→ [Instagram Post]
      │
      ├─→ [Format pour X]        → [X Post]
      │
      ├─→ [Format pour LinkedIn] → [LinkedIn Post]
      │
      ├─→ [Format pour Pinterest]→ [Pinterest Pin]
      │
      └─→ [Format pour Threads]  → [Threads Post]
                    │
                    └─→ [Baserow: Log Results]
```

### Déclenchement via Orchestrateur

```powershell
# Publication multi-plateformes
curl -X POST http://localhost:3000/trigger/n8n/social-publish `
  -H "Content-Type: application/json" `
  -d '{
    "content": {
      "title": "Mon contenu",
      "description": "Description",
      "videoUrl": "https://...",
      "imageUrl": "https://...",
      "hashtags": ["#ai", "#tech"]
    },
    "platforms": ["youtube", "tiktok", "instagram"],
    "schedule": "2025-10-12T10:00:00Z"
  }'
```

## 📊 Tracking & Analytics

### Données à Stocker dans Baserow

Pour chaque publication:
- **Publication ID** (de chaque plateforme)
- **Plateforme**
- **Date/Heure**
- **Statut** (success/failed)
- **Lien public**
- **Métriques initiales** (vues à T+1h, T+24h)
- **Erreurs éventuelles**

### Workflow de Monitoring

```json
{
  "nodes": [
    {
      "name": "Schedule: Daily Analytics",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "triggerTimes": {
          "item": [
            { "mode": "everyDay", "hour": 9, "minute": 0 }
          ]
        }
      }
    },
    {
      "name": "Get Baserow Publications",
      "type": "n8n-nodes-base.httpRequest"
    },
    {
      "name": "Fetch Platform Analytics",
      "type": "n8n-nodes-base.httpRequest"
    },
    {
      "name": "Update Baserow",
      "type": "n8n-nodes-base.httpRequest"
    }
  ]
}
```

## 🚨 Gestion d'Erreurs

### Stratégies par Plateforme

1. **Rate Limiting**
   - Implémenter retry avec backoff exponentiel
   - Espacer les publications (5-10 min entre chaque)

2. **Échecs d'Upload**
   - Logger dans Baserow
   - Notifier via email/Slack
   - Retry automatique après 1h

3. **Token Expirés**
   - Refresh automatique des OAuth tokens
   - Alerte si refresh échoue

### Workflow de Retry

```json
{
  "nodes": [
    {
      "name": "Try Upload",
      "type": "n8n-nodes-base.httpRequest",
      "continueOnFail": true
    },
    {
      "name": "IF Error",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{ $json.error }}",
              "operation": "exists"
            }
          ]
        }
      }
    },
    {
      "name": "Wait 1 hour",
      "type": "n8n-nodes-base.wait"
    },
    {
      "name": "Retry Upload",
      "type": "n8n-nodes-base.httpRequest"
    }
  ]
}
```

## 📚 Ressources

### Documentation Officielle
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [TikTok API](https://developers.tiktok.com)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [Twitter API](https://developer.twitter.com/en/docs)
- [LinkedIn API](https://docs.microsoft.com/en-us/linkedin/)
- [Pinterest API](https://developers.pinterest.com)
- [Threads API](https://developers.facebook.com/docs/threads)

### n8n Documentation
- [n8n Credentials](https://docs.n8n.io/integrations/builtin/credentials/)
- [HTTP Request Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/)
- [Error Handling](https://docs.n8n.io/workflows/error-handling/)

## 🆘 Support

En cas de problème:
1. Vérifier les logs n8n
2. Tester les credentials individuellement
3. Consulter la documentation de la plateforme
4. Vérifier les quotas/limites
5. Tester avec l'API en direct (Postman/curl)
