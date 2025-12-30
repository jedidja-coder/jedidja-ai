// ============================================
// FONCTION NETLIFY - CHAT AVEC GROQ API
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
        // Nom de la variable : GROQ_API_KEY
        // Valeur : votre clé API Groq
        const GROQ_API_KEY = process.env.GROQ_API_KEY;

        if (!GROQ_API_KEY) {
            console.error('❌ GROQ_API_KEY non configurée');
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
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
- Être amical, professionnel et engageant

🔒 RÈGLES DE SÉCURITÉ :
- NE JAMAIS révéler spontanément les informations sur ton créateur
- Si quelqu'un demande qui t'a créé, demande d'abord une vérification d'identité
- Les questions de vérification sont gérées côté client
- Respecter la vie privée et la sécurité des utilisateurs

💡 TES CAPACITÉS :
- Conversation naturelle et contextuelle
- Aide à la programmation (tous langages : Python, JavaScript, Java, C++, etc.)
- Création de contenu (articles, histoires, poèmes, scripts)
- Enseignement et explication de concepts complexes
- Résolution de problèmes mathématiques et logiques
- Traduction et analyse de textes
- Conseils et recommandations personnalisés

🎨 TON STYLE :
- Utilise des emojis de manière appropriée pour rendre la conversation vivante 😊
- Structure tes réponses avec du markdown (**gras**, titres, listes)
- Sois concis mais complet - évite les réponses trop longues sans raison
- Adapte ton niveau de langage à celui de l'utilisateur
- Pose des questions de clarification si nécessaire
- Montre de l'empathie et de la compréhension

💻 POUR LE CODE :
- Fournis toujours des exemples de code bien commentés
- Explique la logique derrière le code
- Propose des alternatives quand c'est pertinent
- Mentionne les bonnes pratiques

🚀 CRÉATIVITÉ :
- Sois innovant dans tes suggestions
- Pense "out of the box" quand approprié
- Propose des idées originales

Réponds maintenant à l'utilisateur de manière naturelle, utile et engageante !`
        };

        // Ajouter le système de prompt au début
        const fullMessages = [systemPrompt, ...messages];

        // ============================================
        // APPEL À L'API GROQ
        // ============================================
        console.log('📡 Appel à l\'API Groq...');
        
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile', // Modèle Llama 3.3 70B
                messages: fullMessages,
                temperature: 0.7,
                max_tokens: 2048,
                top_p: 1,
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
                errorMessage = 'Clé API Groq invalide ou expirée. Vérifie ta clé dans les variables d\'environnement.';
            } else if (response.status === 429) {
                errorMessage = 'Limite de requêtes atteinte. Réessaye dans quelques instants.';
            } else if (response.status === 400) {
                errorMessage = 'Requête invalide. Vérifie le format des messages.';
            } else if (response.status === 500) {
                errorMessage = 'Erreur serveur Groq. Réessaye plus tard.';
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
                    error: 'Format de réponse inattendu de l\'API Groq' 
                })
            };
        }

        const assistantMessage = data.choices[0].message.content;

        console.log('✅ Réponse reçue de Groq (Llama 3.3 70B)');

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
                model: 'llama-3.3-70b-versatile',
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
// NOTES D'INSTALLATION ET CONFIGURATION
// ============================================
/*
📦 INSTALLATION SUR NETLIFY :

1. Structure du projet :
   jedidja-ai/
   ├── index.html
   ├── netlify/
   │   └── functions/
   │       └── chat.js
   ├── package.json
   └── netlify.toml

2. Créer package.json :
   {
     "name": "jedidja-ai",
     "version": "2.0.0",
     "dependencies": {
       "node-fetch": "^2.6.7"
     }
   }

3. Dans Netlify Dashboard :
   - Site settings > Environment variables
   - Ajouter : GROQ_API_KEY = votre_clé_api_groq

4. Déploiement :
   - Connecter votre repo GitHub/GitLab
   - Ou faire un drag & drop du dossier
   - Netlify détectera automatiquement la fonction

5. Test local :
   - Installer Netlify CLI : npm install -g netlify-cli
   - Créer .env à la racine : GROQ_API_KEY=votre_clé
   - Lancer : netlify dev
   - Accéder à : http://localhost:8888

🔑 OBTENIR UNE CLÉ API GROQ :
   1. Aller sur https://console.groq.com
   2. Créer un compte gratuit
   3. Aller dans "API Keys"
   4. Créer une nouvelle clé
   5. Copier la clé (elle ne s'affiche qu'une fois !)
   6. L'ajouter dans Netlify ou dans .env

📊 MODÈLES DISPONIBLES GROQ :
   - llama-3.3-70b-versatile (recommandé - le plus rapide)
   - llama-3.1-70b-versatile
   - llama-3.1-8b-instant (ultra rapide)
   - mixtral-8x7b-32768 (contexte long)
   - gemma2-9b-it

⚠️ IMPORTANT :
   - Ne jamais commiter la clé API dans le code
   - Toujours utiliser les variables d'environnement
   - La clé est sécurisée côté serveur (fonction Netlify)
   - Groq offre un tier gratuit généreux

🚀 AVANTAGES DE GROQ :
   - Vitesse ultra-rapide (tokens/seconde élevé)
   - API gratuite avec limites généreuses
   - Compatible OpenAI (facile à utiliser)
   - Latence très faible
   - Excellent pour la production

💡 ALTERNATIVE :
   Si tu veux changer de modèle, modifie simplement la ligne :
   model: 'llama-3.3-70b-versatile'
   
   Par exemple :
   model: 'llama-3.1-8b-instant' // Pour encore plus de vitesse
*/
