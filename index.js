class SpeechListenerExtension {
    constructor() {
        this.recognizer = null;
        this.listening = false;
        this.queue = [];
        this._initRecognizer();
    }

    _initRecognizer() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser does not support speech recognition.");
            return;
        }
        this.recognizer = new SpeechRecognition();
        this.recognizer.lang = 'en-US';
        this.recognizer.continuous = true;
        this.recognizer.interimResults = false;

        this.recognizer.onresult = (event) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    const text = event.results[i][0].transcript.trim();
                    this.queue.push(text);
                }
            }
        };

        this.recognizer.onend = () => {
            if (this.listening) this.recognizer.start(); // Restart if still listening
        };
    }

    _doStartListening() {
        if (!this.listening && this.recognizer) {
            this.queue = [];
            this.listening = true;
            this.recognizer.start();
        }
    }

    _doStopListening() {
        if (this.listening && this.recognizer) {
            this.listening = false;
            this.recognizer.stop();
        }
    }

    _doGetNextSentence() {
        if (this.queue.length > 0) {
            return this.queue.shift();
        }
        return "";
    }

    getInfo() {
        return {
            id: 'speechListener',
            name: 'Speech Listener',
            blocks: [
                {
                    opcode: 'cmdStartListening',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'turn listening on'
                },
                {
                    opcode: 'cmdStopListening',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'turn listening off'
                },
                {
                    opcode: 'repNextSentence',
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'next spoken sentence'
                }
            ]
        };
    }

    cmdStartListening() { this._doStartListening(); }
    cmdStopListening() { this._doStopListening(); }
    repNextSentence() { return this._doGetNextSentence(); }
}

Scratch.extensions.register(new SpeechListenerExtension());
