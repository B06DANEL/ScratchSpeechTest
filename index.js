class SpeechListenerExtension {
    constructor() {
        this.recognizer = null;
        this.listening = false;
        this.queue = [];
        this.language = 'auto'; // Default mode
        this.lastDetectedLang = 'en-US';
        this.autoMode = true;
        this._initRecognizer();
    }

    _initRecognizer() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser does not support speech recognition.");
            return;
        }
        this.recognizer = new SpeechRecognition();
        this.recognizer.lang = this.autoMode ? this.lastDetectedLang : this.language;
        this.recognizer.continuous = true;
        this.recognizer.interimResults = false;

        this.recognizer.onresult = (event) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    const text = event.results[i][0].transcript.trim();
                    this.queue.push(text);

                    // Auto mode language detection
                    if (this.autoMode) {
                        const detected = this._detectLanguage(text);
                        if (detected && detected !== this.lastDetectedLang) {
                            this.lastDetectedLang = detected;
                            if (this.listening) {
                                this.recognizer.stop();
                                setTimeout(() => this._startRecognizer(), 300);
                            }
                        }
                    }
                }
            }
        };

        this.recognizer.onend = () => {
            if (this.listening) this.recognizer.start();
        };
    }

    _startRecognizer() {
        if (!this.recognizer) this._initRecognizer();
        this.recognizer.lang = this.autoMode ? this.lastDetectedLang : this.language;
        this.recognizer.start();
    }

    _doStartListening() {
        if (!this.listening && this.recognizer) {
            this.queue = [];
            this.listening = true;
            this._startRecognizer();
        }
    }

    _doStopListening() {
        if (this.listening && this.recognizer) {
            this.listening = false;
            this.recognizer.stop();
        }
    }

    _doGetNextSentence() {
        return this.queue.length > 0 ? this.queue.shift() : "";
    }

    _setLanguage(mode) {
        if (mode === 'auto') {
            this.autoMode = true;
            this.language = 'auto';
        } else {
            this.autoMode = false;
            this.language = mode;
        }
        if (this.listening) {
            this._doStopListening();
            this._doStartListening();
        }
    }

    // Quick heuristic-based detection
    _detectLanguage(text) {
        text = text.toLowerCase();
        const langHints = {
            'ro-RO': ['și', 'este', 'nu', 'da', 'mulțumesc', 'ce'],
            'en-US': ['the', 'is', 'are', 'yes', 'no', 'thank'],
            'es-ES': ['el', 'la', 'de', 'gracias', 'sí', 'no'],
            'fr-FR': ['le', 'la', 'de', 'merci', 'oui', 'non'],
            'de-DE': ['der', 'die', 'das', 'und', 'ja', 'nein'],
            'it-IT': ['il', 'la', 'di', 'grazie', 'sì', 'no'],
            'ru-RU': ['и', 'да', 'нет', 'спасибо', 'привет'],
            'zh-CN': ['的', '是', '不', '谢谢'],
            'ja-JP': ['はい', 'いいえ', 'ありがとう', '私']
        };
        for (const [langCode, hints] of Object.entries(langHints)) {
            if (hints.some(word => text.includes(word))) {
                return langCode;
            }
        }
        return this.lastDetectedLang;
    }

    getInfo() {
        return {
            id: 'speechListener',
            name: 'Speech Listener',
            blocks: [
                { opcode: 'cmdStartListening', blockType: Scratch.BlockType.COMMAND, text: 'turn listening on' },
                { opcode: 'cmdStopListening', blockType: Scratch.BlockType.COMMAND, text: 'turn listening off' },
                { opcode: 'repNextSentence', blockType: Scratch.BlockType.REPORTER, text: 'next spoken sentence' },
                { opcode: 'repCurrentLanguage', blockType: Scratch.BlockType.REPORTER, text: 'current detected language' },
                {
                    opcode: 'cmdSetLanguage',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'set listening language to [LANG]',
                    arguments: {
                        LANG: {
                            type: Scratch.ArgumentType.STRING,
                            menu: 'languageMenu'
                        }
                    }
                }
            ],
            menus: {
                languageMenu: {
                    acceptReporters: true,
                    items: [
                        { text: 'Auto detect', value: 'auto' },
                        { text: 'English (US)', value: 'en-US' },
                        { text: 'English (UK)', value: 'en-GB' },
                        { text: 'Spanish', value: 'es-ES' },
                        { text: 'French', value: 'fr-FR' },
                        { text: 'German', value: 'de-DE' },
                        { text: 'Italian', value: 'it-IT' },
                        { text: 'Romanian', value: 'ro-RO' },
                        { text: 'Russian', value: 'ru-RU' },
                        { text: 'Chinese (Mandarin)', value: 'zh-CN' },
                        { text: 'Japanese', value: 'ja-JP' }
                    ]
                }
            }
        };
    }

    cmdStartListening() { this._doStartListening(); }
    cmdStopListening() { this._doStopListening(); }
    repNextSentence() { return this._doGetNextSentence(); }
    repCurrentLanguage() { return this.autoMode ? this.lastDetectedLang : this.language; }
    cmdSetLanguage({ LANG }) { this._setLanguage(LANG); }
}

Scratch.extensions.register(new SpeechListenerExtension());
