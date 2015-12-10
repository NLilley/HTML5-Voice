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

        setUserVolume(userId, volume) {
            this.dispatch({
                userId: userId,
                volume: volume
            });
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
                store.actions[action.action](store, action);
            }
        };

        return {
            getState, listen, unlisten, onAction
        }
    }

    let userStoreActions = {};

    userStoreActions[app.actions.updateUsers.id] = (store, action)=> {
        if (store.state.users == null) store.state.users = {};

        let updatedUsers = action.payload.users;

        // Remove users that are no longer online from the store.
        Object.keys(store.state.users).map(userId => {
            if (!updatedUsers.hasOwnProperty(userId)) {
                delete store.state.users[userId];
            }
        });

        // Add any new users to the user store
        Object.keys(updatedUsers).map(userId => {
            if (!store.state.users.hasOwnProperty(userId)) {
                store.state.users[userId] = {username: updatedUsers[userId], volume: 1.0}
            }
        });

        store.listeners.map(listener => listener(store.state.users));
    };

    userStoreActions[app.actions.setUserVolume.id] = (store, action)=> {
        var msg = action.payload;
        if (store.state.users.hasOwnProperty(msg.userId)) {
            store.state.users[msg.userId].volume = msg.volume;
        }

        store.listeners.map(listener => listener(store.state.users));
    };

    app.stores = {};
    app.stores.usersStore = createStore(userStoreActions);

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
    dispatcher.register(app.stores.usersStore.onAction);

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
            app.stores.usersStore.listen(this.onChange);
        },

        componentWillUnmount(){
            app.stores.usersStore.unlisten(this.onChange);
        },

        render(){
            return (
                <div className="users">
                    {
                        Object.keys(this.state.users).length > 0 ? Object.keys(this.state.users).map(user => {
                            return <User key={user}
                                         userId={user}
                                         username={this.state.users[user].username}
                                         volume={this.state.users[user].volume}
                            />
                        }) : 'There are currently no logged in users!'
                    }
                </div>
            )
        },

        onChange(state){
            this.setState({users: state});
        }

    });

    let User = React.createClass({
        render(){
            return (
                <div className="user">
                    {this.props.username}
                    <MuteButton onClick={this.onMute}/>
                    <VolumeSlider ref="volume" onChange={this.onVolumeChange} volume={this.props.volume}/>
                </div>
            )
        },

        onVolumeChange(event){
            app.actions.setUserVolume(this.props.userId, parseFloat(event.target.value));
        },

        onMute(){
            //app.actions.setUserVolume(this.props.userId, 0);
            let slider = ReactDOM.findDOMNode(this.refs.volume);
            slider.value = 0;
            this.onVolumeChange({target: {value: 0.0}}); //Force the react component to update


        }
    });

    let MuteButton = React.createClass({
        render(){
            return <i className="mute-button fa fa-volume-up" onClick={this.props.onClick}/>
        }
    });

    let VolumeSlider = React.createClass({
        getDefaultProps(){
            return {
                volume: 1.0
            }
        },
        render(){
            return <input type="range" onChange={this.props.onChange} min="0" max="2" step="0.02"
                          defaultValue={this.props.volume}/>
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
            let usernameCompontent = this.refs.username;
            let serverAddressCompotnent = this.refs.serverAddress;
            let serverPortComponent = this.refs.serverPort;

            let username = usernameCompontent.state ? usernameCompontent.state.value || usernameCompontent.props.placeholder : usernameCompontent.props.placeholder;
            let serverAddress = serverAddressCompotnent.state ? serverAddressCompotnent.state.value || serverAddressCompotnent.props.placeholder : serverAddressCompotnent.props.placeholder;
            let serverPort = serverPortComponent.state ? serverPortComponent.state.value || serverPortComponent.props.placeholder : serverPortComponent.props.placeholder;

            app.actions.connectToServer({
                username: username,
                serverAddress: serverAddress,
                serverPort: serverPort
            });
        }
    });
})();