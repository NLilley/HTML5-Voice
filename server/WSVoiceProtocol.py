from autobahn.twisted.websocket import WebSocketServerProtocol
from twisted.python import log
import sys

from WSUser import WSUser

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

        self.factory.users[self] = WSUser(username)

    def onClose(self, wasClean, code, reason):
        super(WSVoiceProtocol, self).onClose(wasClean, code, reason)
        print 'Closing down the connection!'
        self.factory.users.pop(self, None)

    def onMessage(self, payload, isBinary):
        super(WSVoiceProtocol, self).onMessage(payload, isBinary)
        if isBinary:
            for user in self.factory.users.keys():
                if user == self:  # todo !=
                    user.sendMessage(payload, isBinary=True)

        else:
            log.msg(payload)
