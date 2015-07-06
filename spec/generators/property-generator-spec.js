describe("Attribute Setters", function(){

   var o={};

   it("should set a string attribute on the given object", function(){
      var setter=Synth.generate("setter", {"name":"stringKey", "type":"string"});
      setter.call(o, "str");
      o.stringKey.should.equal("str");
   });

   it("should set a number attribute on the given object", function(){
      var setter=Synth.generate("setter", {"name":"numberKey", "type":"number"});
      setter.call(o, 1);
      o.numberKey.should.equal(1);
   });

   it("should set a string attribute on the given object", function(){
      var setter=Synth.generate("setter", {"name":"booleanKey", "type":"boolean"});
      setter.call(o, false);
      o.booleanKey.should.equal(false);
   });

   it("should set a string attribute on the given object", function(){
      var setter=Synth.generate("setter", {"name":"dateKey", "type":"date"});
      setter.call(o, new Date());
      o.dateKey.should.be.a("date");
   });
});

describe("Attribute Getters", function(){

   var o={
      stringKey: "str",
      numberKey:1,
      booleanKey: false,
      dateKey: new Date(),
   };

   it("should get a string attribute of the given object", function(){
      var getter=Synth.generate("getter", {"name":"stringKey", "type":"string"});
      getter.call(o).should.equal("str");
   });

   it("should get a number attribute of the given object", function(){
      var getter=Synth.generate("getter", {"name":"numberKey", "type":"number"});
      getter.call(o).should.equal(1);
   });

   it("should get a boolean attribute of the given object", function(){
      var getter=Synth.generate("getter", {"name":"booleanKey", "type":"boolean"});
      getter.call(o).should.equal(false);
   });

   it("should get a date attribute of the given object", function(){
      var getter=Synth.generate("getter", {"name":"dateKey", "type":"date"});
      getter.call(o).should.be.a("date");
   });
});


describe("Relationship Setters", function(){

   it("should set a to one relationship on the given object", function(){
      var setter=Synth.generate("setter", {"name":"employer", "type":"relationship"});
      var person={};

      setter.call(person, {ID:"1234"});

      person.should.have.property("employer");
      person.employer.should.equal("1234");
   });

   // it("should set a to many relationship on the given object", function(){
   //    var setter=Synth.generate("setter", {"name":"employees", "type":"relationship"});
   //    var business={};
   //
   //    setter.call(person, {ID:"1234"});
   //
   //    person.should.not.have.property("employer");
   //    person.employer.should.equal("1234");
   // });
});

describe("Synthesize Property", function(){

   context("with default settings", function(){

      var o=function(){};
      Synth.generate("property", {name:"key"}, o);

      it("generates a setter", function(){
         o.should.have.property("setKey");
         o.setKey.should.be.a("function");
      });

      it("generates a getter", function(){
         o.should.have.property("getKey");
         o.getKey.should.be.a("function");
      });
   });

   context("with readonly settings", function(){

      var o=function(){};
      Synth.generate("property", {name:"key", permission:"readonly"}, o);

      it("doesn't generate a setter", function(){
         o.should.not.have.property("setKey");
      });

      it("generates a getter", function(){
         o.should.have.property("getKey");
         o.getKey.should.be.a("function");
      });
   });
});
