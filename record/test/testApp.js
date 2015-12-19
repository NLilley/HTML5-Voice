describe('app', function(){
    describe('Initialization', function(){
        it('Should have a global app object available to attach objects to', function(){
            (typeof app).should.equal('object');
        });

        it('Should export "actions"', function(){
            (typeof app.actions).should.equal('object');
        });

        it('Should export "stores"', function(){
            (typeof app.stores).should.equal('object');
        });

        it('Should export "listeners"', function(){
            (typeof app.listeners).should.equal('object');
        });

        it('Should export "notify"', function(){
            (typeof app.notify).should.equal('function');
        });
    })
});