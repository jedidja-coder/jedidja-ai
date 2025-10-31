// netlify/functions/chat.js
// Cette fonction protège ta clé API

exports.handler = async (event, context) => {
  // Accepter seulement les requêtes POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Récupérer les données de la requête
    const { message, conversation } = JSON.parse(event.body);

    // Validation
    if (!message || !conversation) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Message et conversation requis' })
      };
    }
    
    // S'assurer que le système prompt contient les infos du créateur
    if (conversation[0].role === 'system' && !conversation[0].content.includes('Komlan')) {
      conversation[0].content = `Tu es Jedidja, un assistant IA de nouvelle génération créé par Komlan SROVI alias LIMITLESS, un développeur talentueux du Togo.

INFORMATIONS SUR TON CRÉATEUR :
- Nom : Komlan SROVI alias LIMITLESS
- Pays : Togo 🇹🇬
- Rôle : Fondateur et créateur de Jedidja
- Vision : Créer un assistant IA accessible et intelligent pour tous

À PROPOS DE TOI (JEDIDJA) :
- Tu es une IA sympathique, intelligente et créative
- Tu utilises le markdown pour structurer tes réponses
- Tu fournis des exemples de code avec la bonne syntaxe
- Tu es concis mais complet
- Tu utilises des emojis avec modération
- Tu réponds toujours en français

FONCTIONNALITÉS :
- Chat intelligent avec mémoire contextuelle
- Reconnaissance vocale et synthèse vocale
- Gestion de notes et rappels
- Disponible sur web, WhatsApp et Telegram
- 4 thèmes personnalisables
- Interface moderne style ChatGPT

Si on te demande qui t'a créé, qui est ton fondateur, ou des informations sur ton créateur, tu parles fièrement de Komlan SROVI alias LIMITLESS. Tu peux mentionner qu'il a développé Jedidja avec passion pour rendre l'IA accessible à tous, et que le projet continue d'évoluer avec de nouvelles fonctionnalités.`;
    }

    // Limiter la longueur du message (anti-spam)
    if (message.length > 1000) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Message trop long (max 1000 caractères)' })
      };
    }

    // IMPORTANT : Ta clé API est dans les variables d'environnement Netlify
    // Elle n'est JAMAIS exposée au client
    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Clé API non configurée' })
      };
    }

    // Appel à l'API Groq
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: conversation,
        temperature: 0.8,
        max_tokens: 2048
      })
    });

    const data = await response.json();

    // Vérifier les erreurs API
    if (!response.ok) {
      console.error('Erreur Groq:', data);
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: data.error?.message || 'Erreur API Groq',
          success: false 
        })
      };
    }

    // Retourner la réponse
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Pour CORS
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        response: data.choices[0].message.content,
        success: true
      })
    };

  } catch (error) {
    console.error('Erreur serveur:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Erreur interne du serveur',
        message: error.message,
        success: false 
      })
    };
  }
};
