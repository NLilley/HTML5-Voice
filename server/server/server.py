import os
import sys

import twisted
from twisted.python import log
from twisted.web.server import Site
from twisted.web.static import File
from twisted.web.resource import Resource

from autobahn.twisted.resource import WebSocketResource

from WSVoiceProtocol import WSVoiceProtocol
from WSVoiceServerFactory import WSVoiceServerFactory


def handle_args(args):
    if len(args) < 2:
        return 80

    first = args[1]

    if first == "-h" or first == "--help":
        print "HTML 5 Voice Server"
        print "Usage: run this script followed by a port number to start the server.\n  If no port is provided" \
              " the server will default to port 80.\n  Ensure that you have the correct user privileges" \
              " to operate on the specified port."
        raise Exception('Only help information was requested.')

    return int(first)


def start_server(port):
    log.startLogging(sys.stdout)

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

    try:
        reactor.listenTCP(port, site)
        reactor.run()
    except twisted.internet.error.CannotListenError:
        print "Unable to bind to port {0}.  Are you sure this port isn't already in use?".format(port)
        sys.exit()
    except Exception as ex:
        print "Exception has occurred while trying to start up the twisted server."
        print ex


if __name__ == '__main__':
    try:
        port = handle_args(sys.argv)
    except ValueError:
        print "Please submit valid arguments"
        print "Valid arguments are -h, --help or <Port Number>"
        sys.exit(1)
    except:
        sys.exit(0)

    start_server(port)
