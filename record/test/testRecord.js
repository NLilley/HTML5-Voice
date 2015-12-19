describe('app.record', function(){
    describe('Initialization', function(){
        it('Should have a global app object available to attach objects to', function(){
            (typeof app).should.equal('object');
        });

        it('Should create a record property on the app object', function(){
            (typeof app.record).should.equal('object');
        });

        it('Should export play', function(){
            (typeof app.record.play).should.equal('function');
        });

        it('Should export startRecording', function(){
            (typeof app.record.startRecording).should.equal('function');
        });

        it('Should export stopRecording', function(){
            (typeof app.record.stopRecording).should.equal('function');
        });
    });
});