var JSONPatch=require("json-patch");

global.Schema=require("schema");
global.Expression=require("expression");
global.Predicate=require("predicate");
global.Descriptor=require("descriptor");
// global.Synth=require("synth");
var Synth=require("synth");

require("../node_modules/descriptor/src/handlers/defaults.js");
// require("./synth-generators/index.js");
require("./descriptor-handlers/index.js");

// var ObjectGraphSynthGenerators=require("./synth-generators/index");

// Synth.register("property", PropertyFactory);

var EntityFactory=require("./synth-generators/src/entity-generator.js");

var ObjectGraphSchema=require("./schema-definitions/index.js");

(function(){

   var clone=require("clone");

   /**
    * Internal method for ensuring that a given value type exists for a key in
    * the given document.
    * @param  {array/object} doc The document to ensure the key in.
    * @param  {string/integer} key The key to ensure, can be an array index or key
    * @param  {string} type The type of value to ensure
    * @return {array/object} The ensured value
    */
   function ensure(doc, key, type)
   {
      if(!(key in doc))
      {
         doc[key]=(type==="array" ? [] : {});
      }

      return doc[key];
   }

   /**
    * Internal method for mutating a key using on the objects proper setter
    *
    * @param {object} object - The object to receive the setter
    * @param {string} key - The name of the property to mutate
    * @param {mixed} value - The value passed to the proper setter
    */
   function setUsingSetter(object, key, value)
   {
      var property=object.getSchema().getPropertyWithName(key);
      var setter;

      if(property && (setter=property.getSetterName()))
      {
         if(setter)
         {
            object[setter].call(object, value);
         }
      }
   }

   /**
    * Internal method for applying merge patch to an object graph.
    */
   function applyVersionedMergePatch(objectGraph, mergePatch, options)
   {
      for(var entityName in mergePatch)
      {
         var entities=mergePatch[entityName];
         var entity;

         for(var i=0, l=entities.length; i<l; i++)
         {
            entity=entities[i];

            // create if it doesn't already exist
            var object=objectGraph.indexed[entityName].ID[entity.ID];

            if(!object)
            {
               object=new (ObjectGraph[entityName])();
            }

            // merge in the changes
            for(var key in object)
            {
               setUsingSetter(object, key, object[key]);
            }
         }
      }
   }

   /**
    * Internal method for applying a patch to an object graph.
    */
   function applyVersionedPatch(objectGraph, patch, options)
   {
      var operation;
      var op;
      var path;
      var components;
      var entityName;
      var ID;
      var object;

      for(var i=0, l=patch.length; i<l; i++)
      {
         operation=patch[i];
         op=operation.op;
         path=operation.path;
         components=(path.charAt(0)==="/" ? path.substr(1) : path).split("/");
         entityName=components[0];

         if(op==="add")
         {
            var _class=objectGraph[entityName];
            object=new _class(objectGraph, {ID:components[1]});
         }
         else if(op==="replace")
         {
            object=objectGraph.indexed[entityName].ID[components[1]];

            if(object) // this may not be in loaded
            {
               setUsingSetter(object, components[2], operation.value);
            }
         }
         else if(op==="delete")
         {

         }
      }

      return;
   }

   /**
    * Set the schema for the object graph.  Will build the various classes
    */
   function buildObjectGraphFromSchema(objectGraph, schema) {

      // synthesize each entity class
      for(var i=0, entities=schema.getEntities(), l=entities.length, entitySchema; i<l, (entitySchema=entities[i++]);)
      {
         name=entitySchema.getName();

         // Synth.generate("entity", entity, objectGraph, name);
         // classes[name]=classContext[name];
         // objectGraph[name]=Synth.generate("entity", entities[i]);
         objectGraph[name]=EntityFactory(entitySchema);
      }

      this.schema=schema;
   };

   /**
    * Creates a new ObjectGraph
    */
   function ObjectGraph(objectGraphSchema, options)
   {
      // sanitize the object graph schema
      objectGraphSchema=(objectGraphSchema.getName || (objectGraphSchema=new ObjectGraphSchema(objectGraphSchema)));

      // configure default options
      options || (options={});
      options.mode || (options.mode="patch");

      this.options=options;

      // init empty store and patch
      this.store={};
      this.patch=(options.mode==="merge" ? {} : []);

      // init empty store index
      this.indexed={};

      // build the object graph from the schema
      this.schema=objectGraphSchema;

      buildObjectGraphFromSchema(this, objectGraphSchema);
   }

   /**
    * Returns the schema of the object graph.
    * @return {Schema} The schema of the object graph
    */
   ObjectGraph.prototype.getSchema = function () {
      return this.schema;
   };

   /**
    * Sets the parent of the receiver who will receive notifications.
    */
   ObjectGraph.prototype.setParent = function (parent) {

      this.parent=parent;
   };

   /**
    * Used to push changes into the object graph.
    *
    * @param {patch} patch A patch describing the changes to apply
    * @return {mixed} The results of the patch
    */
   ObjectGraph.prototype.applyPatch=function(patch, options){

      options || (options={});

      var self=this;

      return new Promise(function(resolve, reject){

         // external change - manifest changes, don't trigger new versions(just merge them)
         // internal change - don't manifest changes, trigger new versions
         if(options.patchOnly)
         {
            // JSONPatch.append(self.patch, patch);
            // var results=JSONPatch.apply(patch, self.store, {"force":true});
            self.patch=(self.options.mode==="merge" ? patch : self.patch.concat(patch));
         }
         else
         {
            console.log("external");

            self.options.mode==="merge" ? applyVersionedMergePatch(self, patch, options) : applyVersionedPatch(self, patch, options);
         }

         resolve();
      });
   };

   /**
    * Used to pull out the changes to the object graph in patch form
    * @return {Promise} A promise to resolve the patch
    */
   ObjectGraph.prototype.requestPatch=function(){
      return Promise.resolve(this.patch);
   };

   /**
    * Registers an existing object with the object graph.
    *
    * @param {object} obj - The object to register
    */
   ObjectGraph.prototype.register = function (obj) {

      var entityName=obj.getSchema().getName();
      ensure(this.store, entityName, "object")[obj.ID]=obj;
      ensure(ensure(this.indexed, entityName, "object"), "ID", "object")[obj.ID]=obj;
   };

   /**
    * Unregisters an existing object from the object graph.
    *
    * @param {object} obj - The object to unregister
    */
   ObjectGraph.prototype.unregister = function (obj) {

      var entityName=obj.getSchema().getName();
      var collection=this.store[entityName];

      var ID=obj.ID;

      delete collection[ID];
      delete this.indexed[entityName].ID[ID];

      return;


      var indexOf=collection.indexOf(obj); // TODO: this needs work because we should be looking by ID, not just object equality

      if(indexOf!==-1)
      {
         collection.splice(indexOf, 1);
         delete this.indexed[entityName].ID[obj.ID]; // delete from index
      }
   };

   /**
    * Returns objects in the object graph based on the criteria in *descriptor*
    *
    * @param {Object} descriptor Criteria for which all returned objects should match
    * @return {Array} The objects matching the criteria in *descriptor*
    */
   ObjectGraph.prototype.read = function (descriptor) {

      if(typeof(descriptor)!=="function")
      {
         descriptor=Descriptor.compile(descriptor, "object-graph");
      }

      return descriptor(this.store, {resultType:"array"});
   };

   /**
    * Creates a duplicate of the receiver.
    */
   ObjectGraph.prototype.clone = function () {

      var cloned=new ObjectGraph();

      cloned.store=clone(this.store);
      cloned.patch=clone(this.patch);
      cloned.options=clone(this.options);

      return clone;
   };

   /**
    * Rolls back the receiver to the given version.  If no version is given,
    * only rolls back the staged changes.
    *
    * @param {mixed} [versionReference] - The version to roll back to.
    */
   ObjectGraph.prototype.rollback = function (versionReference) {

      var patch=clone(this.patch);

      if(this.options.mode==="merge")
      {

      }
      else
      {
         var components; // /entityName/objectID/propertyName
         var ID;

         for(var i=patch.length-1, operation; i>=0, (operation=patch[i--]);)
         {
            components=operation.path.substr(1).split("/");
            ID=(components.length===3 ? components[1] : operation.value.ID);
            object=this.read({entityName:components[0], predicate:"ID=='" + ID + "'"});

            if(object.length>0)
            {
               object=object[0];

               if(operation.op==="add") // still exists, but prevent object from being committed
               {
                  this.unregister(object);
               }
               else if(operation.op==="replace") // undo changed property
               {
                  setUsingSetter(object, components[2], operation.previousValue);
               }
               else if(operation.op==="delete")
               {
                  object.isDeleted=false;
               }
            }
            else
            {
               console.warn("Couldn't locate object to rollback for operation: ", operation);
            }
         }
      }

      // reset patch
      this.patch=(this.options.mode==="merge" ? {} : []);
   };

   /**
    * Commits staged changes made to the receiver.
    */
   ObjectGraph.prototype.commit = function () {

      var self=this;

      return this.parent.applyPatch(this.patch)
         .then(function(results){
            self.rollback();
         });
   };

   // expose
   (function(mod, name){
      (typeof(module)!=="undefined" ? (module.exports=mod) : ((typeof(define)!=="undefined" && define.amd) ? define(function(){ return mod; }) : (window[name]=mod)));
   })(ObjectGraph, "ObjectGraph");

   return ObjectGraph;

})();
