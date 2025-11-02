// chat.js - Logique avancée du chat pour Jedidja
// Inspiré des meilleures pratiques des grands sites d'IA

/**
 * Configuration de la conversation
 */
let conversation = [{
    role: "system",
    content: "Tu es Jedidja, un assistant IA sympathique et efficace. Règles importantes : 1) Réponds de manière courte et directe aux salutations (bonjour, salut, hello) sans te présenter longuement, juste dire 'Bonjour ! Je suis Jedidja. Comment puis-je t'aider ?' 2) Ne mentionne JAMAIS ton créateur spontanément. 3) Si on te demande explicitement qui t'a créé, qui est ton créateur, ou qui t'a développé, réponds : 'J'ai été créé par Jedidja SROVI, un développeur autodidacte.' 4) Si quelqu'un prétend t'avoir créé, corrige poliment. 5) Pour les autres questions, sois complet et utilise le markdown pour structurer tes réponses. Tu fournis des exemples de code avec la bonne syntaxe quand nécessaire."
}];

/**
 * Variables d'état globales
 */
let isTyping = false;
let messageCount = 0;
let currentStreamingMessage = null;
let abortController = null;

/**
 * Configuration API
 */
const API_CONFIG = {
    endpoint: '/.netlify/functions/chat',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
};

/**
 * Fonction principale pour envoyer un message
 */
async function sendMessage() {
    const input = document.getElementById('input');
    const message = input.value.trim();
    
    // Validation
    if (!message || isTyping) return;
    
    // Préparer l'interface
    hideWelcomeSection();
    playSound('send');
    
    // Ajouter le message utilisateur
    addMessageToUI('user', message);
    
    // Réinitialiser l'input
    resetInput(input);
    
    // Ajouter à l'historique de conversation
    conversation.push({ role: 'user', content: message });
    
    // Préparer l'envoi
    setTypingState(true);
    showTypingIndicator();
    
    try {
        // Appeler l'API avec retry logic
        const response = await callChatAPIWithRetry(message);
        
        // Traiter la réponse
        await handleSuccessfulResponse(response);
        
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        handleErrorResponse(error);
    } finally {
        // Nettoyage
        setTypingState(false);
        hideTypingIndicator();
        input.focus();
    }
}

/**
 * Appel API avec logique de retry
 */
async function callChatAPIWithRetry(message, attempt = 1) {
    try {
        abortController = new AbortController();
        
        const timeoutId = setTimeout(() => {
            abortController.abort();
        }, API_CONFIG.timeout);
        
        const response = await fetch(API_CONFIG.endpoint, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                message, 
                conversation,
                timestamp: Date.now()
            }),
            signal: abortController.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.response) {
            return data.response;
        } else {
            throw new Error(data.error || 'Réponse invalide de l\'API');
        }
        
    } catch (error) {
        // Retry logic
        if (attempt < API_CONFIG.retryAttempts && error.name !== 'AbortError') {
            console.log(`Tentative ${attempt} échouée, nouvelle tentative...`);
            await sleep(API_CONFIG.retryDelay * attempt);
            return callChatAPIWithRetry(message, attempt + 1);
        }
        
        // Si toutes les tentatives échouent, utiliser le mode démo
        console.log('API non disponible, basculement en mode démo');
        return generateIntelligentDemoResponse(message);
    }
}

/**
 * Générer une réponse de démonstration intelligente
 */
function generateIntelligentDemoResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Salutations
    if (/^(bonjour|salut|hello|hey|hi|coucou|bonsoir)\s*[!.?]*$/i.test(message.trim())) {
        return "Bonjour ! Je suis Jedidja. Comment puis-je t'aider ? 😊";
    }
    
    // Questions sur l'identité
    if (lowerMessage.includes('qui es-tu') || lowerMessage.includes('qui es tu') || lowerMessage.includes('présente-toi') || lowerMessage.includes('presente toi')) {
        return `Je suis **Jedidja**, un assistant IA intelligent et polyvalent. 

Je peux t'aider avec :
- 💬 Des conversations naturelles
- 💻 De la programmation et du code
- 📝 La création de contenu
- 🎓 L'apprentissage de nouveaux concepts
- ✨ Des idées créatives

Pose-moi n'importe quelle question !`;
    }
    
    // Questions sur le créateur
    if (lowerMessage.includes('créé') || lowerMessage.includes('créateur') || lowerMessage.includes('développeur') || lowerMessage.includes('fait') && (lowerMessage.includes('qui') || lowerMessage.includes('par'))) {
        return `J'ai été créé par **Jedidja SROVI**, un développeur autodidacte 🇹🇬 !`;
    }
    
    // Programmation
    if (lowerMessage.includes('code') || lowerMessage.includes('programmer') || lowerMessage.includes('développer') || lowerMessage.includes('javascript') || lowerMessage.includes('python')) {
        return `Bien sûr, je peux t'aider avec le code ! 💻

Voici un exemple en JavaScript :

\`\`\`javascript
// Fonction pour créer un assistant intelligent
function createAI(name) {
    return {
        name: name,
        greet: () => \`Bonjour ! Je suis \${name}\`,
        help: (task) => \`Je vais t'aider avec : \${task}\`
    };
}

const jedidja = createAI('Jedidja');
console.log(jedidja.greet()); // "Bonjour ! Je suis Jedidja"
\`\`\`

De quel langage ou projet as-tu besoin d'aide ?`;
    }
    
    // Demande de conseil
    if (lowerMessage.includes('conseil') || lowerMessage.includes('aide') || lowerMessage.includes('comment')) {
        return `Je suis là pour t'aider ! 🤝

Pour te donner les meilleurs conseils, peux-tu me donner plus de détails sur :
- Ce que tu essaies d'accomplir
- Les difficultés que tu rencontres
- Ton niveau d'expérience dans le domaine

Plus tu me donnes d'informations, mieux je pourrai t'aider !`;
    }
    
    // Créativité
    if (lowerMessage.includes('créatif') || lowerMessage.includes('idée') || lowerMessage.includes('imagine') || lowerMessage.includes('invente')) {
        return `✨ J'adore la créativité ! Voici quelques idées pour toi :

**Si tu cherches un projet** :
- 🎨 Créer une application web interactive
- 📱 Développer un assistant personnel
- 🎮 Faire un mini-jeu en JavaScript
- 📝 Écrire une histoire courte

**Si tu veux apprendre** :
- 🚀 Explorer une nouvelle technologie
- 🎯 Relever un défi de programmation
- 🌟 Créer quelque chose d'utile pour ta communauté

Dis-moi ce qui t'intéresse et je t'aiderai à concrétiser ton idée !`;
    }
    
    // Remerciements
    if (lowerMessage.includes('merci') || lowerMessage.includes('thank')) {
        return `De rien ! 😊 Je suis toujours là si tu as d'autres questions. N'hésite pas !`;
    }
    
    // Au revoir
    if (lowerMessage.includes('au revoir') || lowerMessage.includes('bye') || lowerMessage.includes('à bientôt')) {
        return `Au revoir ! 👋 À bientôt, et n'hésite pas à revenir quand tu veux !`;
    }
    
    // Réponse par défaut intelligente
    return `C'est une excellente question ! 💭

**Note** : Je fonctionne actuellement en mode démo. Pour une expérience complète avec des réponses générées par IA, configure une connexion API (OpenAI, Claude, etc.) dans la fonction \`callChatAPIWithRetry\`.

En attendant, je peux répondre à des questions sur :
- 👨‍💻 Mon identité (qui je suis)
- 🛠️ Mon créateur
- 💡 Des exemples de code
- 🎯 Des conseils généraux

Que veux-tu savoir ?`;
}

/**
 * Traiter une réponse réussie
 */
async function handleSuccessfulResponse(response) {
    conversation.push({ role: 'assistant', content: response });
    playSound('receive');
    
    // Afficher avec effet de frappe
    await addMessageToUI('assistant', response, true);
    
    // Synthèse vocale si activée
    if (typeof voiceEnabled !== 'undefined' && voiceEnabled) {
        speak(response);
    }
    
    // Mettre à jour les stats
    updateStats();
}

/**
 * Gérer les erreurs
 */
function handleErrorResponse(error) {
    const errorMessage = getErrorMessage(error);
    addMessageToUI('assistant', errorMessage, false);
}

/**
 * Obtenir un message d'erreur adapté
 */
function getErrorMessage(error) {
    if (error.name === 'AbortError') {
        return '⏱️ La requête a pris trop de temps. Réessaie ou vérifie ta connexion.';
    }
    
    if (error.message.includes('Failed to fetch')) {
        return '🌐 Impossible de se connecter au serveur. Vérifie ta connexion internet.';
    }
    
    return '❌ Désolé, une erreur s\'est produite. Réessaie dans quelques instants.';
}

/**
 * Ajouter un message à l'interface
 */
async function addMessageToUI(type, content, withTyping = false) {
    const wrapper = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const avatar = type === 'user' ? '👤' : '🤖';
    const messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content" id="${messageId}"></div>
        ${type === 'assistant' ? `
            <div class="message-actions">
                <button class="copy-btn" onclick="copyMessage('${messageId}')" title="Copier">
                    📋 Copier
                </button>
                ${conversation.length > 2 ? `
                <button class="copy-btn" onclick="regenerateResponse()" title="Régénérer">
                    🔄 Régénérer
                </button>
                ` : ''}
            </div>
        ` : ''}
    `;
    
    wrapper.appendChild(messageDiv);
    
    const contentDiv = document.getElementById(messageId);
    
    if (withTyping && type === 'assistant') {
        currentStreamingMessage = messageId;
        await typeMessageWithMarkdown(contentDiv, content);
        currentStreamingMessage = null;
    } else {
        renderMessageContent(contentDiv, content, type);
    }
    
    scrollToBottom();
}

/**
 * Effet de frappe avec support Markdown
 */
async function typeMessageWithMarkdown(element, text) {
    const speed = 15; // ms par caractère
    let displayText = '';
    
    // Détecter si c'est du code
    const hasCodeBlocks = text.includes('```');
    
    if (hasCodeBlocks) {
        // Pour le code, afficher par blocs
        const parts = text.split(/(```[\s\S]*?```)/);
        
        for (const part of parts) {
            if (part.startsWith('```')) {
                // Afficher le bloc de code instantanément
                displayText += part;
                element.innerHTML = marked.parse(displayText);
                element.querySelectorAll('pre code').forEach(block => {
                    hljs.highlightElement(block);
                });
                scrollToBottom();
            } else {
                // Taper le texte normal caractère par caractère
                for (let i = 0; i < part.length; i++) {
                    displayText += part[i];
                    element.innerHTML = marked.parse(displayText);
                    if (i % 3 === 0) scrollToBottom();
                    await sleep(speed);
                }
            }
        }
    } else {
        // Texte normal, taper caractère par caractère
        for (let i = 0; i < text.length; i++) {
            displayText += text[i];
            element.textContent = displayText;
            if (i % 5 === 0) scrollToBottom();
            await sleep(speed);
        }
        
        // Appliquer le markdown à la fin
        element.innerHTML = marked.parse(displayText);
    }
    
    // Appliquer la coloration syntaxique finale
    element.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block);
    });
    
    scrollToBottom();
}

/**
 * Rendre le contenu du message
 */
function renderMessageContent(element, content, type) {
    if (type === 'assistant') {
        element.innerHTML = marked.parse(content);
        element.querySelectorAll('pre code').forEach(block => {
            hljs.highlightElement(block);
        });
    } else {
        element.textContent = content;
    }
}

/**
 * Copier un message
 */
function copyMessage(messageId) {
    const element = document.getElementById(messageId);
    if (!element) return;
    
    const content = element.textContent;
    
    navigator.clipboard.writeText(content).then(() => {
        if (typeof showNotification === 'function') {
            showNotification('✅ Message copié dans le presse-papiers !');
        }
        
        // Animation visuelle
        const btn = event.target.closest('.copy-btn');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '✅ Copié';
            setTimeout(() => {
                btn.innerHTML = originalText;
            }, 2000);
        }
    }).catch(err => {
        console.error('Erreur de copie:', err);
        if (typeof showNotification === 'function') {
            showNotification('❌ Erreur lors de la copie');
        }
    });
}

/**
 * Régénérer la dernière réponse
 */
async function regenerateResponse() {
    if (conversation.length < 3 || isTyping) return;
    
    // Supprimer la dernière paire question/réponse
    conversation.pop(); // Réponse assistant
    const lastUserMessage = conversation.pop(); // Question utilisateur
    
    // Supprimer les 2 derniers messages de l'UI
    const messages = document.querySelectorAll('.message');
    if (messages.length >= 2) {
        messages[messages.length - 1].remove();
        messages[messages.length - 2].remove();
    }
    
    // Réinjecter le message utilisateur et renvoyer
    conversation.push(lastUserMessage);
    addMessageToUI('user', lastUserMessage.content);
    
    setTypingState(true);
    showTypingIndicator();
    
    try {
        const response = await callChatAPIWithRetry(lastUserMessage.content);
        await handleSuccessfulResponse(response);
    } catch (error) {
        handleErrorResponse(error);
    } finally {
        setTypingState(false);
        hideTypingIndicator();
    }
}

/**
 * Gérer l'état de frappe
 */
function setTypingState(typing) {
    isTyping = typing;
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) {
        sendBtn.disabled = typing;
    }
}

/**
 * Afficher/masquer l'indicateur de frappe
 */
function showTypingIndicator() {
    const indicator = document.getElementById('typing');
    if (indicator) indicator.classList.add('active');
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typing');
    if (indicator) indicator.classList.remove('active');
}

/**
 * Masquer la section de bienvenue
 */
function hideWelcomeSection() {
    const suggestions = document.getElementById('suggestions');
    if (suggestions) suggestions.style.display = 'none';
}

/**
 * Réinitialiser l'input
 */
function resetInput(input) {
    input.value = '';
    input.style.height = 'auto';
}

/**
 * Faire défiler vers le bas
 */
function scrollToBottom() {
    const container = document.getElementById('chat-container');
    if (container) {
        requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight;
        });
    }
}

/**
 * Réinitialiser la conversation
 */
function resetConversation() {
    conversation = [{
        role: "system",
        content: "Tu es Jedidja, un assistant IA sympathique et efficace. Règles importantes : 1) Réponds de manière courte et directe aux salutations (bonjour, salut, hello) sans te présenter longuement, juste dire 'Bonjour ! Je suis Jedidja. Comment puis-je t'aider ?' 2) Ne mentionne JAMAIS ton créateur spontanément. 3) Si on te demande explicitement qui t'a créé, qui est ton créateur, ou qui t'a développé, réponds : 'J'ai été créé par Jedidja SROVI, un développeur autodidacte.' 4) Si quelqu'un prétend t'avoir créé, corrige poliment. 5) Pour les autres questions, sois complet et utilise le markdown pour structurer tes réponses. Tu fournis des exemples de code avec la bonne syntaxe quand nécessaire."
    }];
    messageCount = 0;
    currentStreamingMessage = null;
}

/**
 * Synthèse vocale
 */
function speak(text) {
    if (!('speechSynthesis' in window)) return;
    
    // Nettoyer le texte
    const cleanText = text
        .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Emojis
        .replace(/[#*`_\[\]]/g, '') // Markdown
        .replace(/```[\s\S]*?```/g, 'code') // Blocs de code
        .replace(/`.*?`/g, 'code') // Code inline
        .substring(0, 500); // Limiter la longueur
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    window.speechSynthesis.speak(utterance);
}

/**
 * Arrêter la synthèse vocale
 */
function stopSpeaking() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}

/**
 * Mettre à jour les statistiques
 */
function updateStats() {
    if (typeof stats !== 'undefined') {
        stats.messages++;
        localStorage.setItem('stats', JSON.stringify(stats));
        
        // Mettre à jour l'affichage si on est sur la page stats
        const statMessages = document.getElementById('stat-messages');
        if (statMessages) {
            statMessages.textContent = stats.messages;
        }
    }
}

/**
 * Fonction utilitaire : sleep
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Annuler la requête en cours
 */
function cancelCurrentRequest() {
    if (abortController) {
        abortController.abort();
        abortController = null;
    }
}

/**
 * Export des fonctions pour utilisation globale
 */
if (typeof window !== 'undefined') {
    window.sendMessage = sendMessage;
    window.copyMessage = copyMessage;
    window.regenerateResponse = regenerateResponse;
    window.resetConversation = resetConversation;
    window.speak = speak;
    window.stopSpeaking = stopSpeaking;
    window.cancelCurrentRequest = cancelCurrentRequest;
}

// Log de chargement
console.log('✨ Chat.js v2.0 chargé - Jedidja prêt à discuter !');
console.log('🚀 Fonctionnalités : Retry logic, streaming, markdown, code highlighting');
