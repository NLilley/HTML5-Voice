let app = app || {};

app.record = {};

(() => {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    let ac = new AudioContext();

    let SAMPLE_RATE = ac.sampleRate;
    let BUFFER_SIZE = 2048 * 8;

    let microphone;

    let users = app.stores.usersStore.getState();
    let clientSettings = app.stores.clientStore.getState();

    let speakerOutput = ac.createGain();
    speakerOutput.gain.value = clientSettings.speakerVolume;
    speakerOutput.connect(ac.destination);

    let microphoneOutput = ac.createGain();
    microphoneOutput.gain.value = clientSettings.microphoneVolume;

    let playSoundForUser = (audioData, user)=> {
        if (user.volume === 0) {
            return;
        }

        let outputSource = ac.createBufferSource();
        let userVolume = ac.createGain();
        userVolume.gain.value = user.volume;

        outputSource.connect(userVolume);
        userVolume.connect(speakerOutput);

        let fileReader = new FileReader();
        fileReader.addEventListener('loadend', () => {
            let f32 = new Float32Array(fileReader.result);
            let buffer = ac.createBuffer(1, BUFFER_SIZE, SAMPLE_RATE);
            buffer.copyToChannel(f32, 0, 0);
            outputSource.buffer = buffer;
            outputSource.start();
        });

        fileReader.readAsArrayBuffer(audioData);
    };

    app.record.play = (audioData, meta) => {
        if (users.hasOwnProperty(meta.userId)) {
            playSoundForUser(audioData, users[meta.userId]);
        } else {
            console.log('Audio data from unknown users received! Refusing to play it.');
        }
    };

    app.stores.usersStore.listen((updatedUsers) => {
        Object.assign(users, updatedUsers);
    });

    app.stores.clientStore.listen((updatedClient) => {
        Object.assign(clientSettings, updatedClient);
        speakerOutput.gain.value = clientSettings.speakerVolume;
        microphoneOutput.gain.value = clientSettings.microphoneVolume;
    });

    app.record.startRecording = () => {
        function prepareRecording(resolve, reject) {
            if (!navigator.getUserMedia) {
                app.notify('Unable to start recording', 'getUsermedia() is not supported in your browser.' +
                    '  You can still listen, but please try a different browser if you require recording.');
                return;
            }

            navigator.getUserMedia({audio: true},
                audioStream => {
                    console.log('Recording has begun:  WebSocket connection and Microphone feed acquired.');


                    microphone = audioStream;

                    let stream = ac.createMediaStreamSource(audioStream);

                    let processingNode = ac.createScriptProcessor(BUFFER_SIZE, 1, 1);

                    processingNode.onaudioprocess = function (data) {
                        let channel0 = data.inputBuffer.getChannelData(0);
                        app.ws.sendAudioData(channel0);
                    };

                    stream.connect(microphoneOutput); //Connect our microphone right to processing.
                    microphoneOutput.connect(processingNode);
                    processingNode.connect(ac.destination); //Hack for chrome.  Chrome requires that the node be connected to final output.

                    resolve();
                },
                err => {
                    console.error(err);
                    reject(err);

                });
        }

        return new Promise(prepareRecording)

    };

    app.record.stopRecording = _ => {
        if (microphone) {
            microphone.getAudioTracks().map(track => {
                track.stop()
            });
            if (microphone.stop) microphone.stop();
            console.log('Attempting to stop the microphone!');
            microphone = null;
        }
    };

})();

