// ============================================
// JEDIDJA AI 2.0 - JAVASCRIPT COMPLET
// ============================================

// Variables globales
let messages = [];
let isLoading = false;
let isRecording = false;
let messageCount = 0;
let sessionStart = Date.now();
let currentTheme = 'dark';
let vocalEnabled = false;
let snowflakeInterval = null;

// ============================================
// INITIALISATION
// ============================================

window.addEventListener('load', function() {
    setTimeout(function() {
        document.getElementById('loadingScreen').classList.add('hidden');
        document.getElementById('appContainer').style.opacity = '1';
    }, 2500);
});

document.addEventListener('DOMContentLoaded', function() {
    // Charger le thème sauvegardé
    const savedTheme = localStorage.getItem('theme') || 'dark';
    changeTheme(savedTheme);
    
    // Message de bienvenue
    addMessage('assistant', `Bonjour ! Je suis **Jedidja**, ton assistant IA de nouvelle génération. 🚀

Voici ce que je peux faire pour toi :

💬 Converser naturellement sur n'importe quel sujet
💻 T'aider avec la programmation (tous langages)
🎨 Créer du contenu (articles, histoires, poèmes...)
🎓 T'enseigner de nouveaux concepts
🌐 Rechercher des informations sur le web
📄 Analyser des documents

Que puis-je faire pour toi aujourd'hui ?`);

    showSuggestions();
    
    // Fermer sidebar sur mobile
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.add('closed');
    }
});

// ============================================
// GESTION DES THÈMES
// ============================================

function changeTheme(theme) {
    // Retirer tous les thèmes
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-noel');
    
    // Appliquer le nouveau thème
    document.body.classList.add(`theme-${theme}`);
    currentTheme = theme;
    
    // Mettre à jour le texte des paramètres
    const themeNames = {
        'dark': 'Thème sombre',
        'light': 'Thème clair',
        'noel': 'Thème Noël'
    };
    const themeText = document.getElementById('currentThemeText');
    if (themeText) {
        themeText.textContent = themeNames[theme];
    }
    
    // Gérer les flocons de neige pour Noël
    if (theme === 'noel') {
        createSnowflakes();
    } else {
        removeSnowflakes();
    }
    
    // Sauvegarder le choix
    localStorage.setItem('theme', theme);
}

// Créer les flocons de neige
function createSnowflakes() {
    // Nettoyer les anciens flocons
    removeSnowflakes();
    
    // Créer 50 flocons
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';
            snowflake.innerHTML = '❄';
            snowflake.style.left = Math.random() * 100 + '%';
            snowflake.style.animationDuration = (Math.random() * 3 + 2) + 's';
            snowflake.style.opacity = Math.random();
            snowflake.style.fontSize = (Math.random() * 10 + 10) + 'px';
            document.body.appendChild(snowflake);
            
            // Supprimer après animation
            setTimeout(() => {
                if (snowflake.parentNode) {
                    snowflake.remove();
                }
            }, 5000);
        }, i * 100);
    }
    
    // Régénérer les flocons toutes les 5 secondes
    if (currentTheme === 'noel') {
        snowflakeInterval = setTimeout(createSnowflakes, 5000);
    }
}

// Supprimer tous les flocons
function removeSnowflakes() {
    if (snowflakeInterval) {
        clearTimeout(snowflakeInterval);
        snowflakeInterval = null;
    }
    document.querySelectorAll('.snowflake').forEach(s => s.remove());
}

// ============================================
// NAVIGATION ENTRE SECTIONS
// ============================================

function switchSection(sectionName) {
    // Désactiver toutes les sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Activer la section demandée
    document.getElementById(sectionName).classList.add('active');
    
    // Mettre à jour la navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Fermer sidebar sur mobile
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.add('closed');
    }
}

// ============================================
// TOGGLE SIDEBAR
// ============================================

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('closed');
}

// Fermer sidebar en cliquant en dehors (mobile)
document.addEventListener('click', function(event) {
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        const menuBtn = document.querySelector('.menu-btn');
        
        if (!sidebar.contains(event.target) && !menuBtn.contains(event.target)) {
            sidebar.classList.add('closed');
        }
    }
});

// ============================================
// GESTION DES MESSAGES
// ============================================

function addMessage(role, content) {
    const container = document.getElementById('messagesContainer');
    
    // Supprimer les suggestions si présentes
    const suggestions = container.querySelector('.suggestions-grid');
    if (suggestions) {
        suggestions.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    if (role === 'assistant') {
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <div class="logo" style="width: 40px; height: 40px;">
                    <div class="logo-circle"></div>
                </div>
            </div>
            <div class="message-content">
                <div class="message-text">${formatMessage(content)}</div>
                <div class="message-time">${timeStr}</div>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-avatar user">U</div>
            <div class="message-content">
                <div class="message-text">${formatMessage(content)}</div>
                <div class="message-time">${timeStr}</div>
            </div>
        `;
    }

    container.appendChild(messageDiv);
    messages.push({ role, content, timestamp: now });
    
    container.scrollTop = container.scrollHeight;
}

// Formater le message (Markdown basique)
function formatMessage(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>')
        .replace(/^# (.*?)$/gm, '<h2 style="font-size: 1.5em; margin: 12px 0;">$1</h2>')
        .replace(/^## (.*?)$/gm, '<h3 style="font-size: 1.2em; margin: 10px 0;">$1</h3>')
        .replace(/`(.*?)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">$1</code>');
}

// Afficher l'indicateur de réflexion
function showThinkingIndicator() {
    const container = document.getElementById('messagesContainer');
    const thinkingDiv = document.createElement('div');
    thinkingDiv.className = 'message';
    thinkingDiv.id = 'thinkingIndicator';
    thinkingDiv.innerHTML = `
        <div class="message-avatar">
            <div class="logo" style="width: 40px; height: 40px;">
                <div class="logo-circle"></div>
            </div>
        </div>
        <div class="message-content">
            <div class="ai-thinking-container">
                <div class="ai-thinking-logo">
                    <div class="thinking-outer"></div>
                    <div class="thinking-middle"></div>
                    <div class="thinking-inner"></div>
                </div>
                <span style="color: #9ca3af;">Jedidja réfléchit...</span>
                <div class="thinking-dots">
                    <div class="thinking-dot"></div>
                    <div class="thinking-dot"></div>
                    <div class="thinking-dot"></div>
                </div>
            </div>
        </div>
    `;
    container.appendChild(thinkingDiv);
    container.scrollTop = container.scrollHeight;
}

function removeThinkingIndicator() {
    const indicator = document.getElementById('thinkingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// ============================================
// ENVOYER UN MESSAGE
// ============================================

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();

    if (!message || isLoading) return;

    // Ajouter le message utilisateur
    addMessage('user', message);
    input.value = '';
    input.style.height = 'auto';

    // Mettre à jour les stats
    messageCount++;
    updateStats();

    // Désactiver le bouton d'envoi
    isLoading = true;
    document.getElementById('sendBtn').disabled = true;
    document.getElementById('mainLogo').classList.add('loading');

    // Afficher l'indicateur de réflexion
    showThinkingIndicator();

    try {
        // Appel à la fonction Netlify
        const response = await fetch('/.netlify/functions/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: messages.map(m => ({
                    role: m.role,
                    content: m.content
                }))
            })
        });

        const data = await response.json();

        removeThinkingIndicator();

        if (data.error) {
            addMessage('assistant', `❌ **Erreur** : ${data.error}\n\nVérifie que ta clé API Groq est correctement configurée dans les variables d'environnement Netlify.`);
        } else {
            addMessage('assistant', data.response);
            
            // Lecture vocale si activée
            if (vocalEnabled) {
                speakText(data.response);
            }
        }

    } catch (error) {
        console.error('Erreur:', error);
        removeThinkingIndicator();
        addMessage('assistant', `❌ **Erreur de connexion**\n\nJe n'arrive pas à me connecter à l'API. Vérifie :\n- Que la fonction Netlify est bien déployée\n- Que ta clé API Groq est configurée\n- Ta connexion Internet\n\n**Note :** En développement local, utilise \`netlify dev\` pour tester les fonctions.`);
    }

    // Réactiver le bouton
    isLoading = false;
    document.getElementById('sendBtn').disabled = false;
    document.getElementById('mainLogo').classList.remove('loading');
}

// ============================================
// GESTION DES TOUCHES
// ============================================

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Auto-resize du textarea
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

// ============================================
// SUGGESTIONS
// ============================================

function showSuggestions() {
    const suggestionsHTML = `
        <div class="suggestions-grid">
            <div class="suggestion-card" onclick="useSuggestion('Explique-moi le concept de l\\'intelligence artificielle')">
                <div class="suggestion-icon">💡</div>
                <div class="suggestion-text">Explique-moi un concept</div>
            </div>
            <div class="suggestion-card" onclick="useSuggestion('Aide-moi à créer une fonction JavaScript')">
                <div class="suggestion-icon">💻</div>
                <div class="suggestion-text">Aide-moi à coder</div>
            </div>
            <div class="suggestion-card" onclick="useSuggestion('Écris-moi une histoire courte sur l\\'espace')">
                <div class="suggestion-icon">✨</div>
                <div class="suggestion-text">Sois créatif</div>
            </div>
            <div class="suggestion-card" onclick="useSuggestion('Apprends-moi quelque chose d\\'intéressant')">
                <div class="suggestion-icon">📚</div>
                <div class="suggestion-text">Apprends-moi quelque chose</div>
            </div>
        </div>
    `;
    document.getElementById('messagesContainer').insertAdjacentHTML('beforeend', suggestionsHTML);
}

function useSuggestion(text) {
    document.getElementById('messageInput').value = text;
    sendMessage();
}

// ============================================
// NOUVELLE CONVERSATION
// ============================================

function startNewChat() {
    messages = [];
    document.getElementById('messagesContainer').innerHTML = '';
    
    addMessage('assistant', `Bonjour ! Je suis **Jedidja**, ton assistant IA de nouvelle génération. 🚀

Voici ce que je peux faire pour toi :

💬 Converser naturellement sur n'importe quel sujet
💻 T'aider avec la programmation (tous langages)
🎨 Créer du contenu (articles, histoires, poèmes...)
🎓 T'enseigner de nouveaux concepts
🌐 Rechercher des informations sur le web
📄 Analyser des documents

Que puis-je faire pour toi aujourd'hui ?`);

    showSuggestions();
}

// ============================================
// UPLOAD DE FICHIERS
// ============================================

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const fileName = file.name;
        const fileSize = (file.size / 1024).toFixed(2);
        
        addMessage('user', `📎 Fichier joint : **${fileName}** (${fileSize} KB)`);
        
        setTimeout(() => {
            addMessage('assistant', `J'ai bien reçu le fichier **${fileName}**. 📄\n\nL'analyse de documents sera bientôt disponible. Cette fonctionnalité permettra de :\n\n✅ Extraire le texte des PDF\n✅ Analyser le contenu\n✅ Répondre à des questions sur le document\n✅ Résumer les informations clés`);
        }, 1000);
    }
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const fileName = file.name;
        
        addMessage('user', `🖼️ Image jointe : **${fileName}**`);
        
        setTimeout(() => {
            addMessage('assistant', `J'ai bien reçu l'image **${fileName}**. 🖼️\n\nL'analyse d'images sera bientôt disponible. Cette fonctionnalité permettra de :\n\n✅ Décrire le contenu de l'image\n✅ Extraire du texte (OCR)\n✅ Répondre à des questions sur l'image\n✅ Identifier des objets et des personnes`);
        }, 1000);
    }
}

function handleAudioUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const audioList = document.getElementById('audioList');
        const audioDiv = document.createElement('div');
        audioDiv.className = 'note-card';
        audioDiv.style.marginBottom = '15px';
        audioDiv.innerHTML = `
            <h3>🎵 ${file.name}</h3>
            <audio controls style="margin-top: 10px; width: 100%;">
                <source src="${URL.createObjectURL(file)}" type="${file.type}">
            </audio>
        `;
        audioList.appendChild(audioDiv);
    }
}

// ============================================
// SYNTHÈSE VOCALE
// ============================================

function toggleVocal() {
    vocalEnabled = !vocalEnabled;
    const statusText = document.getElementById('vocalStatus');
    if (statusText) {
        statusText.textContent = vocalEnabled ? 'Désactiver' : 'Activer';
    }
    
    const message = vocalEnabled 
        ? '🔊 Synthèse vocale activée ! Les réponses seront lues automatiquement.' 
        : '🔇 Synthèse vocale désactivée.';
    
    alert(message);
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        // Nettoyer le texte du markdown
        const cleanText = text
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/`(.*?)`/g, '$1')
            .replace(/<[^>]*>/g, '')
            .replace(/\n/g, ' ');
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'fr-FR';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        speechSynthesis.speak(utterance);
    }
}

function startVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'fr-FR';
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onstart = function() {
            alert('🎤 Parlez maintenant...');
        };
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            document.getElementById('messageInput').value = transcript;
            alert('✅ Transcription terminée !');
        };
        
        recognition.onerror = function(event) {
            alert('❌ Erreur de reconnaissance vocale : ' + event.error);
        };
        
        recognition.start();
    } else {
        alert('❌ La reconnaissance vocale n\'est pas supportée par votre navigateur.\n\nUtilisez Chrome, Edge ou Safari pour cette fonctionnalité.');
    }
}

function toggleVoiceRecording() {
    if (!isRecording) {
        startVoiceRecognition();
    }
}

// ============================================
// NOTES
// ============================================

function addNote() {
    const title = prompt('📝 Titre de la note :');
    if (!title) return;
    
    const content = prompt('📄 Contenu de la note :');
    if (!content) return;
    
    const notesGrid = document.getElementById('notesGrid');
    const noteCard = document.createElement('div');
    noteCard.className = 'note-card';
    noteCard.innerHTML = `
        <h3>${title}</h3>
        <p>${content.substring(0, 50)}${content.length > 50 ? '...' : ''}</p>
        <small style="color: #9ca3af;">${new Date().toLocaleDateString('fr-FR')}</small>
    `;
    notesGrid.appendChild(noteCard);
    
    // Mettre à jour les stats
    updateStats();
    
    alert('✅ Note créée avec succès !');
}

// ============================================
// RAPPELS
// ============================================

function addRappel() {
    const title = prompt('🔔 Titre du rappel :');
    if (!title) return;
    
    const time = prompt('🕐 Heure (format HH:MM) :');
    if (!time) return;
    
    const rappelsList = document.getElementById('rappelsList');
    const rappelCard = document.createElement('div');
    rappelCard.className = 'note-card';
    rappelCard.style.marginBottom = '15px';
    rappelCard.innerHTML = `
        <h3>${title}</h3>
        <p>Aujourd'hui à ${time}</p>
        <button class="send-btn" style="margin-top: 10px; padding: 8px 16px;" onclick="this.parentElement.remove(); updateStats();">
            ✓ Marquer comme fait
        </button>
    `;
    rappelsList.appendChild(rappelCard);
    
    // Mettre à jour les stats
    updateStats();
    
    alert('✅ Rappel créé avec succès !');
}

// ============================================
// STATISTIQUES
// ============================================

function updateStats() {
    // Messages
    document.getElementById('statMessages').textContent = messageCount;
    
    // Temps d'utilisation
    const hours = Math.floor((Date.now() - sessionStart) / 3600000);
    const minutes = Math.floor(((Date.now() - sessionStart) % 3600000) / 60000);
    document.getElementById('statTime').textContent = hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`;
    
    // Notes
    const notesCount = document.querySelectorAll('#notesGrid .note-card').length;
    document.getElementById('statNotes').textContent = notesCount;
    
    // Rappels
    const rappelsCount = document.querySelectorAll('#rappelsList .note-card').length;
    document.getElementById('statRappels').textContent = rappelsCount;
}

// Mettre à jour les stats toutes les minutes
setInterval(updateStats, 60000);

// ============================================
// RESPONSIVE
// ============================================

window.addEventListener('resize', function() {
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.add('closed');
    } else {
        document.getElementById('sidebar').classList.remove('closed');
    }
});
