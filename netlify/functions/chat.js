// chat.js - Logique avancée du chat pour Jedidja avec Groq API
// Version production sans mode démo

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
 * Configuration API Groq
 */
const API_CONFIG = {
    endpoint: '/.netlify/functions/chat',
    timeout: 45000, // 45 secondes pour les requêtes Groq
    retryAttempts: 3,
    retryDelay: 1500
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
        // Appeler l'API Groq avec retry logic
        const response = await callGroqAPIWithRetry(message);
        
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
 * Appel API Groq avec logique de retry
 */
async function callGroqAPIWithRetry(message, attempt = 1) {
    try {
        abortController = new AbortController();
        
        const timeoutId = setTimeout(() => {
            abortController.abort();
        }, API_CONFIG.timeout);
        
        console.log(`🚀 Appel API Groq - Tentative ${attempt}/${API_CONFIG.retryAttempts}`);
        
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
            const errorText = await response.text();
            console.error(`❌ Erreur HTTP ${response.status}:`, errorText);
            throw new Error(`Erreur API: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.response) {
            console.log('✅ Réponse reçue de Groq API');
            return data.response;
        } else {
            throw new Error(data.error || 'Réponse invalide de l\'API Groq');
        }
        
    } catch (error) {
        console.error(`❌ Tentative ${attempt} échouée:`, error.message);
        
        // Retry logic - uniquement pour les erreurs réseau, pas pour les timeouts
        if (attempt < API_CONFIG.retryAttempts && error.name !== 'AbortError') {
            console.log(`⏳ Nouvelle tentative dans ${API_CONFIG.retryDelay}ms...`);
            await sleep(API_CONFIG.retryDelay * attempt);
            return callGroqAPIWithRetry(message, attempt + 1);
        }
        
        // Si toutes les tentatives échouent, propager l'erreur
        throw error;
    }
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
    
    // Retirer le dernier message utilisateur de l'historique
    if (conversation.length > 1 && conversation[conversation.length - 1].role === 'user') {
        conversation.pop();
    }
}

/**
 * Obtenir un message d'erreur adapté
 */
function getErrorMessage(error) {
    if (error.name === 'AbortError') {
        return `⏱️ **La requête a pris trop de temps**

La génération de la réponse a dépassé le temps limite. Cela peut arriver si :
- Le serveur est surchargé
- Ta connexion internet est lente
- La requête est trop complexe

**Solutions** :
- Réessaie avec une question plus simple
- Vérifie ta connexion internet
- Attends quelques instants avant de réessayer`;
    }
    
    if (error.message.includes('Failed to fetch')) {
        return `🌐 **Impossible de se connecter au serveur**

Le serveur Jedidja est temporairement inaccessible.

**Solutions** :
- Vérifie ta connexion internet
- Recharge la page
- Réessaie dans quelques instants

Si le problème persiste, contacte le support.`;
    }
    
    if (error.message.includes('API')) {
        return `⚠️ **Erreur de l'API Groq**

${error.message}

**Solutions** :
- Réessaie dans quelques secondes
- Si l'erreur persiste, l'API pourrait être temporairement indisponible
- Vérifie que ta clé API Groq est correctement configurée sur Netlify`;
    }
    
    return `❌ **Une erreur inattendue s'est produite**

${error.message || 'Erreur inconnue'}

**Solutions** :
- Réessaie dans quelques instants
- Recharge la page si le problème persiste
- Vérifie ta connexion internet

Si l'erreur continue, contacte le support technique.`;
}

/**
 * Ajouter un message à l'interface
 */
async function addMessageToUI(type, content, withTyping = false) {
    const wrapper = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const avatar = type === 'user' ? '👤' : '<img src="logo.png" alt="Jedidja" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">';
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
        const response = await callGroqAPIWithRetry(lastUserMessage.content);
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
 * Fonction utilitaire pour obtenir l'élément messages
 */
function getMessagesWrapper() {
    return document.getElementById('messages');
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
        console.log('⛔ Requête annulée');
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
console.log('✨ Chat.js v3.0 chargé - Jedidja avec Groq API !');
console.log('🚀 Fonctionnalités : Groq API, Retry logic, Streaming, Markdown, Code highlighting');
console.log('🔑 API Groq configurée via Netlify Functions');
