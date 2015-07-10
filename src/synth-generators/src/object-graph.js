require("./entity.js");

/**
 * Generates an object graph from the given schema
 *
 * @param {Object} schema A Schema or schema definition to synthesize
 * @param {Object} context The context in which to synthesize the object graph
 */
Synth.register("object-graph", function(objectGraphSchemaDefinition, context){

   var graphSchema=new Schema(objectGraphSchemaDefinition);

   var classContext=context || {};
   var classes={};
   var name;

   // synthesize each entity class
   for(var i=0, entities=graphSchema.getEntities(), l=entities.length, entity; i<l, (entity=entities[i++]);)
   {
      name=entity.getName();

      Synth.generate("entity", entity, classContext, name);
      classes[name]=classContext[name];
   }

   return classContext;
});
