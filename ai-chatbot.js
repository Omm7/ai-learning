class PremiumChatbot {
    constructor() {
        this.apiKey = 'AIzaSyD3nZncaJyM045MWglg3HwxvOTHypWqvro';
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
        this.isOpen = false;
        this.isProcessing = false;
        this.conversationHistory = [];
        this.maxHistory = 20;
        this.elements = {};
        this.init();
    }

    init() {
        if (!this.loadElements()) {
            console.warn('Chatbot elements not found');
            return;
        }
        this.loadEventListeners();
    }

    loadElements() {
        this.elements.widget = document.getElementById('aiChatWidget');
        this.elements.toggle = document.getElementById('aiChatToggle');
        this.elements.close = document.getElementById('chatClose');
        this.elements.messages = document.getElementById('chatMessages');
        this.elements.input = document.getElementById('chatInput');
        this.elements.sendButton = document.getElementById('sendButton');
        this.elements.voiceButton = document.getElementById('voiceButton');
        this.elements.attachButton = document.getElementById('attachButton');
        this.elements.notificationBadge = document.getElementById('notificationBadge');

        if (!this.elements.widget || !this.elements.toggle) return false;
        return true;
    }

    loadEventListeners() {
        this.elements.toggle.addEventListener('click', () => this.toggleChat());
        if (this.elements.close) this.elements.close.addEventListener('click', () => this.closeChat());
        if (this.elements.sendButton) this.elements.sendButton.addEventListener('click', () => this.sendMessage());
        
        if (this.elements.input) {
            this.elements.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            this.elements.input.addEventListener('input', () => this.resizeInput());
        }

        if (this.elements.voiceButton) this.elements.voiceButton.addEventListener('click', () => this.startVoiceInput());
        if (this.elements.attachButton) this.elements.attachButton.addEventListener('click', () => this.showAttachmentOptions());

        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const text = e.currentTarget.dataset.prompt || e.currentTarget.textContent;
                if (this.elements.input) this.elements.input.value = text;
                setTimeout(() => this.sendMessage(), 100);
            });
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        if (this.elements.widget) {
            this.elements.widget.classList.toggle('active', this.isOpen);
        }
        if (this.isOpen && this.elements.input) {
            this.elements.input.focus();
            this.scrollToBottom();
        }
    }

    openChat() {
        if (!this.isOpen) this.toggleChat();
    }

    closeChat() {
        if (this.isOpen) this.toggleChat();
    }

    async sendMessage() {
        if (!this.elements.input || this.isProcessing) return;

        const message = this.elements.input.value.trim();
        if (!message) return;

        this.addMessage(message, 'user');
        this.elements.input.value = '';
        this.resizeInput();

        const normalized = message.toLowerCase().replace(/[^\w\s]/g, '');
        if (normalized === 'hi') {
            this.addMessage("Hi dear studnet, I'm gita smart ai 🤖 how can i assit you today", 'ai');
            return;
        }

        this.setProcessingState(true);
        try {
            const response = await this.callGeminiAPI(message);
            this.addMessage(response, 'ai');
        } catch (err) {
            this.addMessage('Sorry, could not get response. ' + err.message, 'ai');
        } finally {
            this.setProcessingState(false);
        }
    }

    setProcessingState(on) {
        this.isProcessing = on;
        if (this.elements.sendButton) {
            this.elements.sendButton.disabled = on;
            this.elements.sendButton.innerHTML = on ? '<i class="fas fa-spinner fa-spin"></i>' : '<i class="fas fa-paper-plane"></i>';
        }
        if (this.elements.input) this.elements.input.disabled = on;
        if (on) this.showTypingIndicator();
        else this.hideTypingIndicator();
    }

    async callGeminiAPI(prompt) {
        const body = {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 1200 }
        };

        const resp = await fetch(`${this.baseURL}?key=${this.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await resp.json();

        if (!resp.ok || data.error) {
            throw new Error(data.error?.message || 'API Error');
        }

        if (!data.candidates || !data.candidates[0]) {
            throw new Error('No response from API');
        }

        const text = data.candidates[0]?.content?.parts?.[0]?.text || '';
        if (!text) throw new Error('Empty response');

        this.conversationHistory.push({ role: 'user', text: prompt });
        this.conversationHistory.push({ role: 'assistant', text: text });
        if (this.conversationHistory.length > this.maxHistory * 2) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistory * 2);
        }

        return text;
    }

    addMessage(text, sender) {
        if (!this.elements.messages) return;

        const msg = document.createElement('div');
        msg.className = `message ${sender}-message`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = sender === 'ai' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.innerHTML = this.formatText(text);

        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        msg.appendChild(avatar);
        const content = document.createElement('div');
        content.className = 'message-content';
        content.appendChild(bubble);
        content.appendChild(time);
        msg.appendChild(content);

        this.elements.messages.appendChild(msg);
        this.scrollToBottom();
    }

    formatText(s) {
        if (!s) return '';
        const esc = String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return esc.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }

    showTypingIndicator() {
        if (!this.elements.messages) return;
        if (document.getElementById('typingIndicator')) return;

        const div = document.createElement('div');
        div.id = 'typingIndicator';
        div.className = 'message ai-message';
        div.innerHTML = '<div class="message-avatar"><i class="fas fa-robot"></i></div><div class="message-content"><div class="message-bubble typing-dots"><span></span><span></span><span></span></div></div>';
        this.elements.messages.appendChild(div);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const el = document.getElementById('typingIndicator');
        if (el) el.remove();
    }

    resizeInput() {
        if (!this.elements.input) return;
        this.elements.input.style.height = 'auto';
        this.elements.input.style.height = Math.min(this.elements.input.scrollHeight, 120) + 'px';
    }

    scrollToBottom() {
        if (!this.elements.messages) return;
        setTimeout(() => {
            this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
        }, 50);
    }

    showAttachmentOptions() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.txt,.doc,.docx,.jpg,.png';
        input.onchange = (e) => {
            const file = e.target.files?.[0];
            if (file) this.handleFileAttachment(file);
        };
        input.click();
    }

    handleFileAttachment(file) {
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            this.addMessage('File too large (max 5MB)', 'ai');
            return;
        }

        this.addMessage(`📎 Attached: ${file.name}`, 'user');

        const reader = new FileReader();
        reader.onload = async () => {
            const txt = String(reader.result || '').slice(0, 3000);
            try {
                const resp = await this.callGeminiAPI(`Analyze this file excerpt:\n${txt}`);
                this.addMessage(resp, 'ai');
            } catch (e) {
                this.addMessage('Error processing file', 'ai');
            }
        };
        reader.onerror = () => {
            this.addMessage('Could not read file', 'ai');
        };
        reader.readAsText(file);
    }

    startVoiceInput() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            this.addMessage('Voice not supported', 'ai');
            return;
        }

        const rec = new SR();
        rec.lang = 'en-US';
        this.addMessage('🎤 Listening...', 'ai');

        rec.onresult = (e) => {
            let text = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                text += e.results[i][0].transcript;
            }
            if (text && this.elements.input) {
                this.elements.input.value = text;
                this.sendMessage();
            }
        };

        rec.start();
    }

    changeTheme() {
        const themes = ['light', 'dark', 'blue', 'green'];
        const cur = localStorage.getItem('chatTheme') || 'dark';
        const next = themes[(themes.indexOf(cur) + 1) % themes.length];
        localStorage.setItem('chatTheme', next);
        if (this.elements.widget) {
            this.elements.widget.className = this.elements.widget.className.replace(/theme-\w+/, '');
            this.elements.widget.classList.add(`theme-${next}`);
        }
    }

    exportChat() {
        if (!this.elements.messages) return;
        const text = this.elements.messages.innerText;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.premiumChatbot = new PremiumChatbot();
});
