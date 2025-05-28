
#!/usr/bin/env node
/**
 * Script de mise à jour automatique des rapports de configuration
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.CLIENT_URL || 'http://localhost:5000';

async function updateReports() {
  console.log('🔄 [REPORT UPDATER] Début mise à jour des rapports...');
  
  try {
    // 1. Valider toutes les APIs
    console.log('📡 [REPORT UPDATER] Validation des APIs...');
    const response = await fetch(`${BASE_URL}/api/validate/all`);
    const report = await response.json();
    
    console.log(`📊 [REPORT UPDATER] Résultat: ${report.overall} (${report.summary.passed}/${report.summary.total} tests passés)`);
    
    // 2. Générer le nouveau rapport
    const newReport = generateUpdatedReport(report);
    
    // 3. Mettre à jour RAPPORT_CONFIGURATION_OAUTH.md
    const reportPath = 'RAPPORT_CONFIGURATION_OAUTH.md';
    fs.writeFileSync(reportPath, newReport);
    console.log(`✅ [REPORT UPDATER] ${reportPath} mis à jour`);
    
    // 4. Générer rapport de diagnostic
    const diagnosticReport = generateDiagnosticReport(report);
    const diagnosticPath = 'DIAGNOSTIC_APIS_TEMPS_REEL.md';
    fs.writeFileSync(diagnosticPath, diagnosticReport);
    console.log(`✅ [REPORT UPDATER] ${diagnosticPath} créé`);
    
    // 5. Mise à jour configuration Facebook si nécessaire
    const facebookTest = report.tests.find(t => t.service === 'Facebook API');
    if (facebookTest && facebookTest.status !== 'PASS') {
      const facebookConfig = generateFacebookConfigUpdate(facebookTest);
      fs.writeFileSync('CONFIGURATION_FACEBOOK_OAUTH.md', facebookConfig);
      console.log(`⚠️ [REPORT UPDATER] Configuration Facebook mise à jour avec diagnostic`);
    }
    
    console.log('🎉 [REPORT UPDATER] Tous les rapports ont été mis à jour!');
    
  } catch (error) {
    console.error('❌ [REPORT UPDATER] Erreur:', error);
    process.exit(1);
  }
}

function generateUpdatedReport(validationReport) {
  const timestamp = new Date().toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const statusEmoji = validationReport.overall === 'PASS' ? '🎉' : 
                     validationReport.overall === 'WARNING' ? '⚠️' : '❌';
  
  const statusText = validationReport.overall === 'PASS' ? 'ENTIÈREMENT OPÉRATIONNEL' :
                    validationReport.overall === 'WARNING' ? 'PARTIELLEMENT OPÉRATIONNEL' : 'NÉCESSITE CORRECTIONS';

  return `# ${statusEmoji} RAPPORT FINAL - SYSTÈME QMARK SAAS ${statusText}

## ✅ STATUT GLOBAL: ${validationReport.overall}

**Date de validation finale**: ${timestamp}  
**Tests automatisés**: ${validationReport.summary.passed}/${validationReport.summary.total} tests réussis  
**Taux de réussite**: ${Math.round((validationReport.summary.passed / validationReport.summary.total) * 100)}%  
**Résultat**: ${statusText}

---

## 🧪 RÉSULTATS DE VALIDATION EN TEMPS RÉEL

### Tests Exécutés Automatiquement
${validationReport.tests.map(test => {
  const emoji = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
  return `**${emoji} ${test.service}**: ${test.message}`;
}).join('\n')}

### Détails Techniques
\`\`\`json
${JSON.stringify(validationReport.summary, null, 2)}
\`\`\`

---

## 🔧 COMPOSANTS VALIDÉS

${validationReport.tests.map(test => {
  if (test.status === 'PASS') {
    return `### ${test.service} ✅ VALIDÉ
- **Statut**: ${test.message}
- **Détails**: ${JSON.stringify(test.details, null, 2)}
- **Timestamp**: ${test.timestamp}`;
  }
  return '';
}).filter(Boolean).join('\n\n')}

---

## ⚠️ PROBLÈMES DÉTECTÉS

${validationReport.tests.filter(test => test.status !== 'PASS').map(test => {
  const emoji = test.status === 'FAIL' ? '❌' : '⚠️';
  return `### ${emoji} ${test.service}
- **Problème**: ${test.message}
- **Détails**: ${JSON.stringify(test.details, null, 2)}`;
}).join('\n\n')}

---

## 🛠️ RECOMMANDATIONS

${validationReport.recommendations.length > 0 ? 
validationReport.recommendations.map(rec => `- ${rec}`).join('\n') : 
'✅ Aucune recommandation - Système optimal'}

---

## 📊 MÉTRIQUES DE PERFORMANCE

- **Tests totaux**: ${validationReport.summary.total}
- **Tests réussis**: ${validationReport.summary.passed}
- **Tests échoués**: ${validationReport.summary.failed}
- **Avertissements**: ${validationReport.summary.warnings}
- **Taux de réussite**: ${Math.round((validationReport.summary.passed / validationReport.summary.total) * 100)}%

---

**🎯 RAPPORT GÉNÉRÉ AUTOMATIQUEMENT LE ${timestamp}**

*Système de validation en temps réel - QMARK SaaS Platform*
`;
}

function generateDiagnosticReport(validationReport) {
  const timestamp = new Date().toLocaleString('fr-FR');
  
  return `# 🔍 DIAGNOSTIC APIS EN TEMPS RÉEL - ${timestamp}

## 📊 RÉSUMÉ EXÉCUTIF

**Statut Global**: ${validationReport.overall}  
**Tests Exécutés**: ${validationReport.summary.total}  
**Réussis**: ${validationReport.summary.passed}  
**Échoués**: ${validationReport.summary.failed}  
**Avertissements**: ${validationReport.summary.warnings}  

---

## 🧪 RÉSULTATS DÉTAILLÉS PAR SERVICE

${validationReport.tests.map(test => {
  const emoji = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
  return `### ${emoji} ${test.service}

**Message**: ${test.message}  
**Statut**: ${test.status}  
**Timestamp**: ${test.timestamp}  

**Détails techniques**:
\`\`\`json
${JSON.stringify(test.details, null, 2)}
\`\`\`

---`;
}).join('\n')}

## 🎯 ACTIONS RECOMMANDÉES

${validationReport.recommendations.length > 0 ?
validationReport.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n') :
'✅ Aucune action requise - Tous les services fonctionnent correctement'}

---

**Diagnostic généré automatiquement le ${timestamp}**
`;
}

function generateFacebookConfigUpdate(facebookTest) {
  return `# 🔧 CONFIGURATION FACEBOOK OAUTH - DIAGNOSTIC TEMPS RÉEL

## ❌ PROBLÈME DÉTECTÉ

**Statut**: ${facebookTest.status}  
**Message**: ${facebookTest.message}  

**Détails de l'erreur**:
\`\`\`json
${JSON.stringify(facebookTest.details, null, 2)}
\`\`\`

## 🛠️ SOLUTION IMMÉDIATE

### 1. Vérifier les Variables d'Environnement
- Accédez aux **Secrets** dans Replit
- Configurez exactement:
  - \`FACEBOOK_CLIENT_ID=1020589259777647\`
  - \`FACEBOOK_CLIENT_SECRET=[VOTRE_SECRET_RÉEL]\`

### 2. Validation de l'App ID
- L'App ID doit être numérique
- Vérifiez dans Facebook Developers Console

### 3. Test de Validation
Utilisez cet endpoint pour retester:
\`\`\`
curl ${process.env.CLIENT_URL || 'http://localhost:5000'}/api/test/facebook
\`\`\`

---

**Diagnostic généré automatiquement - ${new Date().toLocaleString('fr-FR')}**
`;
}

// Exécution du script
updateReports().catch(console.error);
