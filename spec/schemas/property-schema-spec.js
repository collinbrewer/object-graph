var should=require("chai").should();

var PropertySchema=require("../../src/schema-definitions/src/property-schema.js");

describe("Constructor", function(){

   it("should create a new property schema", function(){

      var definition={
         "schemaType" : "property",
         "name" : "title",
         "type" : "string"
      };

      var schema=new PropertySchema(definition);

      should.exist(schema);
   });
});

describe("Querying", function(){

   var definition={"name" : "title", "type" : "string"};

   var schema=new PropertySchema(definition);

   it("should return the property name", function(){
      schema.should.have.property("getName");
      schema.getName().should.equal("title");
   });

   it("should return the property type", function(){
      schema.should.have.property("getType");
      schema.getType().should.equal("string");
   });

   it("should return the setter name", function(){
      schema.getSetterName().should.equal("setTitle");
   });

   it("should return the getter name", function(){
      schema.getGetterName().should.equal("getTitle");
   });
});
