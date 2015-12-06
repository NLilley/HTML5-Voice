import json
import sys
import struct
from autobahn.twisted.websocket import WebSocketServerProtocol
from twisted.python import log

log.startLogging(sys.stdout)


class WSVoiceProtocol(WebSocketServerProtocol):
    def onConnect(self, request):
        super(WSVoiceProtocol, self).onConnect(request)
        print 'Recieving a new connection!'

        username = request.params['username'][0] if 'username' in request.params else None

        if self.factory.users.__len__() >= self.factory.MAX_USERS:
            self.sendClose(3000, 'Error:  Cannot accept connection as max connections already reached!')
            return

        if not username:
            self.sendClose(3000, 'Error: You must specify a username to use this service!')
            return

        self.factory.add_user(self, username)

    def onClose(self, wasClean, code, reason):
        super(WSVoiceProtocol, self).onClose(wasClean, code, reason)
        print 'Closing down the connection!'
        self.factory.remove_user(self)

    def onMessage(self, payload, isBinary):
        super(WSVoiceProtocol, self).onMessage(payload, isBinary)

        if isBinary:
            self.handle_binary(payload)

        else:
            self.handle_message(payload)

    def handle_binary(self, payload):
        header = []
        header.append(struct.pack("I", self.factory.users[self].id))  # The id of the sender
        header.append('beef' * 15)  # Pad in another 60 bytes for future use if needed, bringing header to 64 bytes.

        payload = ''.join(header) + payload  # prepend header

        for user in self.factory.users.keys():
            if user == self:  # todo !=
                user.sendMessage(payload, isBinary=True)

    def handle_message(self, payload):
        log.msg(payload)
        message = json.loads(payload)

        if 'type' in message:
            if message['type'] in message_router:
                response = message_router[message['type']](self)
            else:
                bad_message_type = {
                    'type': 'Unknown Message Type',
                    'payload': message['type']
                }
                response = json.dumps(bad_message_type)
        else:
            bad_message_format = {
                'type': 'Bad Message Format',
                'payload': 'The message sent was in an unreadable format'
            }
            response = json.dumps(bad_message_format)

        self.sendMessage(response)


def user_list(connection):
    """
    :param connection: The connection
    :return:  Return a list of users and their ids
    """
    response = {
        'type': 'users',
        'payload': {
            'users':
                {user.id: user.username for conn, user in connection.factory.users.iteritems()
                 if conn is not connection}
        }
    }

    return json.dumps(response)


message_router = {
    "get users": user_list
}
