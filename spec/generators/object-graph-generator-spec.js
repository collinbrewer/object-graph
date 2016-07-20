var should=require("chai").should();

var ObjectGraphSchema=require("../../src/schema-definitions/src/object-graph-schema.js");
var ObjectGraphGenerator=require("../../src/synth-generators/src/object-graph-generator.js");

describe("Synthesize Graph", function(){

   var definition={
      "schemaType":"object-graph",
      "entities": [
         {
            schemaType : "entity",
            name: "Company",
            properties: [
               {
                  schemaType : "property",
                  name: "name",
                  type: "string"
               }
            ]
         },

         {
            "schemaType" : "entity",
            name: "Person",
            properties: [
               {
                  schemaType : "property",
                  name: "firstName",
                  type: "string"
               },

               {
                  schemaType : "property",
                  name: "lastName",
                  type: "string"
               },

               {
                  schemaType : "property",
                  name: "birthday",
                  type: "date"
               },

               {
                  schemaType : "property",
                  name: "employer",
                  type: "relationship",
                  entityName: "Company"
               },

               {
                  schemaType : "property",
                  name : "employerName",
                  type : "fetched",
                  valueExpression : "employer.name"
               }
            ]
         }
      ]
   };

   context("from object graph schema", function(){

      var objectGraph;

      beforeEach(function(){
         objectGraph=new ObjectGraphGenerator(new ObjectGraphSchema(definition));
      });

      it("generates a graph", function(){
         objectGraph.should.be.an("object");
      });

      it("generates entity classes", function(){
         objectGraph.should.have.property("Person");
         objectGraph.should.have.property("Company");
      });

      it("resolves fetched properties", function(){
         var company=new objectGraph.Company(objectGraph);
         company.setName("Biz");

         var person=new objectGraph.Person(objectGraph);
         person.setEmployer(company);

         console.log(person);

         person.getEmployerName().should.equal("Biz");
      });
      //
      // it("understands dependencies", function(){
      //    var company=new App.Company();
      //    var person=new App.Person();
      //
      //    person.setEmployer(company);
      // });

   });
});
