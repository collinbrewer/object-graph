var should=require("chai").should();

var PropertySchema=require("../../src/schema-definitions/src/property-schema.js");

describe("Constructor", function(){

   it("should create a new property schema", function(){

      var definition={
         "schemaType" : "property",
         "name" : "title",
         "type" : "string",
         "required" : false
      };

      var schema=new PropertySchema(definition);

      should.exist(schema);
   });
});

describe("Querying", function(){

   var definition={"name" : "title", "ivar":"title-ivar", "type" : "string"};

   var schema=new PropertySchema(definition);

   it("should return the property name", function(){
      schema.should.have.property("getName");
      schema.getName().should.equal("title");
   });

   it("should return the property type", function(){
      schema.getAttributeType().should.equal("string");
   });

   it("should return the attribute type", function(){
      schema.getAttributeType().should.equal("string");
   });

   it("should return the relationship type", function(){
      schema.isToMany().should.equal(false);
   });

   it("should return the relationships destination entity", function(){
      var definition={"name" : "friend", "type":"relationship", "entityName":"Person"};

      var schema=new PropertySchema(definition);
      schema.getEntityName().should.equal("Person");
   });

   it("should return the ivar name", function(){
      schema.getIvar().should.equal("title-ivar");
   });

   it("should return the setter name", function(){
      schema.getSetterName().should.equal("setTitle");
   });

   it("should return the getter name", function(){
      schema.getGetterName().should.equal("getTitle");
   });

   it("should return the checker name", function(){
      schema.getCheckerName().should.equal("hasTitle");
   });

   it("should return the fetcher name: ", function(){
      schema.getFetcherName().should.equal("fetchTitle");
   });

   it("should not be required", function(){
      schema.isRequired().should.equal(false);
   });

   it("should not be transient", function(){
      schema.isTransient().should.equal(false);
   });

   it("should be readwrite", function(){
      schema.getPermission().should.equal("readwrite");
   });
});
