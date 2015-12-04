/**
 * © Nicholas Lilley 2015
 */

let app = app || {};
(_ => {
    window.addEventListener('load', _ => {
        app.root = document.getElementById('react-app');
        ReactDOM.render(<Connect/>, app.root);
    }, false);

    let alt = new Alt();

    class AppActions {
        connectToServer(details) {
            this.dispatch(details);
        }

        disconnectFromServer() {
            this.dispatch();
        }

        updateUsers(users) {
            this.dispatch(users);
        }
    }

    app.actions = alt.createActions(AppActions);

    function createStore(actions) {
        let store = {
            actions: actions,
            listeners: [],
            state: {}
        };

        let getState = () => {
            return state
        };


        let listen = (callback)=> {
            if (store.listeners.indexOf(callback) == -1) {
                store.listeners.push(callback);
            }
        };

        let unlisten = (callback) => {
            let index = store.listeners.indexOf(callback);
            if (index != -1) {
                store.listeners.splice(index, 1);
            }
        };

        let onAction = (action) => {
            if (store.actions.hasOwnProperty(action.action)) {
                console.log(actions);
                store.actions[action.action](store, action);
            }
        };

        return {
            getState, listen, unlisten, onAction
        }
    }

    let updateUsersId = app.actions.updateUsers.id;
    let userStoreActions = {};
    userStoreActions[updateUsersId] = (store, action)=> {
        store.state = action.payload;
        store.listeners.map(listener => listener(action.payload));
    };

    let usersStore = createStore(userStoreActions);

    let dispatcher = alt.dispatcher;

    app.listeners = {};
    app.listeners.connectToServer = (action) => {
        let data = action.payload;
        switch (action.action) {
            case app.actions.connectToServer.id:
                ReactDOM.render(<Loading/>, app.root);

                app.ws.connect(data.serverAddress, data.serverPort, data.username)
                    .then(_ => {
                        ReactDOM.render(<VoiceMain/>, app.root);
                    })
                    .catch(err => {
                        ReactDOM.render(<Connect/>, app.root);
                        // todo Move this into a proper notification!
                        console.log('Unable to connect to server');
                        console.log(err);
                    });

                app.record.startRecording()
                    .then(()=> {
                        console.log('Recording Microphone input!');
                    })
                    .catch(err => {
                        console.error('Unable to get microphone input');
                        console.error(err);
                    });

                return true;

            case app.actions.disconnectFromServer.id:
                app.ws.disconnect();
                app.record.stopRecording();
                ReactDOM.render(<Connect/>, app.root);
                return true;

            default:
                return false;
        }
    };

    dispatcher.register(app.listeners.connectToServer);
    dispatcher.register(usersStore.onAction);

    let VoiceMain = React.createClass({
        render(){
            return (
                <div>
                    <VoiceHeader/>
                    <div className="main-content">
                        <Users className="users"/>
                        <Controls className="controls"/>
                    </div>
                </div>
            )
        }
    });

    let Users = React.createClass({
        getInitialState(){
            return {users: {}};
        },

        componentDidMount(){
            usersStore.listen(this.onChange);
        },

        componentWillUnmount(){
            usersStore.unlisten(this.onChange);
        },

        render(){
            return (
                <div className="users">
                    {
                        Object.keys(this.state.users).map(user => {
                            return <User key={user} username={this.state.users[user]}/>
                        })
                    }
                </div>
            )
        },

        onChange(state){
            this.setState(state);
        }

    });

    let User = React.createClass({
        render(){
            return (
                <div className="user">
                    {this.props.username}
                </div>
            )
        }
    });

    let Controls = React.createClass({
        render(){
            return (
                <div className="controls">
                    <StopButton onClick={this.stopConnection}/>
                </div>
            )
        },
        stopConnection(){
            app.actions.disconnectFromServer();
        }
    });

    let StopButton = React.createClass({
        render(){
            return (
                <IconButton text="Stop" icon="fa-stop" onClick={this.props.onClick}/>
            )
        }
    });

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
                    <span>{this.props.text}</span> <i className={"icon-button-icon float-right fa " + this.props.icon}/>
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
            app.actions.connectToServer({
                username: 'nilly',
                serverAddress: '127.0.0.1',
                serverPort: '80'
            });

            //let username = this.refs.username;
            //let serverAddress = this.refs.serverAddress;
            //let serverPort = this.refs.serverPort;
            //
            //if (username.state == null || serverAddress.state == null || serverPort.state == null) {
            //    console.log('All fields must be completed to connect server!');
            //    console.log('Also, put me in a notification!');
            //    return;
            //}
            //
            //connectActions.connectToServer({
            //    username: username.state.value,
            //    serverAddress: serverAddress.state.value,
            //    serverPort: serverPort.state.value
            //});
        }
    });
})();