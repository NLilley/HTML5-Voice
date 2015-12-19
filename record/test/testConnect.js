describe("app.ws", function () {
    describe("Initialization", function () {
        it('Should have a global app object available to attach objects to', function () {
            (typeof app).should.not.equal(undefined);
        });

        it('Should create the ws property on the app object', function () {
            (typeof app.ws).should.not.equal(undefined);
        });

        it('Should export connect', function () {
            (typeof app.ws.connect).should.equal('function');
        });

        it('Should export isConnected', function () {
            (typeof app.ws.isConnected).should.equal('function');
        });

        it('Should export sendAudioData', function () {
            (typeof app.ws.sendAudioData).should.equal('function');
        });

        it('Should export disconnect', function () {
            (typeof app.ws.disconnect).should.equal('function');
        });

        it('Should export getUsers', function () {
            (typeof app.ws.getUsers).should.equal('function');
        });

    });
});


