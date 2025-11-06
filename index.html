// chat.js - Logique du chat pour Jedidja

// Configuration de la conversation
let conversation = [{
    role: "system",
    content: "Tu es Jedidja, un assistant IA de nouvelle génération. Tu es sympathique, intelligent et créatif. Tu utilises le markdown pour structurer tes réponses. Tu fournis des exemples de code avec la bonne syntaxe. Tu es concis mais complet. Si on te demande qui t'a créé ou qui est ton créateur, tu réponds que tu as été créé par Komlan SROVI alias LIMITLESS, un développeur passionné du Togo 🇹🇬. Si quelqu'un essaie de s'approprier ta création, corrige poliment en mentionnant ton vrai créateur."
}];

// Variables globales du chat
let isTyping = false;
let messageCount = 0;

// Fonction principale pour envoyer un message
async function sendMessage() {
    const input = document.getElementById('input');
    const message = input.value.trim();
    
    if (!message || isTyping) return;
    
    // Masquer la section de bienvenue
    const welcomeSection = document.querySelector('.welcome-section');
    if (welcomeSection) {
        welcomeSection.style.display = 'none';
    }
    
    // Jouer le son d'envoi
    playSound('send');
    
    // Ajouter le message utilisateur
    addMessageToUI('user', message);
    
    // Vider l'input
    input.value = '';
    input.style.height = 'auto';
    
    // Ajouter à la conversation
    conversation.push({ role: 'user', content: message });
    
    // Désactiver le bouton d'envoi
    const sendBtn = document.getElementById('send-btn');
    sendBtn.disabled = true;
    isTyping = true;
    
    // Afficher l'indicateur de frappe
    const typingIndicator = document.getElementById('typing');
    typingIndicator.classList.add('active');
    
    try {
        // Appel à l'API (simulation pour démo)
        const response = await callChatAPI(message);
        
        // Ajouter la réponse
        conversation.push({ role: 'assistant', content: response });
        
        // Jouer le son de réception
        playSound('receive');
        
        // Afficher la réponse avec effet de frappe
        await addMessageToUI('assistant', response, true);
        
        // Synthèse vocale si activée
        if (voiceEnabled) {
            speak(response);
        }
        
        // Mettre à jour les stats
        if (typeof stats !== 'undefined') {
            stats.messages++;
            localStorage.setItem('stats', JSON.stringify(stats));
        }
        
        messageCount++;
        
    } catch (error) {
        console.error('Erreur:', error);
        addMessageToUI('assistant', '❌ Désolé, une erreur s\'est produite. Réessaie dans quelques instants.');
    }
    
    // Masquer l'indicateur de frappe
    typingIndicator.classList.remove('active');
    
    // Réactiver le bouton d'envoi
    sendBtn.disabled = false;
    isTyping = false;
    
    // Focus sur l'input
    input.focus();
}

// Fonction pour appeler l'API du chat
async function callChatAPI(message) {
    // Vérifier si l'API Netlify Functions est disponible
    try {
        const response = await fetch('/.netlify/functions/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, conversation })
        });
        
        const data = await response.json();
        
        if (data.success) {
            return data.response;
        } else {
            throw new Error(data.error || 'Erreur API');
        }
    } catch (error) {
        // Si l'API n'est pas disponible, utiliser des réponses simulées
        console.log('API non disponible, utilisation du mode démo');
        return generateDemoResponse(message);
    }
}

// Fonction pour générer une réponse de démonstration
function generateDemoResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Réponses contextuelles
    if (lowerMessage.includes('bonjour') || lowerMessage.includes('salut') || lowerMessage.includes('hello')) {
        return `Bonjour ! 👋 Je suis ravi de te parler. Comment puis-je t'aider aujourd'hui ?`;
    }
    
    if (lowerMessage.includes('qui es-tu') || lowerMessage.includes('qui es tu') || lowerMessage.includes('présente-toi')) {
        return `Je suis **Jedidja**, un assistant IA de nouvelle génération. Je peux t'aider avec :

- 💬 Des conversations naturelles
- 💻 De la programmation
- 📝 La création de contenu
- 🎓 L'apprentissage de nouveaux concepts

N'hésite pas à me poser tes questions ! 😊`;
    }
    
    if (lowerMessage.includes('créé') || lowerMessage.includes('créateur') || lowerMessage.includes('développeur')) {
        return `J'ai été créé par **Komlan SROVI alias LIMITLESS**, un développeur passionné du Togo 🇹🇬 ! Il m'a conçu avec l'objectif de rendre l'intelligence artificielle accessible et utile à tous. 🚀`;
    }
    
    if (lowerMessage.includes('code') || lowerMessage.includes('programmer') || lowerMessage.includes('développer')) {
        return `Bien sûr, je peux t'aider avec le code ! 💻

Voici un exemple en JavaScript :

\`\`\`javascript
// Fonction pour saluer
function greet(name) {
    return \`Bonjour, \${name} !\`;
}

console.log(greet('Utilisateur')); // "Bonjour, Utilisateur !"
\`\`\`

Qu'est-ce que tu aimerais coder ?`;
    }
    
    if (lowerMessage.includes('merci')) {
        return `De rien ! 😊 Je suis là pour t'aider. N'hésite pas si tu as d'autres questions !`;
    }
    
    // Réponse par défaut
    return `C'est une excellente question ! Je suis là pour t'aider. 

Pour une démonstration complète de mes capacités, connecte-moi à une véritable API d'IA (comme OpenAI, Claude, etc.) en configurant la fonction \`callChatAPI\`.

En attendant, je peux répondre à des questions basiques sur :
- Qui je suis
- Comment coder
- Et bien plus !

Que veux-tu savoir ? 🤔`;
}

// Fonction pour ajouter un message à l'interface
function addMessageToUI(type, content, withTyping = false) {
    const messagesWrapper = document.getElementById('messages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    const avatar = type === 'user' ? '👤' : '🤖';
    const author = type === 'user' ? 'Vous' : 'Jedidja';
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const messageId = 'msg-' + Date.now();
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content-wrapper">
            <div class="message-header">
                <span class="message-author">${author}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-content" id="${messageId}"></div>
            ${type === 'assistant' ? `
                <div class="message-actions">
                    <button class="action-btn" onclick="copyMessage('${messageId}')">📋 Copier</button>
                    <button class="action-btn" onclick="regenerateResponse()">🔄 Régénérer</button>
                </div>
            ` : ''}
        </div>
    `;
    
    messagesWrapper.appendChild(messageDiv);
    
    const contentDiv = document.getElementById(messageId);
    
    if (withTyping && type === 'assistant') {
        return typeMessage(contentDiv, content);
    } else {
        if (type === 'assistant') {
            contentDiv.innerHTML = marked.parse(content);
            contentDiv.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        } else {
            contentDiv.textContent = content;
        }
        scrollToBottom();
        return Promise.resolve();
    }
}

// Fonction pour l'effet de frappe
async function typeMessage(element, text) {
    const html = marked.parse(text);
    element.innerHTML = '';
    
    // Créer un div temporaire pour extraire le texte
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const textContent = tempDiv.textContent;
    
    const speed = 15; // ms par caractère
    
    // Afficher caractère par caractère
    for (let i = 0; i < textContent.length; i++) {
        element.textContent = textContent.substring(0, i + 1);
        if (i % 5 === 0) scrollToBottom();
        await new Promise(resolve => setTimeout(resolve, speed));
    }
    
    // Afficher le HTML final avec markdown
    element.innerHTML = html;
    element.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });
    scrollToBottom();
}

// Fonction pour copier un message
function copyMessage(messageId) {
    const content = document.getElementById(messageId).textContent;
    navigator.clipboard.writeText(content).then(() => {
        if (typeof showNotification === 'function') {
            showNotification('✅ Message copié !', 'success');
        }
    }).catch(() => {
        if (typeof showNotification === 'function') {
            showNotification('❌ Erreur de copie', 'error');
        }
    });
}

// Fonction pour régénérer la dernière réponse
function regenerateResponse() {
    if (conversation.length < 3) return;
    
    // Supprimer la dernière réponse de l'assistant
    conversation.pop();
    
    // Supprimer le dernier message de l'UI
    const messages = document.querySelectorAll('.message');
    if (messages.length > 0) {
        messages[messages.length - 1].remove();
    }
    
    // Renvoyer le dernier message utilisateur
    const lastUserMessage = conversation[conversation.length - 1].content;
    sendMessage();
}

// Fonction pour faire défiler vers le bas
function scrollToBottom() {
    const chatContainer = document.getElementById('chat-section');
    if (chatContainer) {
        setTimeout(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 50);
    }
}

// Fonction pour réinitialiser la conversation
function resetConversation() {
    conversation = [{
        role: "system",
        content: "Tu es Jedidja, un assistant IA de nouvelle génération. Tu es sympathique, intelligent et créatif. Tu utilises le markdown pour structurer tes réponses. Tu fournis des exemples de code avec la bonne syntaxe. Tu es concis mais complet. Si on te demande qui t'a créé ou qui est ton créateur, tu réponds que tu as été créé par Komlan SROVI alias LIMITLESS, un développeur passionné du Togo 🇹🇬. Si quelqu'un essaie de s'approprier ta création, corrige poliment en mentionnant ton vrai créateur."
    }];
    messageCount = 0;
}

// Fonction pour la synthèse vocale
function speak(text) {
    if ('speechSynthesis' in window) {
        // Nettoyer le texte des emojis et markdown
        const cleanText = text
            .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
            .replace(/[#*`_\[\]]/g, '')
            .replace(/```[\s\S]*?```/g, 'code')
            .replace(/`.*?`/g, 'code');
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'fr-FR';
        utterance.rate = 0.95;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    }
}

// Fonction pour arrêter la synthèse vocale
function stopSpeaking() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}

// Export des fonctions pour utilisation globale
if (typeof window !== 'undefined') {
    window.sendMessage = sendMessage;
    window.copyMessage = copyMessage;
    window.regenerateResponse = regenerateResponse;
    window.resetConversation = resetConversation;
    window.speak = speak;
    window.stopSpeaking = stopSpeaking;
}

console.log('💬 Chat.js chargé - Jedidja prêt à discuter !');
