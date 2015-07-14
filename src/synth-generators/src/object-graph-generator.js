var ObjectGraph=require("../../object-graph.js");

/**
 * Generates an object graph from the given schema
 *
 * @param {Object} schema A Schema or schema definition to synthesize
 * @param {Object} context The context in which to synthesize the object graph
 */
(function(){

   var objectGraph=new ObjectGraph(graphSchema);

   return objectGraph;
})();
