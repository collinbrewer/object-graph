/**
 *
 */
Descriptor.register("object-graph", "entityName", function(objectGraph, entityName){

   return objectGraph[entityName];
});

Descriptor.register("comparator", "predicate", function(node, predicate){

   return Predicate.parse(predicate).evaluateWithObject(node);
});

// Descriptor can't differentiate between objects on it's own, so directives
// won't be run in order.  We need to register a custom resolver in a specific order.
/**
 * We want {entityName:"Todo"} to turn {Todo:[todo1], Users:[user1]} into []
 */
// Synth.register(
//  "object-graph-filter",
//  function(descriptor){
//
//     return function(doc){
//        return Synth.generate("array-filter", doc[descriptor.entityName]);
//     };
//  }
// );
// Synth.registerResolver("object-graph-filter", function(doc){
//
//    return typeof(doc)==="object" && doc.
// });
