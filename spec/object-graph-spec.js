global.Promise=require("promiz");

var chai=require("chai");
var chaiAsPromised=require("chai-as-promised");
var should=chai.should();
var expect=chai.expect;

var ObjectGraph=require("../index.js");

chai.use(chaiAsPromised);

describe("Constructor", function(){

   it("should create a new object graph", function(){

      var objectGraph=new ObjectGraph();

      should.exist(objectGraph);
   });
});

describe("Patching", function(){

   context("#applyPatch", function(){

      var objectGraph;
      var patch=[{"op":"add", "path":"/foo", "value":"bar"}];

      beforeEach(function(){
         objectGraph=new ObjectGraph();
      });

      it("should apply a patch", function(done){

         objectGraph.applyPatch(patch)
            .then(function(){

               // objectGraph.patch.should.not.be.empty();
               // expect(objectGraph.document).not.be.empty();
               // objectGraph.document.should.not.be.empty();
               if(JSON.stringify(objectGraph.document)==="{}")
               {
                  throw new Error("objectGraph.document is not empty");
               }

               done();
            });
      });

      it("should return a patch", function(done){

         objectGraph.applyPatch(patch)
            .then(function(){
               return objectGraph.requestPatch();
            })
            .then(function(applied){

               // applied.should.have.length(1);
               // if(applied.length!==1)
               // {
               //    throw new Error("applied.length is not equal to 1");
               // }
               //
               // // applied[0].should.have.property("op");
               // if(!applied[0].hasOwnProperty("op"))
               // {
               //    throw new Error("applied[0] does not have property 'op'");
               // }
               //
               // // applied[0].op.should.equal("add");
               // if(applied[0].op!=="add")
               // {
               //    throw new Error("applied[0].op does not have value 'add'");
               // }

               done();
            });
      });
   });
});

describe("Querying Objects", function(){

   var definition={
      "schemaType":"object-graph",
      "entities": [
         {
            schemaType : "entity",
            name: "Todo",
            properties: [
               {
                  schemaType : "property",
                  name: "title",
                  type: "string"
               }
            ]
         }
      ]
   };

   var objectGraph;
   // var patch=[
   //    {"op":"add", "path":"/Todo/1234", "value":{"id":1234, "title":"two"}},
   //    {"op":"add", "path":"/Todo/2345", "value":{"id":2345, "title":"one"}},
   //    {"op":"add", "path":"/Todo/3456", "value":{"id":3456, "title":"three"}},
   //    {"op":"add", "path":"/Todo/4567", "value":{"id":4567, "title":"thirty"}}
   // ];

   var Graph={};

   Synth.generate("object-graph", definition, Graph);

   beforeEach(function(){
      objectGraph=new ObjectGraph();

      var todo;
      todo=new Graph.Todo(objectGraph);
      todo.setTitle("two");

      todo=new Graph.Todo(objectGraph);
      todo.setTitle("one");

      todo=new Graph.Todo(objectGraph);
      todo.setTitle("three");

      todo=new Graph.Todo(objectGraph);
      todo.setTitle("thirty");
   });

   context("read", function(){

      it("should return one matching item", function(){

         var descriptor={"entityName":"Todo", "predicate":"title BEGINSWITH 'th'", "order":"title", "offset":1, "limit":1};

         var results=objectGraph.read(descriptor);

         results.should.have.length(1);
         results[0].title.should.equal("three");
      });

      it("should return sorted items", function(){

         var descriptor={"entityName":"Todo", "order":"title"};

         var results=objectGraph.read(descriptor);

         results.should.have.length(4);
         results[0].title.should.equal("one");
      });

   });
});

describe("Relationships", function(){

   var definition={
      "schemaType":"object-graph",
      "entities": [
         {
            schemaType : "entity",
            name: "Company",
            // properties: [
            //    {
            //       schemaType : "property",
            //       name: "employees",
            //       type: "relationship",
            //       toMany: true
            //    }
            // ]
         },

         {
            "schemaType" : "entity",
            name: "Person",
            properties: [
               {
                  schemaType : "property",
                  name: "employer",
                  type: "relationship",
                  entityName: "Company"
               }
            ]
         }
      ]
   };

   it("should resolve a one to one relationship", function(){

      // synthesize an object graph from the schema
      var Graph={};

      Synth.generate("object-graph", definition, Graph);

      var objectGraph=new ObjectGraph();
      var person=new Graph.Person(objectGraph);
      var company=new Graph.Company(objectGraph);

      person.setEmployer(company);

      person.should.have.property("employer");
      person.employer.should.equal(company.ID);
      person.getEmployer().ID.should.equal(company.ID);
   });

   it("should resolve a one to many relationship");

   it("should resolve an inverse relationship");

});


describe("Fetched Properties", function(){

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
                  name: "employer",
                  type: "relationship",
                  entityName: "Company"
               },

               // {
               //    schemaType : "property",
               //    name: "fullName",
               //    type: "fetched",
               //    valueExpression: "firstName lastName"
               // },

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

   it("should resolve an internal fetched property");

   it("should return an external fetched property", function(done){

      // synthesize an object graph from the schema
      var Graph={};

      Synth.generate("object-graph", definition, Graph);

      var objectGraph=new ObjectGraph();

      var person=new Graph.Person(objectGraph);
      var company=new Graph.Company(objectGraph);

      company.setName("Biz");

      person.setEmployer(company);

      person.should.have.property("getEmployerName");
      person.should.have.property("fetchEmployerName");

      return person.fetchEmployerName().then(function(employerName){
         done();
      });

      // person.fetchEmp
      // person.getEmployerName().should.equal("Biz");
   });

});

//
// describe("Invalidations", function(){
//
//    var objectGraph;
//    var patch=[
//       {"op":"add", "path":"/Todo", "value":{"id":1234, "title":"one"}},
//       {"op":"add", "path":"/Todo", "value":{"id":4321, "title":"two"}}
//    ];
//
//    beforeEach(function(){
//       objectGraph=new ObjectGraph();
//    });
//
//
//
// });
