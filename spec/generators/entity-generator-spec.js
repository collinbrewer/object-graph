var should=require("chai").should();

var EntitySchema=require("../../src/schema-definitions/src/entity-schema.js");
var EntityGenerator=require("../../src/synth-generators/src/entity-generator.js");

describe("Synthesize Class", function(){

   var definition={
      schemaType : "entity",
      name: "Company",
      properties: [
         {
            schemaType : "property",
            name: "title",
            type: "string"
         }
      ]
   };

   var Company;

   context("from entity schema", function(){

      beforeEach(function(){
         Company=new EntityGenerator(new EntitySchema(definition));
      })

      it("generates a class", function(){
         Company.should.be.a("function");
      });

      it("generates property setters", function(){
         Company.prototype.should.have.property("setTitle");
      });

      it("generates property getters", function(){
         Company.prototype.should.have.property("getTitle");
      });
   });
});
