/**
 * ObjectGraphSchema.js
 * A library for describing, manipulating and querying entity schemas
 */

var EntitySchema=require("../src/entity-schema.js");

(function(){

   var index=function(o, entityDefinitions){

      var entitiesByName={};

      var index={
         "entitiesByName": entitiesByName
      };

      for(var i=0, l=entityDefinitions.length; i<l; i++)
      {
         entityDefinition=entityDefinitions[i];

         // index by type and name
         entitiesByName[entityDefinition.name]=entityDefinition;
      }

      o.index=index;
   };

   /**
    * ObjectGraphSchema
    */
   function ObjectGraphSchema(definition)
   {
      this.definition=definition;

      // index(this, definition.entities);
   }

   ObjectGraphSchema.prototype.getEntities = function () {

      if(!this.entities)
      {
         var entities=(this.entities=[]);
         var es=this.definition.entities;

         for(var i=0, l=es.length, e; i<l, (e=es[i++]); i++)
         {
            entities.push(new EntitySchema(e));
         }
      }

      return this.entities;
   };

   // ObjectGraphSchema.prototype.getRelationshipsWithDestinationEntity=function(entity){
   //
   //    var entityName=typeof(entity)==="string" ? entity : entity.getName();
   //
   //    if(!this.relationshipsWithDestinationEntity[entityName])
   //    {
   //       this.relationshipsWithDestinationEntity[entityName]=this.properties.filter(function(property){ return property.getEntity().getName()===entityName; });
   //    }
   //
   //    return this.relationshipsWithDestinationEntity[entityName];
   // };

   // export
   (typeof(module)!=="undefined" ? (module.exports=ObjectGraphSchema) : ((typeof(define)!=="undefined" && define.amd) ? define(function(){ return ObjectGraphSchema; }) : (window.ObjectGraphSchema=ObjectGraphSchema)));
})();
