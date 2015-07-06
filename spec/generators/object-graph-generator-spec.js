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
                  entityName: "business"
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

      var App;

      beforeEach(function(){
         App={};
         Synth.generate("object-graph", definition, App);
      });

      it("generates a graph", function(){
         App.should.not.equal({});
      });

      it("generates entity classes", function(){
         App.should.have.property("Person");
         App.should.have.property("Company");
      });

      it("resolves fetched properties", function(){
         var company=new App.Company();
         company.setName("Biz");

         var person=new App.Person();

         person.setEmployer(company);

         should(person.getEmployerName()).equal("Biz");
      });

      it("understands dependencies", function(){
         var company=new App.Company();
         var person=new App.Person();

         person.setEmployer(company);
      });

   });
});
