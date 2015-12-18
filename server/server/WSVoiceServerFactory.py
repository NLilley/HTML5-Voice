from autobahn.twisted.websocket import WebSocketServerFactory

from WSUser import WSUser


class WSVoiceServerFactory(WebSocketServerFactory):
    def __init__(self, *args, **kwargs):
        super(WSVoiceServerFactory, self).__init__(*args, **kwargs)
        self.users = {}
        self.MAX_USERS = 32
        self.id_counter = 1

    def add_user(self, connection, username):
        """
        Add a connection to the users dictionary
        :param connection: the connection object which can be used to communicate with users.
        :param username: name of the user.
        :return: None
        """
        self.users[connection] = WSUser(self.id_counter, username)
        self.id_counter += 1

    def remove_user(self, connection):
        """
        Remove a user with the connection 'connection'
        :param connection: The users connection
        :return: None
        """
        self.users.pop(connection, None)
