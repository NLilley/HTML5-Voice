from autobahn.twisted.websocket import WebSocketServerProtocol
from twisted.python import log
import sys

log.startLogging(sys.stdout)


class WSVoiceProtocol(WebSocketServerProtocol):
    def onConnect(self, request):
        super(WSVoiceProtocol, self).onConnect(request)
        print "Recieving a new connection!"
        if self.factory.users.__len__() >= self.factory.MAX_USERS:
            self.sendClose(3000, "Error:  Cannot accept connection as max connections already reached!")
        self.factory.users.append(self)

    def onClose(self, wasClean, code, reason):
        super(WSVoiceProtocol, self).onClose(wasClean, code, reason)
        print "Closing down the connection!"
        if self in self.factory.users:
            self.factory.users.remove(self)

    def onMessage(self, payload, isBinary):
        super(WSVoiceProtocol, self).onMessage(payload, isBinary)
        if isBinary:
            for user in self.factory.users:
                if user != self:
                    user.sendMessage(payload, isBinary=True)

        else:
            log.msg(payload)
