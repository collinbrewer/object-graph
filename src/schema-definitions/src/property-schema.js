/**
 * PropertySchema.js
 * A library for describing, manipulating and querying property schemas
 */

(function(){

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
            var dependentKey=getFirstDependentKeyFromKeyPath(propertyDefinition.valueExpression);

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
    * Returns the definition used to create the schema.
    */
   PropertySchema.prototype.getDefinition = function () {
      return this.definition;
   };

   /**
    * Returns the name of the property
    */
   PropertySchema.prototype.getName = function () {
      return this.definition.name;
   };

   /**
    * Returns the type of the property
    */
   PropertySchema.prototype.getType = function () {
      var type=this.definition.type;

      // if it's not a relationship or fetched property, it's an attribute
      // NOTE: Probably need to separate this out into different classes
      type!=="relationship" && type!=="fetched" && (type="attribute");

      return type;
   };

   /**
    * Used to retreive the type of an attribute property.
    * @return {string} An attribute type.  string|number|boolean|date
    */
   PropertySchema.prototype.getAttributeType = function () {
      return (this.getType()==="attribute" ? this.definition.type : undefined);
   };

   /**
    * Used to determine if the property is required.
    */
   PropertySchema.prototype.isRequired = function () {
      var definition=this.definition;
      return ("required" in definition) && definition.required===true;
   };

   /**
    * Used to determine if the property is transient.
    */
   PropertySchema.prototype.isTransient = function () {
      var type=this.getType();
      return (type==="fetched" || type==="transient");
   };

   /**
    * Returns true if the property is a to many relationship
    * @return {Boolean} Relationship is a to many relationship
    */
   PropertySchema.prototype.isToMany = function () {
      var definition=this.definition;
      return (("toMany" in definition) ? definition.toMany : false);
   };

   /**
    * Returns the delete rule for a relationship property.
    * @return {string} The delete rule for the property
    */
   PropertySchema.prototype.getDeleteRule = function () {
      return this.definition.deleteRule || null;
   };

   /**
    * Returns the destination entity name for a relationship property
    * @return {String} The destination entity of the relationship.
    */
   PropertySchema.prototype.getEntityName = function () {
      return this.definition.entityName;
   };

   /**
    * Returns the permissions for the property.
    */
   PropertySchema.prototype.getPermission = function () {
      return (this.definition.permission || "readwrite");
   };

   /**
    * Returns the name of the instance variable used to store the property.
    * @return {string} The name of the instance variable.
    */
   PropertySchema.prototype.getIvar = function () {
      var definition=this.definition;

      return (("ivar" in definition) ? definition.ivar : definition.name);
   };

   /**
    * Returns the name of the setter method for the property
    */
   PropertySchema.prototype.getSetterName = function () {

      var setterName;
      var definition=this.definition;

      if(!definition.permission || (definition.permission && definition.permission==="readwrite"))
      {
         setterName=definition.setter;

         if(!setterName)
         {
            var name=definition.name;
            var Name=(name.substr(0, 1).toUpperCase() + name.substr(1));

            setterName=("set" + Name);
         }
      }

      return setterName;
   };

   /**
    * Returns the name of the getter method for the property
    */
   PropertySchema.prototype.getGetterName = function () {

      var getterName;
      var definition=this.definition;

      getterName=definition.getter;

      if(!getterName)
      {
         var name=definition.name;
         var Name=(name.substr(0, 1).toUpperCase() + name.substr(1));

         getterName=("get" + Name);
      }

      return getterName;
   };

   /**
    * Returns the name of the checker method for the property
    */
   PropertySchema.prototype.getCheckerName = function () {

      var checkerName;
      var definition=this.definition;

      checkerName=definition.checker;

      if(!checkerName)
      {
         var name=definition.name;
         var Name=(name.substr(0, 1).toUpperCase() + name.substr(1));

         checkerName=("has" + Name);
      }

      return checkerName;
   };

   /**
    * Returns the name of the fetcher method for the property
    */
   PropertySchema.prototype.getFetcherName = function () {

      var fetcherName;
      var definition=this.definition;

      fetcherName=definition.fetcher;

      if(!fetcherName)
      {
         var name=definition.name;
         var Name=(name.substr(0, 1).toUpperCase() + name.substr(1));

         fetcherName=("fetch" + Name);
      }

      return fetcherName;
   };

   /**
    * Returns a list of property definitions whose values are dependent on the value of the receiver
    */
   PropertySchema.prototype.getAffectedProperties=function(affectingProperty){

      // this.index.affects

      return this.getProperties().filter(function(property){
         return property.isAffectedBy(affectingProperty); // is dependent on
      });
   };

   // export
   (typeof(module)!=="undefined" ? (module.exports=PropertySchema) : ((typeof(define)!=="undefined" && define.amd) ? define(function(){ return PropertySchema; }) : (window.PropertySchema=PropertySchema)));
})();
