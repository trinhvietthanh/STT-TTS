var ASREngine = (function (global, EventEmitter) {
    var WAIT_TIMEOUT = 4000;
    var RESTART_INTERVAL = 600;

    var SpeechRecognition = global.SpeechRecognition || global.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        throw 'Browser does not support speech recognition';
    }

    function SpeechEngine(lang) {
        var self = this;
        EventEmitter.apply(this);
        var recognition = new SpeechRecognition();
        recognition.lang = lang;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.continuous = true;

        self.listening = false;
        self.lastResult = null;
        self.lastStartedAt = 0;
        self.interimTimeoutHandle = null;
        

        recognition.onstart = function () {
            self.emit('start');
        };

        recognition.onaudiostart = function () {
            self.emit('audiostart');
        };

        recognition.onaudioend = function () {
            self.emit('audioend');
        };

        recognition.onspeechstart = function () {
            self.emit('speechstart');
        };

        recognition.onspeechend = function () {
            self.emit('speechend');
        };

        recognition.onerror = function (e) {
            var error = e.error;
            self.emit(e);
            switch (error) {
                case 'no-speech':
                case 'network':
                case 'aborted':
                    restartListen();
                    break;
                case 'not-allowed':
                case 'service-not-allowed':
                    alert('A permission error occured. Please clean browser cache and restart');
                    break;
            }
        };

        recognition.onend = function () {
            if (self.listening) {
                if (self.lastResult) {
                    sendResult(self.lastResult);
                }
                restartListen();
            } else {
                self.emit('ended');
            }
        };

        recognition.onresult = function (r) {
            var results = r.results;
            if (typeof results === 'undefined') {
                console.warn('we have an undefined result');
                restartListen();
                return;
            }
            var result = results[0];
            if (result.isFinal) {
                //Final results
                sendResult(resultToText(result));
            } else {
                //i.e. interim...
                result = resultToText(result);
                self.lastResult = result;
                self.emit("interim", {
                    result: result
                });
                clearTimeout(self.interimTimeoutHandle);
                self.interimTimeoutHandle = setTimeout(function () {
                    if (self.lastResult) {
                        sendResult(self.lastResult);
                    }
                }, WAIT_TIMEOUT);
            }
        };

        function startListen() {
            self.listening = true;
            self.lastStartedAt = new Date().getTime();
            try {
                recognition.start();
            } catch (e) {
                //
            }
        }

        function stopListen() {
            self.listening = false;
            self.lastResult = '';
            recognition.stop();
        }

        function restartListen() {
            var timeSinceLastStart = new Date().getTime() - self.lastStartedAt;
            self.autorestartCount += 1;

            if (self.autorestartCount % 10 === 0) {
                console.warn('Speech Recognition is repeatedly stopping and starting.maybe you have two windows with speech recognition open?');
            }

            var timeout = RESTART_INTERVAL - timeSinceLastStart;
            if (timeout > 0) {
                setTimeout(function () {
                    return startListen();
                }, timeout);
            } else {
                startListen();
            }
        }

        function sendResult(result) {
            self.lastResult = '';
            self.emit("recognized", {
                result: result,
                startedAt: self.lastStartedAt
            });
            recognition.stop();
            clearTimeout(self.interimTimeoutHandle);
        }

        function resultToText(result) {
            var combined = [];
            var i;
            for (i = 0; i< result.length; i++) {
                combined.push(result[i].transcript);
            }
            return combined.join(' ');
        }

        this.start = function () {
            return new Promise(function (resolve, reject) {
                self.once("start", function () {
                    return resolve();
                });

                startListen();
            });
        };

        this.stop = function () {
            return new Promise(function (resolve, reject) {
                self.once("ended", function () {
                    return resolve();
                });
                try {
                    stopListen();
                } catch (error) {
                    reject(error);
                }
            });
        };

        this.setLang = function (lang) {
            recognition.lang = lang;
            restartListen();
        }
    }

    SpeechEngine.prototype = EventEmitter.prototype;
    SpeechEngine.prototype.constructor = SpeechEngine;

    return SpeechEngine;
})(window || global, EventEmitter);