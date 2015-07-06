describe("Validators", function(){

   it("should return true if the value is a string", function(){
      var validator=Synth.TypeValidators["string"];
      validator("foo").should.equal(true);
      validator(1).should.equal(false);
   });

   it("should return true if the value is a number", function(){
      var validator=Synth.TypeValidators["number"];
      validator(1).should.equal(true);
      validator("1").should.equal(false);
   });

   it("should return true if the value is a boolean", function(){
      var validator=Synth.TypeValidators["boolean"];
      validator(false).should.equal(true);
      validator(1).should.equal(false);
   });

   it("should return true if the value is a date", function(){
      var validator=Synth.TypeValidators["date"];
      validator(new Date()).should.equal(true);
      validator(1).should.equal(false);
   });
});
