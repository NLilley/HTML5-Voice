/**
 * © Nicholas Lilley 2015
 */

let app = app || {};
(_ => {
    window.addEventListener('load', _ => {
        console.log('Starting App!');
        let buttonStart = document.getElementById("start");
        let buttonStop = document.getElementById("stop");

        let inputServerAddress = document.getElementById('server-address');
        let inputServerPort = document.getElementById('server-port');

        let hostname = location.hostname || "localhost";
        let port = location.port || 80;

        inputServerAddress.value = hostname;
        inputServerPort.value = port;


        buttonStart.addEventListener('click', _ => {
            console.log(inputServerAddress.value);
            app.record.startRecording(inputServerAddress.value, inputServerPort.value);
        }, false);

        buttonStop.addEventListener('click', _ => {
            app.record.stopRecording();
        }, false)

    }, false);
})();