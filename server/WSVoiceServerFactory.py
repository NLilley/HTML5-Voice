from autobahn.twisted.websocket import WebSocketServerFactory


class WSVoiceServerFactory(WebSocketServerFactory):
    users = {}
    MAX_USERS = 32
