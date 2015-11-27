if __name__ == '__main__':
    import sys
    from WSVoiceProtocol import WSVoiceProtocol
    from WSVoiceServerFactory import WSVoiceServerFactory
    from autobahn.twisted.resource import WebSocketResource
    from twisted.python import log

    log.startLogging(sys.stdout)

    factory = WSVoiceServerFactory()
    factory.protocol = WSVoiceProtocol
    ws_resource = WebSocketResource(factory)

    from twisted.web.server import Site
    from twisted.web.static import File
    from twisted.web.resource import Resource


    class Home(Resource):
        isLeaf = False

        def __init__(self):
            Resource.__init__(self)
            self.isLeaf = False  # todo Make me good!

            # template_file = open('./static/record.html', 'r')
            # template_data = template_file.read()
            # template_file.close()
            # self.template = template_data

            self.static = File('./static')

        def getChild(self, name, request):
            if name == '':
                return self
            return self.static.getChild(name, request)

        def render_GET(self, request):
            template_file = open('./static/record.html', 'r')
            template_data = template_file.read()
            template_file.close()
            # return self.template
            return template_data


    root = Home()
    root.putChild(u'ws', ws_resource)
    site = Site(root)

    from twisted.internet import reactor

    reactor.listenTCP(80, site)
    reactor.run()
