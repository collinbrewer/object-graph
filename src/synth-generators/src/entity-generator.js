/**
 * Generates a class from the given entity schema
 */
var PropertyGenerator=require("../src/property-generator.js");

(function(){

   if(!global.uuid)
   {
      global.uuid=function(){

         var d = new Date().getTime();
         var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x3|0x8)).toString(16);
         });

         return uuid;
      };
   }

   /**
    * Extends the object graph to provide a patchable interface
    * The intent is so that generic, runtime objects can be exposed for persistence
    * or other purpose.
    *
    * For example:
    *    var todo=new Todo();
    *
    */

   function appendCreateToPatch()
   {
      // console.log("appending create to patch: ", arguments);

      var schemaName=this.getSchema().getName();
      var ID=this.ID;

      this.objectGraph.applyPatch([{
         op: "add",
         path: "/" + schemaName + "/-",
         // path: "/" + schemaName + "/" + ID,
         value: {"ID":ID}
      }], {patchOnly:true});

      this.objectGraph.register(this);
   };

   function appendUpdateToPatch(key, value)
   {
      var schema=this.getSchema();
      var propertySchema=schema.getPropertyWithName(key);
      var getter=this[propertySchema.getGetterName()];

      this.objectGraph.applyPatch([{
         op: "replace",
         path: "/" + schema.getName() + "/" + this.ID + "/" + key,
         previousValue:getter.call(this),
         value: value
      }], {patchOnly:true});
   };

   function appendDeleteToPatch(schema)
   {
      this.objectGraph.applyPatch([{
         op: "delete",
         path: "/" + this.getSchema().getName() + "/" + this.ID
      }], {patchOnly:true});
   }

   // Synth.register("entity",
   function EntityFactory(entitySchema){

      var className=entitySchema.getClassName();
      var _class=entitySchema.getClass();

      if(_class===null || _class===undefined)
      {
         var source="";
         source+="var NewClass=function " + className + "(objectGraph, atts){\n";
         source+="   atts || (atts={});\n"
         // source+="   this.options=options;\n";
         source+="   this.beforeCreate && this.beforeCreate();\n";
         source+="   this.ID=atts.ID || uuid();\n";
         source+="   this.objectGraph=objectGraph;\n";
         source+="   this.afterCreate && this.afterCreate();\n";
         source+="}";

         /* jslint evil:true */
         (function(){
            eval(source); // var NewClass=function ClassName(){}
            _class=NewClass;
         })();

         _class.schema=entitySchema;
      }

      // synthesize properties
      var propertyContext=_class.prototype;

      propertyContext.schema=entitySchema;
      propertyContext.getSchema=function(){ return this.schema; };

      propertyContext.afterCreate=appendCreateToPatch;
      propertyContext.beforeUpdate=appendUpdateToPatch;
      propertyContext.afterDelete=appendDeleteToPatch;


      for(var j=0, ps=entitySchema.getProperties(), c=ps.length, propertySchema; j<c, (propertySchema=ps[j++]);)
      {
         Synth.generate("property", propertySchema, propertyContext);
      }

      return _class;
   }

   module.exports=EntityFactory;
})();
