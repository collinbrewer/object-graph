var JSONPatch=require("json-patch");

global.Schema=require("schema");
global.Expression=require("expression");
global.Predicate=require("predicate");
global.Descriptor=require("descriptor");
global.Synth=require("synth");

require("../node_modules/descriptor/src/handlers/defaults.js");
require("./schema-definitions/index.js");
require("./synth-generators/index.js");
require("./descriptor-handlers/index.js");

(function(){

   var clone=require("clone");

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
            object.setter.call(object, value);
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
   function applyVersionedPatch(patch){}

   /**
    * Creates a new ObjectGraph
    */
   function ObjectGraph(options)
   {
      options || (options={});

      // default to merge
      options.mode || (options.mode="patch");

      this.options=options;
      this.store={};
      this.patch=(options.mode==="merge" ? {} : []);

      this.indexed={};
   }

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

            applyVersionedMergePatch(self, patch, options);
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

      var entityName=obj.getSchema().name;
      ensure(this.store, entityName, "array").push(obj);
      ensure(ensure(this.indexed, entityName, "object"), "ID", "object")[obj.ID]=obj;
   };

   /**
    * Unregisters an existing object from the object graph.
    *
    * @param {object} obj - The object to unregister
    */
   ObjectGraph.prototype.unregister = function (obj) {

      var entityName=obj.getSchema().name;
      var collection=this.store[entityName];
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

      return descriptor(this.store);
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

         for(var i=patch.length-1, operation; i>=0, (operation=patch[i--]);)
         {
            components=operation.path.substr(1).split("/");
            object=this.read({entityName:components[0], predicate:"ID=='" + operation.value.ID + "'"});

            if(object.length>0)
            {
               object=object[0];

               if(operation.op==="add") // still exists, but prevent object from being committed
               {
                  this.unregister(object);
               }
               else if(operation.op==="replace") // undo changed property
               {
                  setUsingSetter(object, components[2], operation.value);
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
