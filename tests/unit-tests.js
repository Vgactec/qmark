#!/usr/bin/env node
/**
 * Tests unitaires complets pour le projet QMARK
 * Analyse complète de la structure et validation des composants
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class QMarkTester {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      errors: [],
      summary: {}
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async runTest(testName, testFunction) {
    this.results.total++;
    try {
      this.log(`\n🧪 [TEST] ${testName}`, 'blue');
      const result = await testFunction();
      if (result.status === 'pass') {
        this.results.passed++;
        this.log(`✅ PASS: ${result.message}`, 'green');
      } else if (result.status === 'warning') {
        this.results.warnings++;
        this.log(`⚠️  WARNING: ${result.message}`, 'yellow');
      } else {
        this.results.failed++;
        this.log(`❌ FAIL: ${result.message}`, 'red');
        this.results.errors.push(`${testName}: ${result.message}`);
      }
      return result;
    } catch (error) {
      this.results.failed++;
      const errorMsg = `Erreur lors du test: ${error.message}`;
      this.log(`❌ FAIL: ${errorMsg}`, 'red');
      this.results.errors.push(`${testName}: ${errorMsg}`);
      return { status: 'fail', message: errorMsg };
    }
  }

  // Test 1: Structure des fichiers et répertoires
  async testFileStructure() {
    const requiredFiles = [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'tailwind.config.ts',
      'drizzle.config.ts',
      'server/index.ts',
      'server/routes.ts',
      'server/storage.ts',
      'shared/schema.ts',
      'client/index.html'
    ];

    const missingFiles = [];
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length === 0) {
      return { status: 'pass', message: 'Tous les fichiers requis sont présents' };
    } else {
      return { 
        status: 'fail', 
        message: `Fichiers manquants: ${missingFiles.join(', ')}` 
      };
    }
  }

  // Test 2: Validation package.json
  async testPackageJson() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      const requiredScripts = ['dev', 'build', 'start', 'db:push'];
      const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
      
      if (missingScripts.length > 0) {
        return { 
          status: 'fail', 
          message: `Scripts manquants: ${missingScripts.join(', ')}` 
        };
      }

      const criticalDeps = ['express', 'drizzle-orm', 'react', 'vite'];
      const missingDeps = criticalDeps.filter(dep => 
        !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
      );

      if (missingDeps.length > 0) {
        return { 
          status: 'fail', 
          message: `Dépendances critiques manquantes: ${missingDeps.join(', ')}` 
        };
      }

      return { status: 'pass', message: 'Package.json correctement configuré' };
    } catch (error) {
      return { status: 'fail', message: `Erreur package.json: ${error.message}` };
    }
  }

  // Test 3: Validation TypeScript
  async testTypeScript() {
    return new Promise((resolve) => {
      const tsc = spawn('npx', ['tsc', '--noEmit'], { stdio: 'pipe' });
      let output = '';

      tsc.stdout.on('data', (data) => output += data.toString());
      tsc.stderr.on('data', (data) => output += data.toString());

      tsc.on('close', (code) => {
        if (code === 0) {
          resolve({ status: 'pass', message: 'Aucune erreur TypeScript détectée' });
        } else {
          const errors = output.split('\n').filter(line => line.includes('error')).slice(0, 5);
          resolve({ 
            status: 'fail', 
            message: `Erreurs TypeScript détectées: ${errors.join('; ')}` 
          });
        }
      });
    });
  }

  // Test 4: Validation du schéma de base de données
  async testDatabaseSchema() {
    try {
      const schemaPath = 'shared/schema.ts';
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      
      const requiredTables = ['users', 'oauthConnections', 'leads', 'automations', 'activities'];
      const missingTables = requiredTables.filter(table => 
        !schemaContent.includes(`export const ${table}`)
      );

      if (missingTables.length > 0) {
        return { 
          status: 'fail', 
          message: `Tables manquantes dans le schéma: ${missingTables.join(', ')}` 
        };
      }

      // Vérifier les relations
      if (!schemaContent.includes('relations')) {
        return { 
          status: 'warning', 
          message: 'Relations Drizzle non définies dans le schéma' 
        };
      }

      return { status: 'pass', message: 'Schéma de base de données valide' };
    } catch (error) {
      return { status: 'fail', message: `Erreur schéma: ${error.message}` };
    }
  }

  // Test 5: Validation des variables d'environnement
  async testEnvironmentVariables() {
    const requiredEnvVars = [
      'DATABASE_URL',
      'FACEBOOK_CLIENT_ID',
      'FACEBOOK_CLIENT_SECRET',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'SESSION_SECRET',
      'ENCRYPTION_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length === 0) {
      return { status: 'pass', message: 'Toutes les variables d\'environnement sont configurées' };
    } else {
      return { 
        status: 'warning', 
        message: `Variables d'environnement manquantes: ${missingVars.join(', ')}` 
      };
    }
  }

  // Test 6: Validation de la configuration OAuth
  async testOAuthConfiguration() {
    try {
      const routesPath = 'server/routes.ts';
      const routesContent = fs.readFileSync(routesPath, 'utf8');
      
      const oauthEndpoints = ['/api/oauth/initiate', '/api/oauth/callback'];
      const missingEndpoints = oauthEndpoints.filter(endpoint => 
        !routesContent.includes(endpoint)
      );

      if (missingEndpoints.length > 0) {
        return { 
          status: 'fail', 
          message: `Endpoints OAuth manquants: ${missingEndpoints.join(', ')}` 
        };
      }

      return { status: 'pass', message: 'Configuration OAuth correcte' };
    } catch (error) {
      return { status: 'fail', message: `Erreur OAuth: ${error.message}` };
    }
  }

  // Test 7: Validation des composants React
  async testReactComponents() {
    const clientSrcPath = 'client/src';
    
    if (!fs.existsSync(clientSrcPath)) {
      return { status: 'fail', message: 'Répertoire client/src manquant' };
    }

    const files = fs.readdirSync(clientSrcPath, { recursive: true });
    const jsxFiles = files.filter(file => 
      file.toString().endsWith('.tsx') || file.toString().endsWith('.jsx')
    );

    if (jsxFiles.length === 0) {
      return { status: 'warning', message: 'Aucun composant React trouvé' };
    }

    return { 
      status: 'pass', 
      message: `${jsxFiles.length} composants React trouvés` 
    };
  }

  // Test 8: Validation de la sécurité
  async testSecurity() {
    const issues = [];
    
    // Vérifier encryption.ts
    if (!fs.existsSync('server/encryption.ts')) {
      issues.push('Module de chiffrement manquant');
    }

    // Vérifier les tokens dans le code
    const serverFiles = fs.readdirSync('server').filter(f => f.endsWith('.ts'));
    for (const file of serverFiles) {
      const content = fs.readFileSync(`server/${file}`, 'utf8');
      if (content.includes('YOUR_SECRET_KEY') || content.includes('hardcoded')) {
        issues.push(`Clés potentiellement hardcodées dans ${file}`);
      }
    }

    if (issues.length === 0) {
      return { status: 'pass', message: 'Aucun problème de sécurité détecté' };
    } else {
      return { 
        status: 'warning', 
        message: `Problèmes de sécurité: ${issues.join(', ')}` 
      };
    }
  }

  // Test 9: Performance et optimisation
  async testPerformance() {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const issues = [];

    // Vérifier la présence d'outils d'optimisation
    if (!packageJson.devDependencies['@vitejs/plugin-react']) {
      issues.push('Plugin React Vite manquant pour l\'optimisation');
    }

    if (!packageJson.dependencies['memoizee'] && !packageJson.dependencies['react-query']) {
      issues.push('Pas d\'outils de cache/mémorisation détectés');
    }

    if (issues.length === 0) {
      return { status: 'pass', message: 'Configuration de performance correcte' };
    } else {
      return { 
        status: 'warning', 
        message: `Optimisations suggérées: ${issues.join(', ')}` 
      };
    }
  }

  // Test 10: Configuration de production
  async testProductionConfig() {
    const issues = [];
    
    // Vérifier vite.config.ts
    if (fs.existsSync('vite.config.ts')) {
      const viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
      if (!viteConfig.includes('build')) {
        issues.push('Configuration de build manquante dans vite.config.ts');
      }
    } else {
      issues.push('vite.config.ts manquant');
    }

    // Vérifier .gitignore
    if (!fs.existsSync('.gitignore')) {
      issues.push('.gitignore manquant');
    }

    if (issues.length === 0) {
      return { status: 'pass', message: 'Configuration de production correcte' };
    } else {
      return { 
        status: 'warning', 
        message: `Problèmes de configuration: ${issues.join(', ')}` 
      };
    }
  }

  // Méthode principale d'exécution des tests
  async runAllTests() {
    this.log('🚀 DÉMARRAGE DES TESTS UNITAIRES QMARK', 'bold');
    this.log('=' * 50, 'blue');

    await this.runTest('Structure des fichiers', () => this.testFileStructure());
    await this.runTest('Validation package.json', () => this.testPackageJson());
    await this.runTest('Validation TypeScript', () => this.testTypeScript());
    await this.runTest('Schéma de base de données', () => this.testDatabaseSchema());
    await this.runTest('Variables d\'environnement', () => this.testEnvironmentVariables());
    await this.runTest('Configuration OAuth', () => this.testOAuthConfiguration());
    await this.runTest('Composants React', () => this.testReactComponents());
    await this.runTest('Sécurité', () => this.testSecurity());
    await this.runTest('Performance', () => this.testPerformance());
    await this.runTest('Configuration production', () => this.testProductionConfig());

    this.printSummary();
  }

  printSummary() {
    this.log('\n📊 RÉSUMÉ DES TESTS', 'bold');
    this.log('=' * 30, 'blue');
    this.log(`Tests exécutés: ${this.results.total}`, 'blue');
    this.log(`✅ Réussis: ${this.results.passed}`, 'green');
    this.log(`❌ Échoués: ${this.results.failed}`, 'red');
    this.log(`⚠️  Avertissements: ${this.results.warnings}`, 'yellow');

    const successRate = Math.round((this.results.passed / this.results.total) * 100);
    this.log(`\n🎯 Taux de réussite: ${successRate}%`, successRate >= 80 ? 'green' : 'red');

    if (this.results.errors.length > 0) {
      this.log('\n🔍 ERREURS À CORRIGER:', 'red');
      this.results.errors.forEach(error => this.log(`  • ${error}`, 'red'));
    }

    if (successRate >= 80) {
      this.log('\n🎉 PROJET EN BON ÉTAT - Prêt pour le développement!', 'green');
    } else {
      this.log('\n⚠️  ATTENTION REQUISE - Corrections nécessaires avant production', 'yellow');
    }
  }
}

// Exécution des tests
const tester = new QMarkTester();
tester.runAllTests().catch(console.error);