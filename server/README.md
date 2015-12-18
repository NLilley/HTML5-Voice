#HTML 5 Voice Server

This project is the server component of the HTML 5 Voice Project.  The server itself
is a Twisted http server utilising Autobahn WebSockets for data transport.  This project
is intended to be run with Python 2.7.

##Run:

>`pip install -r requirements.txt`

or

>`python -m pip install -r requirements.txt`

from the root server directory to install this projects requirements.

##Starting the Server:

To start the server, log in as a user with access to port 80 and then run the 
server/server.py script using:

>`python server/server.py`

You should now be able to connect to the server over localhost using a HTML5 Browser.

##Make sure to build the static files for this project using the gulp script in the record module of this project.

##Testing:

To run tests using unittest, go to the server root directory and run the following command:

>`python -m unittest discover`
