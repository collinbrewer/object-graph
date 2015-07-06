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

   function ObjectGraph(options)
   {
      options || (options={});

      // default to merge
      options.mode || (options.mode="merge");

      this.options=options;
      this.document={};
      this.store={};
      this.patch=(options.mode==="merge" ? {} : []);
   }

   /**
    * setParent
    */
   ObjectGraph.prototype.setParent = function (parent) {

      this.parent=parent;
   };

   /**
    * applyPatch
    * Used to push changes into the object graph in patch form
    * @param {patch} patch A patch describing the changes to apply
    */
   ObjectGraph.prototype.applyPatch=function(patch){

      var self=this;

      return new Promise(function(resolve, reject){

         // JSONPatch.append(self.patch, patch);
         // self.patch=(this.mode==="merge" ? asdf : self.patch.concat(patch);

         var results=JSONPatch.apply(patch, self.document, {"force":true});

         resolve(results);
      });
   };

   /**
    * requestPatch
    * Used to pull out the changes to the object graph in patch form
    * @return {Promise} A promise to resolve the patch
    */
   ObjectGraph.prototype.requestPatch=function(){

      var self=this;

      return new Promise(function(resolve, reject){

         resolve(self.mode==="merge" ? self.document : self.patch);
      });
   };

   ObjectGraph.prototype.register = function (obj) {
      ensure(this.store, obj.getSchema().name, "array").push(obj);
   };

   /**
    * read
    * Returns objects in the object graph based on the criteria in *descriptor*
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
    * clone
    * Creates a duplicate of the receiver.
    */
   ObjectGraph.prototype.clone = function (empty) {

      var clone=new ObjectGraph();

      clone.document=clone(this.document);
      clone.patch=clone(this.patch);
      clone.options=clone(this.options);

      return clone;
   };

   /**
    * rollback
    * Undo all the changes made to the receiver.
    */
   ObjectGraph.prototype.rollback = function () {

      JSONPatch.reverse(this.patch, this.document);
   };

   /**
    * commit
    * Pushes all the changes made to the reciver.
    */
   ObjectGraph.prototype.commit = function () {

      var self=this;

      return this.parent.applyPatch(this.patch)
         .then(function(results){

            self.reset();
         });
   };

   // expose
   (function(mod, name){
      (typeof(module)!=="undefined" ? (module.exports=mod) : ((typeof(define)!=="undefined" && define.amd) ? define(function(){ return mod; }) : (window[name]=mod)));
   })(ObjectGraph, "ObjectGraph");

   return ObjectGraph;

})();
