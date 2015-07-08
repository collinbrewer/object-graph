/**
 * ObjectGraphSchema.js
 * A library for describing, manipulating and querying entity schemas
 */

var EntitySchema=require("../src/entity-schema.js");

(function(){

   var index=function(o, entityDefinitions){

      var entitiesByName={};
      var entities=[];

      var index={
         "entitiesByName": entitiesByName,
         "entities" : entities
      };

      var entity;

      for(var i=0, l=entityDefinitions.length; i<l; i++)
      {
         entityDefinition=entityDefinitions[i];
         entity=new EntitySchema(entityDefinition);

         // index by type and name
         entitiesByName[entityDefinition.name]=entity;

         entities.push(entity);
      }

      o.index=index;
   };

   /**
    * ObjectGraphSchema
    */
   function ObjectGraphSchema(definition)
   {
      this.definition=definition;

      index(this, definition.entities);
   }

   ObjectGraphSchema.prototype.getName = function () {
      return this.definition.name;
   };

   ObjectGraphSchema.prototype.getEntities = function (){
      return this.index.entities;
   };

   ObjectGraphSchema.prototype.getEntitiesByName = function () {
      return this.index.entitiesByName;
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
