
# 🔧 CONFIGURATION FACEBOOK OAUTH - GUIDE COMPLET

## 🚨 PROBLÈME IDENTIFIÉ: "ID d'app non valide"

### ❌ Erreur actuelle
L'erreur Facebook "ID d'app non valide" indique que les variables d'environnement Facebook ne sont pas correctement configurées.

## 🛠️ SOLUTION: CONFIGURATION DES SECRETS REPLIT

### Étape 1: Accéder aux Secrets Replit
1. Dans votre Repl, allez dans **Tools** → **Secrets**
2. Ou cliquez sur **+** et tapez **Secrets**

### Étape 2: Configurer les Secrets Facebook
Ajoutez ces secrets exacts dans Replit:

```
FACEBOOK_CLIENT_ID=1020589259777647
FACEBOOK_CLIENT_SECRET=[VOTRE_SECRET_FACEBOOK]
```

⚠️ **IMPORTANT**: 
- `FACEBOOK_CLIENT_ID` doit être exactement `1020589259777647`
- `FACEBOOK_CLIENT_SECRET` doit être votre secret Facebook réel

### Étape 3: Variables supplémentaires (si manquantes)
```
CLIENT_URL=https://ea57f732-d3d2-4a6c-abd7-fd762841ad5e-00-2z2xyoxnhkmwn.riker.replit.dev
ENCRYPTION_KEY=[GÉNÉRÉ_AUTOMATIQUEMENT]
SESSION_SECRET=[GÉNÉRÉ_AUTOMATIQUEMENT]
```

## 🧪 TESTS EN TEMPS RÉEL

### Test 1: Configuration Facebook
```bash
curl https://ea57f732-d3d2-4a6c-abd7-fd762841ad5e-00-2z2xyoxnhkmwn.riker.replit.dev/api/test/facebook
```

### Test 2: Initiation OAuth Facebook
```bash
curl https://ea57f732-d3d2-4a6c-abd7-fd762841ad5e-00-2z2xyoxnhkmwn.riker.replit.dev/api/oauth/initiate/facebook
```

## 📊 LOGS DE SURVEILLANCE

Les logs suivants apparaîtront dans la console:

```
🔵 [OAUTH] Initiation OAuth pour FACEBOOK
🔍 [FACEBOOK] Validation configuration Facebook...
🔍 [FACEBOOK] CLIENT_ID configuré: ✅ OUI
🔍 [FACEBOOK] CLIENT_SECRET configuré: ✅ OUI
✅ [FACEBOOK] Configuration Facebook validée
✅ [FACEBOOK] App ID: 1020589259777647
✅ [OAUTH] URL OAuth générée avec succès pour FACEBOOK
```

## 🎯 VÉRIFICATION FINALE

1. **Secrets configurés** ✅
2. **App ID validé via Facebook Graph API** ✅
3. **URL OAuth générée** ✅
4. **Logs en temps réel actifs** ✅

## 🔗 URLs importantes à configurer dans Facebook Developers

- **Domaines**: `ea57f732-d3d2-4a6c-abd7-fd762841ad5e-00-2z2xyoxnhkmwn.riker.replit.dev`
- **Redirect URI**: `https://ea57f732-d3d2-4a6c-abd7-fd762841ad5e-00-2z2xyoxnhkmwn.riker.replit.dev/api/oauth/callback`

---

**🎉 Après configuration, votre OAuth Facebook fonctionnera parfaitement!**
