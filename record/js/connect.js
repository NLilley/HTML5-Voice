let app = app || {};

(_ => {
    app.ws = {};
    let SERVER_TIMEOUT = 5000; //30 seconds

    let address = 'localhost';
    let port = '80';

    let getConnection = (resolve, reject) => {

        let isConnected = false;
        let ws = new WebSocket('ws://' + address + ':' + port + '/ws');

        ws.onopen = _ => {
            console.log('Opening up WS Connection!');
            isConnected = true;
            resolve(ws);
        };

        ws.onmessage = msg => {
            //console.log("Recieving Message!");
            //console.log(msg);
        };

        ws.onclose = _ => {
            console.log('Closing WS connection!');
        };

        setInterval(_ => {
            if (!isConnected) {
                console.log("Rejecting getConnection!");
                reject(new Error('Unable to create a websocket connection:  Timeout Reached'));
                ws.close();
            }
        }, SERVER_TIMEOUT);
    };

    app.ws.startConnection = (serverAddress, serverPort) => {
        address = serverAddress;
        port = serverPort;
        return new Promise(getConnection);
    };

})();



