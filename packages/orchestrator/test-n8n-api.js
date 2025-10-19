/**
 * Script de test pour vérifier les appels API N8N réels
 * Ce script teste si les suppressions de workflows fonctionnent vraiment
 */

const axios = require('axios');

// Configuration depuis les variables d'environnement
const N8N_URL = process.env.N8N_API_URL || 'https://n8n.kaussan-air.org';
const N8N_API_KEY = process.env.N8N_API_KEY;

console.log('🔍 Test N8N API Configuration:');
console.log('URL:', N8N_URL);
console.log('API Key:', N8N_API_KEY ? `${N8N_API_KEY.substring(0, 10)}...` : 'NON CONFIGURÉE ❌');

async function testN8NConnection() {
    console.log('\n📡 Test 1: Connexion et liste des workflows...');
    
    try {
        const response = await axios.get(`${N8N_URL}/api/v1/workflows`, {
            headers: {
                'X-N8N-API-KEY': N8N_API_KEY
            },
            timeout: 10000
        });
        
        console.log('✅ Connexion réussie!');
        console.log(`📋 Nombre de workflows: ${response.data.data.length}`);
        
        // Afficher les premiers workflows
        console.log('\n📝 Workflows disponibles:');
        response.data.data.slice(0, 10).forEach(wf => {
            console.log(`  - ${wf.id}: ${wf.name} (${wf.active ? 'Actif' : 'Inactif'})`);
        });
        
        return response.data.data;
    } catch (error) {
        console.error('❌ Erreur connexion:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
        return null;
    }
}

async function testWorkflowDeletion(workflowId) {
    console.log(`\n🗑️ Test 2: Suppression du workflow ${workflowId}...`);
    
    try {
        // 1. Vérifier que le workflow existe
        console.log('   Étape 1: Vérification existence...');
        const getResponse = await axios.get(`${N8N_URL}/api/v1/workflows/${workflowId}`, {
            headers: {
                'X-N8N-API-KEY': N8N_API_KEY
            },
            timeout: 10000
        });
        
        const workflowName = getResponse.data.name;
        console.log(`   ✅ Workflow trouvé: "${workflowName}"`);
        
        // 2. Supprimer le workflow
        console.log('   Étape 2: Suppression...');
        const deleteResponse = await axios.delete(`${N8N_URL}/api/v1/workflows/${workflowId}`, {
            headers: {
                'X-N8N-API-KEY': N8N_API_KEY
            },
            timeout: 10000
        });
        
        console.log(`   ✅ Réponse DELETE: Status ${deleteResponse.status}`);
        console.log('   Data:', JSON.stringify(deleteResponse.data, null, 2));
        
        // 3. VÉRIFICATION CRITIQUE: Le workflow est-il vraiment supprimé?
        console.log('   Étape 3: Vérification suppression (devrait retourner 404)...');
        try {
            await axios.get(`${N8N_URL}/api/v1/workflows/${workflowId}`, {
                headers: {
                    'X-N8N-API-KEY': N8N_API_KEY
                },
                timeout: 10000
            });
            
            console.error('   ❌ PROBLÈME CRITIQUE: Le workflow existe encore après suppression!');
            console.error('   🚨 C\'est pourquoi l\'utilisateur dit que ça ne marche pas!');
            return false;
            
        } catch (verifyError) {
            if (verifyError.response?.status === 404) {
                console.log('   ✅ VÉRIFICATION RÉUSSIE: Workflow vraiment supprimé (404)');
                return true;
            } else {
                console.error('   ⚠️ Erreur vérification:', verifyError.message);
                return false;
            }
        }
        
    } catch (error) {
        console.error('   ❌ Erreur lors de la suppression:');
        console.error('      Message:', error.message);
        if (error.response) {
            console.error('      Status:', error.response.status);
            console.error('      Data:', JSON.stringify(error.response.data, null, 2));
        }
        if (error.code) {
            console.error('      Code:', error.code);
        }
        return false;
    }
}

async function runTests() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🧪 TEST DIAGNOSTIC N8N API');
    console.log('   Objectif: Comprendre pourquoi les suppressions échouent');
    console.log('═══════════════════════════════════════════════════════\n');
    
    if (!N8N_API_KEY) {
        console.error('❌ ERREUR FATALE: N8N_API_KEY non configurée!');
        console.error('   Ceci explique pourquoi les suppressions ne marchent pas.');
        console.error('   Solution: Configurer N8N_API_KEY dans Coolify');
        process.exit(1);
    }
    
    // Test 1: Connexion
    const workflows = await testN8NConnection();
    
    if (!workflows || workflows.length === 0) {
        console.log('\n⚠️ Aucun workflow disponible pour tester la suppression');
        return;
    }
    
    // Test 2: Suppression d'un workflow spécifique
    // Utiliser l'ID fourni par l'utilisateur ou le premier de la liste
    const testWorkflowId = process.argv[2] || workflows[0].id;
    
    console.log(`\n🎯 Test de suppression sur workflow: ${testWorkflowId}`);
    console.log('   (Passez un ID en argument pour tester un workflow spécifique)');
    
    const success = await testWorkflowDeletion(testWorkflowId);
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 RÉSULTAT DU TEST:');
    console.log('═══════════════════════════════════════════════════════');
    
    if (success) {
        console.log('✅ Les suppressions N8N fonctionnent correctement!');
        console.log('   Le problème pourrait être ailleurs (vérification manquante, etc.)');
    } else {
        console.log('❌ Les suppressions N8N NE FONCTIONNENT PAS!');
        console.log('   C\'est pourquoi l\'utilisateur voit les workflows encore présents.');
        console.log('\n🔧 Solutions possibles:');
        console.log('   1. Vérifier les permissions de l\'API key');
        console.log('   2. Vérifier le format de l\'URL API');
        console.log('   3. Ajouter une vérification après chaque suppression');
    }
    
    console.log('\n💡 Recommandation: Ajouter une vérification systématique après chaque');
    console.log('   opération DELETE pour confirmer que le workflow n\'existe plus.');
}

// Exécuter les tests
runTests().catch(error => {
    console.error('\n💥 ERREUR FATALE:', error);
    process.exit(1);
});
