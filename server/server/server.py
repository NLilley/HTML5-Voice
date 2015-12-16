import os
import sys

from twisted.python import log
from twisted.web.server import Site
from twisted.web.static import File
from twisted.web.resource import Resource

from autobahn.twisted.resource import WebSocketResource

from WSVoiceProtocol import WSVoiceProtocol
from WSVoiceServerFactory import WSVoiceServerFactory

if __name__ == '__main__':
    log.startLogging(sys.stdout)

    arg = sys.argv[1] if len(sys.argv) > 1 else '80'

    if arg == "-h" or arg  == "--help":
        print "HTML 5 Voice Server"
        print "Usage: run this script followed by a port number to start the server.\n  If no port is provided" \
              " the server will default to port 80.\n  Ensure that you have the correct user privileges" \
              " to operate on the specified port."
        sys.exit(0)

    try:
        port = int(arg)
    except Exception as ex:
        print "Invalid command line argument."
        print "Acceptable command line arguments: -h, --help or port number."
        sys.exit(1)

    factory = WSVoiceServerFactory()
    factory.protocol = WSVoiceProtocol
    ws_resource = WebSocketResource(factory)


    class Home(Resource):
        def __init__(self):
            Resource.__init__(self)
            self.isLeaf = False
            self.static_dir = os.path.abspath(os.path.join(__file__, '../../static'))
            self.template_file = os.path.abspath(os.path.join(__file__, '../../static/record.html'))
            self.static = File(self.static_dir)

        def getChild(self, name, request):
            if name == '':
                return self
            return self.static.getChild(name, request)

        def render_GET(self, request):
            template_file = open(self.template_file, 'r')
            template_data = template_file.read()
            template_file.close()
            # return self.template
            return template_data


    root = Home()
    root.putChild(u'ws', ws_resource)
    site = Site(root)

    from twisted.internet import reactor

    reactor.listenTCP(port, site)
    reactor.run()
