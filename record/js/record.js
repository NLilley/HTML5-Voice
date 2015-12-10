let app = app || {};

app.record = {};

(() => {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    window.AudioCOntext = window.AudioContext || window.webkitAudioContext;

    let ac = new AudioContext();

    let SAMPLE_RATE = ac.sampleRate;
    let BUFFER_SIZE = 2048 * 8;

    let microphone;
    let recording = false;
    let chunks = [];

    let users = {};


    let playSoundForUser = (audioData, user)=> {
        if (user.volume === 0){
            return;
        }

        let outputSource = ac.createBufferSource();
        let gainNode = ac.createGain();
        gainNode.gain.value = user.volume;

        outputSource.connect(gainNode);
        gainNode.connect(ac.destination);

        let fileReader = new FileReader();
        fileReader.addEventListener('loadend', () => {
            let f32 = new Float32Array(fileReader.result);
            let buffer = ac.createBuffer(1, BUFFER_SIZE, SAMPLE_RATE);
            buffer.copyToChannel(f32, 0, 0); //todo fix this!
            outputSource.buffer = buffer;
            outputSource.start();
        });

        fileReader.readAsArrayBuffer(audioData);
    };

    app.record.play = (audioData, meta) => {
        if(users.hasOwnProperty(meta.userId)){
            playSoundForUser(audioData, users[meta.userId]);
        } else{
            console.log('Audio data from unknown users received! Refusing to play it.');
        }
    };

    app.stores.usersStore.listen((updatedUsers)=> {
        Object.assign(users, updatedUsers);
    });

    app.record.startRecording = () => {
        function prepareRecording(resolve, reject) {
            if (!navigator.getUserMedia) {
                alert('getUserMedia() is not supported in your browser');
                return;
            }

            navigator.getUserMedia({audio: true},
                audioStream => {
                    console.log('Recording has begun:  WebSocket connection and Microphone feed acquired.');
                    chunks = [];

                    microphone = audioStream;

                    let stream = ac.createMediaStreamSource(audioStream);
                    let processingNode = ac.createScriptProcessor(BUFFER_SIZE, 1, 1);

                    stream.connect(processingNode); //Connect our microphone right to processing.

                    processingNode.onaudioprocess = function (data) {
                        let channel0 = data.inputBuffer.getChannelData(0);
                        if (recording) {
                            chunks.push(channel0);
                        }
                        app.ws.sendAudioData(channel0);
                    };

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
            microphone.stop();
            microphone = null;
        }
    };

    app.record.playChunks = _ => {
        let totalLength = chunks.reduce((previous, current) => previous + current.length, 0);
        let recording = new Float32Array(totalLength);

        //let offset = 0;
        //chunks.forEach(chunk => {
        //    recording.set(chunk, offset);
        //    offset += chunk.length;
        //});

        chunks.reduce((prev, curr) => {
            recording.set(curr, prev);
            return prev + curr.length;
        }, 0);

        let ac = new AudioContext();

        let source = ac.createBufferSource();


        let buffer = ac.createBuffer(1, recording.length, ac.sampleRate);
        buffer.copyToChannel(recording, 0, 0);

        source.buffer = buffer;
        source.connect(ac.destination);
        source.start();
    };
})();

