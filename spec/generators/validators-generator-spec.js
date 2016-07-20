var should=require("chai").should();
var PropertyGenerator=require("../../src/synth-generators/src/property-generator.js");

describe("Validators", function(){

   it("should return true if the value is a string", function(){
      var validator=PropertyGenerator.TypeValidators["string"];
      validator("foo").should.equal(true);
      validator(1).should.equal(false);
   });

   it("should return true if the value is a number", function(){
      var validator=PropertyGenerator.TypeValidators["number"];
      validator(1).should.equal(true);
      validator("1").should.equal(false);
   });

   it("should return true if the value is a boolean", function(){
      var validator=PropertyGenerator.TypeValidators["boolean"];
      validator(false).should.equal(true);
      validator(1).should.equal(false);
   });

   it("should return true if the value is a date", function(){
      var validator=PropertyGenerator.TypeValidators["date"];
      validator(new Date()).should.equal(true);
      validator(1).should.equal(false);
   });
});
