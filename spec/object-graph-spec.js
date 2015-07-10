global.Promise=require("promiz");

var chai=require("chai");
var chaiAsPromised=require("chai-as-promised");
var should=chai.should();
var expect=chai.expect;

var ObjectGraph=require("../index.js");

chai.use(chaiAsPromised);

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

describe("Constructor", function(){

   it("should create a new object graph", function(){

      var objectGraph=new ObjectGraph();

      should.exist(objectGraph);
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


describe("Invalidations", function(){

   // synthesize an object graph from the schema
   var Spec={};

   Synth.generate("object-graph", definition, Spec);

   var objectGraph=new ObjectGraph();

   it("should invalidate an internal fetched property");

   it("should invalidate an external fetched property");

   it("should invalidate a cached relationship property");
});

describe("Patching", function(){

   context("#requestPatch", function(){

      var Spec={};

      Synth.generate("object-graph", definition, Spec);

      var objectGraph;
      var person;

      beforeEach(function(){

         objectGraph=new ObjectGraph();
      });

      it("should generate and return a patch", function(){

         new Spec.Person(objectGraph);

         return objectGraph.requestPatch().should.eventually.be.an("array");
      });
   });
});

describe("Staging", function(){

   var Spec={};

   Synth.generate("object-graph", definition, Spec);

   var objectGraph;
   var person;

   beforeEach(function(){

      objectGraph=new ObjectGraph();

      person=new Spec.Person(objectGraph);
      person.setFirstName("Chris");
   });

   it("should have staged changes", function(done){

      objectGraph.requestPatch()
         .then(function(patch){

            patch.should.have.length(2);
            patch[0].should.have.property("op");
            patch[0].op.should.equal("add");

            done();
         });
   });

   it("should rollback staged changes", function(){

      objectGraph.rollback();

      objectGraph.requestPatch().should.eventually.have.length(0);
      objectGraph.read({entityName:"Person"}).should.have.length(0);
      should.not.equal(person.getFirstName(), "Chris");
   });

   it("should commit staged changes", function(done){

      objectGraph.setParent({
         applyPatch: function(){
            done();

            return Promise.resolve();
         }
      })

      objectGraph.commit();
   });
});

describe("Branching", function(){

   var objectGraph=new ObjectGraph();
   var branch;

   it("should create a branch");
   it("should merge the branch");
});
