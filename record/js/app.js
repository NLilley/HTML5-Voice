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

        setSpeakerVolume(volume) {
            this.dispatch(volume);
        }

        setMicrophoneVolume(volume) {
            this.dispatch(volume);
        }
    }

    app.actions = alt.createActions(AppActions);

    /**
     * Create a store which can be listened to.
     * @param actions An object mapping actions to functions which manipulate the value of the action
     * @param init A function to set up the store
     * @returns {{getState: getState, listen: listen, unlisten: unlisten, onAction: onAction}}
     */
    function createStore(actions, init) {
        let store = {
            actions: actions,
            listeners: [],
            state: {}
        };

        init(store.state);

        let getState = () => {
            return Object.assign({}, store.state);
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
        let msg = action.payload;
        if (store.state.users.hasOwnProperty(msg.userId)) {
            store.state.users[msg.userId].volume = msg.volume;
        }

        store.listeners.map(listener => listener(store.state.users));
    };

    let initUserStore = state => {
        state.users = {};
    };

    let clientStoreActions = {};

    clientStoreActions[app.actions.setSpeakerVolume.id] = (store, action) => {
        store.state.speakerVolume = action.payload;
        store.listeners.map(listener => listener(store.state));
    };

    clientStoreActions[app.actions.setMicrophoneVolume.id] = (store, action) => {
        store.state.microphoneVolume = action.payload;
        store.listeners.map(listener => listener(store.state));
    };

    let initClientStore = state => {
        state.speakerVolume = 1.0;
        state.microphoneVolume = 1.0;
    };

    app.stores = {};
    app.stores.usersStore = createStore(userStoreActions, initUserStore);
    app.stores.clientStore = createStore(clientStoreActions, initClientStore);

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
    dispatcher.register(app.stores.clientStore.onAction);

    let VoiceMain = React.createClass({
        render(){
            return (
                <div>
                    <VoiceHeader/>
                    <div className="main-content">
                        <Controls className="controls"/>
                        <Users className="users"/>
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
                <VolumeWidget volume={this.props.volume}
                              label={this.props.username}
                              onMute={this.onMute}
                              onVolumeChange={this.onVolumeChange}/>
            )
        },

        onVolumeChange(event){
            app.actions.setUserVolume(this.props.userId, parseFloat(event.target.value));
        },

        onMute(){
            this.onVolumeChange({target: {value: 0.0}}); //Force the react component to update
        }
    });

    let VolumeWidget = React.createClass({
        render(){
            return (
                <div className="user">
                    <span dangerouslySetInnerHTML={{__html: this.props.label}}/>
                    <MuteButton onClick={this.onMute} volume={this.props.volume}/>
                    <VolumeSlider ref="volume" onChange={this.props.onVolumeChange} volume={this.props.volume}/>
                </div>
            )
        },

        onMute(){
            let slider = ReactDOM.findDOMNode(this.refs.volume);
            slider.value = 0;
            this.props.onMute();
        }
    });

    let VolumeSlider = React.createClass({
        getDefaultProps(){
            return {
                volume: 1.0
            }
        },
        render(){
            return <input type="range" className="volume-slider" onChange={this.props.onChange} min="0" max="1.6"
                          step="0.02"
                          defaultValue={this.props.volume}/>
        }
    });

    let MuteButton = React.createClass({
        render(){
            let icon;

            if (this.props.volume <= 0.7 && this.props.volume !== 0) {
                icon = 'fa-volume-down';
            } else if (this.props.volume === 0) {
                icon = 'fa-volume-off';
            } else {
                icon = 'fa-volume-up';
            }

            return <i className={"mute-button fa " + icon} onClick={this.props.onClick}/>;
        }
    });


    let Controls = React.createClass({
        getInitialState(){
            return app.stores.clientStore.getState();
        },

        componentDidMount(){
            app.stores.clientStore.listen(this.onStateChange);
        },

        componentWillUnmount(){
            app.stores.clientStore.unlisten(this.onStateChange);
        },

        render(){
            return (
                <div className="controls">
                    <VolumeWidget volume={this.state.speakerVolume}
                                  label='<i class="fa fa-2x fa-rss"></i>'
                                  onMute={this.onSpeakerMute}
                                  onVolumeChange={this.onSpeakerVolumeChange}/>

                    <VolumeWidget volume={this.state.microphoneVolume}
                                  label='<i class="fa fa-2x fa-microphone"></i>'
                                  onMute={this.onMicrophoneMute}
                                  onVolumeChange={this.onMicrophoneVolumeChange}/>

                    <StopButton className="stop-button" onClick={this.stopConnection}/>

                </div>
            )
        },
        stopConnection(){
            app.actions.disconnectFromServer();
        },
        onStateChange(state){
            this.setState(state);
        },
        onSpeakerVolumeChange(event){
            app.actions.setSpeakerVolume(parseFloat(event.target.value));
        },
        onSpeakerMute(){
            this.onSpeakerVolumeChange({target: {value: 0.0}});
        },
        onMicrophoneVolumeChange(event){
            app.actions.setMicrophoneVolume(parseFloat(event.target.value));
        },
        onMicrophoneMute(){
            this.onMicrophoneVolumeChange({target: {value: 0.0}});
        }

    });

    let StopButton = React.createClass({
        render(){
            return (
                <IconButton className={this.props.className} text="STOP" icon="fa-stop" onClick={this.props.onClick}/>
            )
        }
    });

    let Loading = React.createClass({
        render(){
            return (
                <div className="div-border">
                    <main>
                        <div className="content">
                            <h1>Loading</h1>
                            <img
                                src="data:image/gif;base64,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"/>
                        </div>
                    </main>
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
            return <IconButton text="START" icon="fa-play" onClick={this.props.onClick}/>
        }
    });

    let TextInput = React.createClass({
        render(){
            return (
                <label>
                    {this.props.label}
                    <input type="text" className={this.props.className} placeholder={this.props.placeholder}
                           onChange={this.onChange}/>
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
                            <TextInput ref="username" className="text-input" label="Username"
                                       placeholder="My Name Here!"/>
                            <TextInput ref="serverAddress" className="text-input" label="Server Address"
                                       placeholder={location.hostname || 'localhost'}/>
                            <TextInput ref="serverPort" className="text-input" label="Server Port"
                                       placeholder={location.port || '80'}/>
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