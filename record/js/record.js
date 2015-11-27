let app = app || {};

app.record = {};

(_ => {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    window.AudioCOntext = window.AudioContext || window.webkitAudioContext;

    let ws;
    let audio;

    let recording = true;
    let chunks = [];


    app.record.startRecording = (address, port) => {
        if (!navigator.getUserMedia) {
            alert('getUserMedia() is not supported in your browser');
            return;
        }

        app.ws.startConnection(address, port).then(socket => {
            ws = socket;
            navigator.getUserMedia({audio: true},
                audioStream => {
                    console.log('Recording has begun:  WebSocket connection and Microphone feed acquired.');

                    chunks = [];

                    audio = audioStream;
                    let ac = new AudioContext();
                    let SAMPLE_RATE = ac.sampleRate;
                    let BUFFER_SIZE = 2048 * 8;
                    let microphone = ac.createMediaStreamSource(audioStream);
                    let processingNode = ac.createScriptProcessor(BUFFER_SIZE, 1, 1);

                    microphone.connect(processingNode); //Connect our microphone right to processing.

                    processingNode.onaudioprocess = function (data) {
                        let channel0 = data.inputBuffer.getChannelData(0);
                        if (recording) {
                            chunks.push(channel0);
                        }
                        ws.send(channel0);
                    };


                    let fileReader = new FileReader();

                    ws.onmessage = data => {
                        fileReader.readAsArrayBuffer(data.data);
                    };

                    fileReader.addEventListener('loadend', _ => {
                        let outputSource = ac.createBufferSource();
                        outputSource.connect(ac.destination);

                        let f32 = new Float32Array(fileReader.result);
                        let buffer = ac.createBuffer(1, BUFFER_SIZE, SAMPLE_RATE);
                        buffer.copyToChannel(f32, 0, 0); //todo fix this!


                        outputSource.buffer = buffer;
                        outputSource.start();

                    });


                },
                err => {
                    ws.close(1000, 'Connection unnecessary due to client.');
                    console.error(err);
                    alert('Unable to start recording:  Microphone unavailable.');

                });
        }).catch(err => {
            console.error(err);
            alert('Unable to start recording:  WebSocket server was unavailable.');
        });
    };

    app.record.stopRecording = _ => {
        if (ws != null) ws.close();
        if (audio != null) audio.stop();
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

