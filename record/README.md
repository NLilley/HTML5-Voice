#HTML5 Voice Client

This project runs in the browser and uses HTML5 Audio APIs and WebSockets to stream
audio data.

#Build:

Fetch dependencies by running

>`npm install`



This project uses ES6 with gulp as a build tool so you will also need gulp and babel 6 installed.

>`npm i -g gulp babel-cli`

Now run gulp to build.  The gulp file will also deploy all required static files into the
static folder of the sibling server project.

With these files built and deployed and the twisted server running (see the server project for details) you should
be good to go.