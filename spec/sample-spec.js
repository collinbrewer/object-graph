var chai=require("chai");
var should=chai.should();

// var chaiAsPromised=require("chai-as-promised");
// chai.use(chaiAsPromised);

var ObjectGraph=require("../index.js");


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

var patch=[
   {"op":"add", "path":"/Company/c0001", "value":{"ID":"c0001"}},
   {"op":"replace", "path":"/Company/c0001/name", "value":"Company A"},
   {"op":"add", "path":"/Person/p0001", "value":{"ID":"p0001"}},
   {"op":"replace", "path":"/Person/p0001/firstName", "value":"John"},
   {"op":"replace", "path":"/Person/p0001/lastName", "value":"Smith"},
   {"op":"add", "path":"/Person/p0002", "value":{"ID":"p0002"}},
   {"op":"replace", "path":"/Person/p0002/lastName", "value":"Ericson"},
   {"op":"replace", "path":"/Person/p0002/firstName", "value":"Chris"},
   {"op":"add", "path":"/Company/c0002", "value":{"ID":"p0002"}},
   {"op":"replace", "path":"/Company/c0002/name", "value":"Company B"},
   {"op":"replace", "path":"/Person/p0001/employer", "value":"c0001"},
   {"op":"replace", "path":"/Person/p0002/employer", "value":"c0002"}
];

context("Sample", function(){

   it("should apply patch from parent", function(){

      var objectGraph=new ObjectGraph(definition);

      // console.log("objectGraph: ", objectGraph);

      return objectGraph.applyPatch(patch)
         .then(function(){

            objectGraph.read({entityName:"Company"}).should.have.length(2);
            objectGraph.read({entityName:"Person"}).should.have.length(2);
            objectGraph.read({entityName:"Person", predicate:"firstName=='John'"}).should.have.length(1);

            // objectGraph.queryAny("Person").whose("firstName").isEqualTo("John")

            var john=objectGraph.read({entityName:"Person", predicate:"firstName=='John'"})[0];

            should.exist(john.getEmployer());
            john.getEmployer().getName().should.equal("Company A");

            return Promise.resolve();
         });
   });
});
