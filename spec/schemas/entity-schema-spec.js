var should=require("chai").should();

var EntitySchema=require("../../src/schema-definitions/src/entity-schema.js");

describe("Constructor", function(){

   it("should create a new entity schema", function(){

      var definition={
         "schemaType" : "entity",
         "name" : "Todo",
         "properties" : [
            {
               "schemaType" : "property",
               "name" : "title",
               "type" : "string"

            }
         ]
      };

      var schema=new EntitySchema(definition);

      should.exist(schema);
   });
});


describe("Querying", function(){

   var definition={
      "schemaType" : "entity",
      "name" : "Person",
      "properties" : [
         {
            "schemaType" : "property",
            "name" : "firstName",
            "type" : "string",
            "required" : true
         },
         {
            "schemaType" : "property",
            "name" : "lastName",
            "type" : "string"
         },
         {
            "schemaType" : "property",
            "name" : "employer",
            "type" : "relationship",
            "entityName" : "Business"
         },
         {
            "name" : "employerName",
            "type" : "fetched",
            "valueExpression" : "employer.name"
         }
      ]
   };

   var schema=new EntitySchema(definition);

   it("should return attribute properties", function(){

      var properties=schema.getAttributesByName();

      properties.should.have.property("firstName");
   });

   it("should return relationship properties", function(){

      var properties=schema.getRelationshipsByName();

      properties.should.have.property("employer");
   });

   it("should return fetched properties", function(){

      var properties=schema.getFetchedByName();

      properties.should.have.property("employerName");
   });

   it("should return required properties", function(){

      var properties=schema.getRequiredByName();

      properties.should.have.property("firstName");
   });

   it("should return transient properties", function(){

      var properties=schema.getTransientByName();

      properties.should.have.property("employerName");
   });

   it("should return a property by name", function(){

      schema.getPropertyWithName("firstName").should.have.property("getName");
   });

   // it("should return affected properties", function(){
   //
   //    var properties=schema.getPropertiesAffecting("fullName")
   //
   //    properties.should.have.property("firstName");
   //    properties.should.have.property("lastName");
   // });
   //
   // it("should return affected properties", function(){
   //
   //    var properties=schema.getPropertiesAffectedBy("firstName")
   //
   //    properties.should.have.property("lastName");
   // });
});
