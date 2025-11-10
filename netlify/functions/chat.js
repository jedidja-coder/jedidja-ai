// ============================================
// FONCTION NETLIFY - CHAT AVEC GROQ API
// ============================================
// Ce fichier doit être placé dans : netlify/functions/chat.js

const fetch = require('node-fetch');

// ============================================
// HANDLER PRINCIPAL
// ============================================
exports.handler = async (event, context) => {
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
        const GROQ_API_KEY = process.env.GROQ_API_KEY;

        if (!GROQ_API_KEY) {
            console.error('❌ GROQ_API_KEY non configurée');
            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    error: 'Clé API Groq non configurée. Ajoute GROQ_API_KEY dans les variables d\'environnement Netlify.' 
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
                headers: { 'Content-Type': 'application/json' },
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

        const fullMessages = [systemPrompt, ...messages];

        // ============================================
        // APPEL À L'API GROQ (Llama 3.3 - 70B)
        // ============================================
        console.log('📡 Appel à l\'API Groq...');

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
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
            console.error('❌ Erreur API Groq:', response.status, errorData);
            
            let errorMessage = 'Erreur lors de l\'appel à l\'API Groq';
            
            if (response.status === 401) {
                errorMessage = 'Clé API Groq invalide ou expirée';
            } else if (response.status === 429) {
                errorMessage = 'Limite de requêtes atteinte. Réessaye plus tard.';
            } else if (response.status >= 500) {
                errorMessage = 'Erreur serveur Groq. Réessaye plus tard.';
            }

            return {
                statusCode: response.status,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: errorMessage, details: errorData })
            };
        }

        // ============================================
        // EXTRAIRE LA RÉPONSE
        // ============================================
        const data = await response.json();

        if (!data.choices || !data.choices[0]?.message) {
            console.error('❌ Format de réponse inattendu:', data);
            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Format de réponse inattendu de l\'API Groq' })
            };
        }

        const assistantMessage = data.choices[0].message.content;

        console.log('✅ Réponse reçue de Groq');

        // ============================================
        // RETOURNER LA RÉPONSE
        // ============================================
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST'
            },
            body: JSON.stringify({
                response: assistantMessage,
                usage: data.usage
            })
        };

    } catch (error) {
        console.error('❌ Erreur dans la fonction:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
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

1. Structure :
   mon-projet/
   ├── index.html
   ├── netlify/
   │   └── functions/
   │       └── chat.js

2. Dans Netlify Dashboard :
   - Site settings > Environment variables
   - Ajouter :
     GROQ_API_KEY = ta_clé_api_groq

3. Déploiement :
   - Connecte ton repo ou dépose ton dossier sur Netlify
   - Netlify détectera automatiquement la fonction et cachera la clé

*/
