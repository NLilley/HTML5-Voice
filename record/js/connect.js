let app = app || {};

//export function cow(){
//    console.log('cow goes moo!');
//}

(_ => {
    app.ws = {};
    let SERVER_TIMEOUT = 5000; //30 seconds

    let ws;

    let events = {
        'users': [(data)=> {
            app.actions.updateUsers(data);
        }]
    };

    app.ws.connect = (serverAddress, serverPort, username) => {

        let getConnection = (resolve, reject) => {

            ws = new WebSocket(`ws://${serverAddress}:${serverPort}/ws?username=${username}`);

            ws.onopen = _ => {
                console.log('Opening up WS Connection!');
                resolve();
            };

            ws.onmessage = msg => {
                if (msg.data instanceof Blob) {
                    let audioData = msg.data.slice(64);
                    let messageHeader = msg.data.slice(0, 64);

                    let messageReader = new FileReader();
                    messageReader.onload = event => {
                        let msgMeta = {};
                        msgMeta.userId = new Uint32Array(event.target.result.slice(0, 4))[0];
                        app.record.play(audioData, msgMeta);

                    };
                    messageReader.readAsArrayBuffer(messageHeader);

                    return;

                }

                //Non-binary messages
                let data = JSON.parse(msg.data);
                let type = data.type;
                if (events.hasOwnProperty(type)) {
                    events[type].map(callback => callback(data.payload));
                }
            };

            ws.onclose = () => {
                console.log('Closing WS connection!');
                console.log(ws);
                app.actions.disconnectFromServer();
            };

            ws.onerror = () => {
                reject(new Error('Unable to create websocket connection:  Error.'));
            };

            setTimeout(_ => {
                if (ws.readyState !== 1) { // 0: connecting, 1: open, 2: closing, 3: closed
                    reject(new Error('Unable to create a websocket connection:  Timeout Reached.'));
                    if (ws.readyState == 0) ws.close();
                }
            }, SERVER_TIMEOUT);
        };

        return new Promise(getConnection);
    };

    let isConnected = () => (ws && ws.readyState === 1);

    app.ws.isConnected = isConnected;

    app.ws.sendAudioData = (data) => {
        if (isConnected())
            ws.send(data);
    };

    app.ws.disconnect = () => {
        if (ws && ws.readyState === 1) {
            ws.close();
        }
    };

    app.ws.getUsers = () => {
        if (isConnected()) {
            let message = {
                type: 'get users'
            };

            ws.send(JSON.stringify(message));
        }
    };
})();



