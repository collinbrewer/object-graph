/**
 * Generates a class from the given entity schema
 */
require("../src/property.js");

var isFirstRunClass=true;

Synth.register("entity", function(entitySchema, context){

   if(isFirstRunClass)
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

   var entitySchemaDefinition=entitySchema.getDefinition();

   var className=entitySchema.getClassName();
   var _class=entitySchema.getClass();

   if(_class===null || _class===undefined)
   {
      var source="";
      source+="var NewClass=function " + className + "(objectGraph){\n";
      // source+="   options || (options={});\n"
      // source+="   this.options=options;\n";
      source+="   this.beforeCreate && this.beforeCreate();\n";
      source+="   this.ID=uuid();\n";
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

   for(var j=0, ps=entitySchema.getProperties(), c=ps.length, propertySchema; j<c, (propertySchema=ps[j++]);)
   {
      Synth.generate("property", propertySchema, propertyContext);
   }

   return _class;
});
