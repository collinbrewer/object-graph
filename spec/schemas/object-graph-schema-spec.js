var should=require("chai").should();

var ObjectGraphSchema=require("../../src/schema-definitions/src/object-graph-schema.js");

describe("Constructor", function(){

   it("should create a new object graph schema", function(){

      var definition={
         "schemaType" : "object-graph",
         "entities" : [
            {
               "schemaType" : "entity",
               "name" : "Todo",
               "properties" : [
                  {
                     "schemaType" : "property",
                     "name" : "title",
                     "type" : "string"

                  }
               ]
            }
         ]
      };

      var schema=new ObjectGraphSchema(definition);

      should.exist(schema);
   });
});

describe("Querying", function(){

   var definition={
      "schemaType" : "object-graph",
      "entities" : [
         {
            "schemaType" : "entity",
            "name" : "Todo",
            "properties" : [
               {
                  "schemaType" : "property",
                  "name" : "title",
                  "type" : "string"

               }
            ]
         }
      ]
   };

   var schema=new ObjectGraphSchema(definition);

   it("should return the entities", function(){

      var entities=schema.getEntities();

      entities.should.have.length(1);
   });
});
