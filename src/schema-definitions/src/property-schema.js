/**
 * PropertySchema.js
 * A library for describing, manipulating and querying property schemas
 */

(function(){

   var TypeValidators={
      "string"  : function(value){ return typeof(value)==='string'; },
      "number"  : function(value){ return typeof(value)==='number' && !isNaN(value); },
      "boolean" : function(value){ return typeof(value)==='boolean'; },
      "date"    : function(value){ return typeof(value)==='object' && !!value && value.constructor.name==='Date'; }
   };

   var Typecasters={
      "string"  : function(value){ return ''+value; },
      "number"  : function(value){ return +value; },
      "boolean" : function(value){ return !!value; },
      "date"    : function(value){ return Date.parse(value); }
   };

   // TODO: we should rely on our custom expression for getting this value
   var getFirstDependentKeyFromKeyPath=function(keyPath){

      var keyPathComponents=keyPath.split("."),
          keyPathComponent,
          dependentKey=null;

      while((keyPathComponent=keyPathComponents.shift()))
      {
         if(keyPathComponent.charAt(0)!=="@")
         {
            dependentKey=keyPathComponent;
            break;
         }
      }

      return dependentKey;
   };

   var index=function(o, propertyDefinition){

      var affectedBy={};

      var index={
         "affectedBy" : affectedBy
      };

      var type=propertyDefinition.type;

      // cases:
      // fullName = firstName + lastName
      // children = All Person objects whose "parent" is SOURCE
      if(type==="fetched" || ("valueExpression" in propertyDefinition))
      {
         // process the expression
         if(("valueExpression" in propertyDefinition))
         {
            var dependentKey=getFirstDependentKeyFromKeyPath(propertyDefinition);

            affectedBy[dependentKey];
         }

         // process the predicate
         if(("predicate" in propertyDefinition))
         {
            Predicate.getProperties()
         }
      }
   };

   /**
    * PropertyDescription
    */
   function PropertySchema(definition)
   {
      this.definition=definition;

      index(this, definition);
   }

   /**
    * getName
    *
    * Returns the name of the property
    */
   PropertySchema.prototype.getName = function () {
      return this.definition.name;
   };

   /**
    * getType
    *
    * Returns the type of the property
    */
   PropertySchema.prototype.getType = function () {
      console.log("definition: ", this.definition);
      return this.definition.type;
   };

   /**
    * Returns a list of property definitions whose values are dependent on the value of the receiver
    */
   PropertySchema.prototype.getAffectedPropertyDefinitions=function(affectingProperty){

      // this.index.affects

      return this.getProperties().filter(function(property){
         return property.isAffectedBy(affectingProperty); // is dependent on
      });
   };

   // export
   (typeof(module)!=="undefined" ? (module.exports=PropertySchema) : ((typeof(define)!=="undefined" && define.amd) ? define(function(){ return PropertySchema; }) : (window.PropertySchema=PropertySchema)));
})();
