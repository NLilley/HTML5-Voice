/**
 * © Nicholas Lilley 2015
 */

let app = app || {};
(_ => {
    window.addEventListener('load', _ => {
        //console.log('Starting App!');
        //let buttonStart = document.getElementById("start");
        //let buttonStop = document.getElementById("stop");
        //
        //let inputServerAddress = document.getElementById('server-address');
        //let inputServerPort = document.getElementById('server-port');
        //
        //let hostname = location.hostname || "localhost";
        //let port = location.port || 80;
        //
        //inputServerAddress.value = hostname;
        //inputServerPort.value = port;
        //
        //buttonStart.addEventListener('click', _ => {
        //    console.log(inputServerAddress.value);
        //    app.record.startRecording(inputServerAddress.value, inputServerPort.value);
        //}, false);
        //
        //buttonStop.addEventListener('click', _ => {
        //    app.record.stopRecording();
        //}, false)

        app.root = document.getElementById('react-app');
        ReactDOM.render(<Connect/>, app.root);

    }, false);

    let alt = new Alt();

    class AppActions {
        connectToServer(details) {
            this.dispatch(details);
        }

        disconnectFromServer() {
            this.patch();
        }
    }

    let connectActions = alt.createActions(AppActions);

    let dispatcher = alt.dispatcher;

    app.listeners = {};
    app.listeners.connectToServer = (action) => {
        if (action.action == connectActions.connectToServer.id) {
            ReactDOM.unmountComponentAtNode(app.root);
            ReactDOM.render(<Loading/>, app.root);
            console.log(action);
            app.record.startRecording(action.payload.serverAddress, action.payload.serverPort);
            return true;
        }
        return false;
    };

    dispatcher.register(app.listeners.connectToServer);


    let Loading = React.createClass({
        render(){
            return (
                <div>
                    Loading! todo: Make me pretty!
                </div>
            )
        }
    });

    let Connect = React.createClass({
        render() {
            return (

                <div>
                    <VoiceHeader/>
                    <ConnectionForm/>
                </div>
            )
        }
    });

    let VoiceHeader = React.createClass({
        render(){
            return (
                <header>HTML5 Voice <i className="fa fa-rss"/></header>
            )
        }
    });

    let IconButton = React.createClass({
        render(){
            return (
                <button className={this.props.className + " icon-button"} onClick={this.props.onClick}>
                    <span>{this.props.text}</span> <i className={"float-right fa " + this.props.icon}/>
                </button>
            )
        }
    });

    let StartButton = React.createClass({
        render(){
            return <IconButton text="Start" icon="fa-play" onClick={this.props.onClick}/>
        }
    });

    // todo Make it so the default values are automatically input!
    let TextInput = React.createClass({
        render(){
            return (
                <label>
                    {this.props.label}
                    <input type="text" placeholder={this.props.placeholder} onChange={this.onChange}/>
                </label>
            )
        },
        onChange(event){
            this.setState({value: event.target.value})
        }
    });


    let ConnectionForm = React.createClass({
        render(){
            return (
                <div className="div-border">
                    <main>
                        <div className="content">
                            <TextInput ref="username" label="Username" placeholder="My Name Here!"/>
                            <TextInput ref="serverAddress" label="Server Address"
                                       placeholder={location.hostname || 'localhost'}/>
                            <TextInput ref="serverPort" label="Server Port" placeholder={location.port || '80'}/>
                            <StartButton onClick={this.onClick}/>
                        </div>
                    </main>
                </div>
            )
        },
        onClick () {
            let username = this.refs.username;
            let serverAddress = this.refs.serverAddress;
            let serverPort = this.refs.serverPort;

            if (username.state == null || serverAddress.state == null || serverPort.state == null) {
                console.log('All fields must be completed to connect server!');
                console.log('Also, put me in a notification!');
                return;
            }

            connectActions.connectToServer({
                username: username.state.value,
                serverAddress: serverAddress.state.value,
                serverPort: serverPort.state.value
            });
        }
    });
})();