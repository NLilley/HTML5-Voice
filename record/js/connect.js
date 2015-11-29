let app = app || {};

(_ => {
    app.ws = {};
    let SERVER_TIMEOUT = 5000; //30 seconds

    let ws;

    app.ws.connect = (serverAddress, serverPort, username) => {

        let getConnection = (resolve, reject) => {

            ws = new WebSocket(`ws://${serverAddress}:${serverPort}/ws?username=${username}`);

            ws.onopen = _ => {
                console.log('Opening up WS Connection!');
                resolve();
            };

            ws.onmessage = msg => {
                app.record.play(msg);
            };

            ws.onclose = _ => {
                console.log('Closing WS connection!');
            };

            setInterval(_ => {
                if (ws.readyState !== 1) { // 0: connecting, 1: open, 2: closing, 3: closed
                    console.log("Rejecting getConnection!");
                    if (ws.readyState == 0) ws.close();

                    reject(new Error('Unable to create a websocket connection:  Timeout Reached'));
                }
            }, SERVER_TIMEOUT);
        };

        return new Promise(getConnection);
    };

    let isConnected = () => (ws && ws.readyState === 1);

    app.ws.isConnected = isConnected;

    app.ws.sendAudioData = (data) => {
        if(isConnected())
        ws.send(data);
    };

    app.ws.disconnect = () => {
        if (ws && ws.readyState === 1) {
            ws.close();
        }
    };

})();



