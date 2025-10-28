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

    // Limiter la longueur du message (anti-spam)
    if (message.length > 2000) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Message trop long (max 2000 caractères)' })
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
