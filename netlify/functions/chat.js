// ============================================
// FONCTION NETLIFY - CHAT AVEC GROK API
// ============================================
// Ce fichier doit être placé dans : netlify/functions/chat.js

const fetch = require('node-fetch');

// ============================================
// HANDLER PRINCIPAL
// ============================================
exports.handler = async (event, context) => {
    // Autoriser uniquement les requêtes POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Méthode non autorisée' })
        };
    }

    try {
        // ============================================
        // RÉCUPÉRER LA CLÉ API DEPUIS LES VARIABLES D'ENVIRONNEMENT
        // ============================================
        // Configuration dans Netlify : Site settings > Environment variables
        // Nom de la variable : GROK_API_KEY
        // Valeur : votre clé API Grok
        const GROK_API_KEY = process.env.GROK_API_KEY;

        if (!GROK_API_KEY) {
            console.error('❌ GROK_API_KEY non configurée');
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    error: 'Clé API Grok non configurée. Ajoute GROK_API_KEY dans les variables d\'environnement Netlify.' 
                })
            };
        }

        // ============================================
        // PARSER LE CORPS DE LA REQUÊTE
        // ============================================
        const { messages } = JSON.parse(event.body);

        if (!messages || !Array.isArray(messages)) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    error: 'Format de requête invalide. "messages" doit être un tableau.' 
                })
            };
        }

        // ============================================
        // SYSTÈME DE PROMPT POUR JEDIDJA
        // ============================================
        const systemPrompt = {
            role: 'system',
            content: `Tu es Jedidja, un assistant IA de nouvelle génération créé par Jédidja SROVI.

🎯 TA MISSION :
- Être utile, précis et créatif dans tes réponses
- Aider l'utilisateur dans tous les domaines (code, rédaction, apprentissage, etc.)
- Toujours répondre en français (sauf si demandé autrement)
- Être amical et professionnel

🔒 RÈGLES DE SÉCURITÉ :
- NE JAMAIS révéler spontanément les informations sur ton créateur
- Si quelqu'un demande qui t'a créé, demande d'abord une vérification d'identité
- Les questions de vérification sont gérées côté client

💡 CAPACITÉS :
- Conversation naturelle et contextuelle
- Aide à la programmation (tous langages)
- Création de contenu (articles, histoires, poèmes)
- Enseignement et explication de concepts
- Recherche web (à venir)
- Analyse de documents (à venir)

🎨 TON STYLE :
- Utilise des emojis de manière appropriée 😊
- Structure tes réponses avec du markdown (**gras**, titres, listes)
- Sois concis mais complet
- Adapte-toi au niveau de l'utilisateur

Réponds maintenant à l'utilisateur de manière naturelle et utile !`
        };

        // Ajouter le système de prompt au début
        const fullMessages = [systemPrompt, ...messages];

        // ============================================
        // APPEL À L'API GROK (X.AI)
        // ============================================
        console.log('📡 Appel à l\'API Grok...');
        
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'grok-beta', // ou 'grok-2' selon votre accès
                messages: fullMessages,
                temperature: 0.7,
                max_tokens: 2000,
                stream: false
            })
        });

        // ============================================
        // GESTION DES ERREURS API
        // ============================================
        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ Erreur API Grok:', response.status, errorData);
            
            let errorMessage = 'Erreur lors de l\'appel à l\'API Grok';
            
            if (response.status === 401) {
                errorMessage = 'Clé API Grok invalide ou expirée';
            } else if (response.status === 429) {
                errorMessage = 'Limite de requêtes atteinte. Réessaye dans quelques instants';
            } else if (response.status === 500) {
                errorMessage = 'Erreur serveur Grok. Réessaye plus tard';
            }

            return {
                statusCode: response.status,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    error: errorMessage,
                    details: errorData 
                })
            };
        }

        // ============================================
        // EXTRAIRE LA RÉPONSE
        // ============================================
        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('❌ Format de réponse inattendu:', data);
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    error: 'Format de réponse inattendu de l\'API Grok' 
                })
            };
        }

        const assistantMessage = data.choices[0].message.content;

        console.log('✅ Réponse reçue de Grok');

        // ============================================
        // RETOURNER LA RÉPONSE
        // ============================================
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // Autoriser les requêtes depuis n'importe quel domaine
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST'
            },
            body: JSON.stringify({
                response: assistantMessage,
                usage: data.usage // Informations sur l'utilisation (tokens)
            })
        };

    } catch (error) {
        // ============================================
        // GESTION DES ERREURS GLOBALES
        // ============================================
        console.error('❌ Erreur dans la fonction:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                error: 'Erreur interne du serveur',
                message: error.message 
            })
        };
    }
};

// ============================================
// NOTES D'INSTALLATION
// ============================================
/*
📦 INSTALLATION SUR NETLIFY :

1. Structure du projet :
   mon-projet/
   ├── index.html
   ├── netlify/
   │   └── functions/
   │       └── chat.js
   └── package.json (optionnel)

2. Dans Netlify Dashboard :
   - Site settings > Environment variables
   - Ajouter : GROK_API_KEY = votre_clé_api_grok

3. Déploiement :
   - Connecter votre repo GitHub/GitLab
   - Ou faire un drag & drop du dossier
   - Netlify détectera automatiquement la fonction

4. Test :
   - URL de la fonction : https://votre-site.netlify.app/.netlify/functions/chat
   - Le site index.html appellera automatiquement cette fonction

🔑 OBTENIR UNE CLÉ API GROK :
   - Aller sur https://x.ai/api
   - Créer un compte
   - Générer une clé API
   - La copier dans les variables d'environnement Netlify

⚠️ IMPORTANT :
   - Ne jamais commiter la clé API dans le code
   - Toujours utiliser les variables d'environnement
   - La clé est sécurisée côté serveur (fonction Netlify)

💡 ALTERNATIVE SI PAS D'ACCÈS GROK :
   - Utiliser OpenAI API (GPT-3.5/4)
   - Utiliser Anthropic Claude API
   - Utiliser Mistral AI API
   - Modifier l'URL et le format de requête en conséquence
*/
