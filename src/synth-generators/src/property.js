/**
 * Factory methods for all schemas supported by ObjectGraph
 */

var set=function set(key, value){ this[key]=value; };
var get=function get(key){ return this[key]; };

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

Synth.register("unnamed-getter", function(propertySchema){
   return get;
});

Synth.register("unnamed-setter", function(propertySchema){
   return set;
});

Synth.register("attribute-getter", function(propertySchema){

   var ivar=propertySchema.getIvar();

   var source="";
   source+="return this." + ivar + ";";

   var getter=new Function(source);
   
   return getter;
});

// name: the name of the property used to generate instance variables, accessors and mutators, unless otherwise specified
//    + ivar: the path to the instance variable used to store the property's value
//    + permission: readonly, used to specify the public access to the property
//    + getter: specifies the name of the accessor to use to access the ivar, if already defined on the class, one will not be synthesized
//    + setter: specifies the name of the mutator to use to mutate the ivar, if already defined, one will not be synthesized
//    - type: the type of data to be stored in the ivar, used in the CAST method to ensure that a properties value is the correct type
//    - defaultValue
Synth.register("getter", function(propertySchema){

   return Synth.generate(propertySchema.getType() + "-getter", propertySchema);
});

Synth.register("fetched-getter", function(propertySchema){
   return Synth.generate("attribute-getter", propertySchema);
});

Synth.register("attribute-setter", function(propertySchema){

   var ivar=propertySchema.getIvar();
   var name=propertySchema.getName();

   // it seems like overkill to eval source, but direct access and lookups
   // via: this.varname is much faster than the dynamic: this["varname"]
   var source="";
   // source+="if(Synth.isValidType(value, " + type + "))\n";
   // source+="{\n"
   source+="   this.beforeUpdate && this.beforeUpdate('" + name + "', value);\n";
   source+="   this." + ivar + "=value;\n";
   source+="   this.afterUpdate && this.afterUpdate('" + name + "', value);\n";

   // source+="}\n";

   return new Function("value", source);
});

/**
 * Extends Synth to support relationships
 */
var getPrimitiveValueOfObject=function(object){ return object.ID; };

Synth.register("relationship-getter", function(propertySchema){

   var ivar=propertySchema.getIvar();

   var source="";

   var isToMany=propertySchema.isToMany();

   // resolve the objects out of *context*... this.context[entity][id]
   if(isToMany)
   {
      source+="var l=ids.length;\n";
      source+="var results=new Array(l);\n"
      source+="var ids=this." + ivar + ";\n";
      source+="for(var i=0, id; i<l, (id=ids[i]); i++)\n";
      source+="{\n";
      source+="   console.log(this);\n";
      source+="   resuts[i]=this.objectGraph." + propertySchema.getEntityName() + "[id];\n";
      source+="}";
   }
   else
   {
      source+="var id=this." + ivar + ";\n";
      source+="var predicate=\"ID=='\" + id + \"'\";\n";
      source+="var results=this.objectGraph.read({\n";
      source+="   entityName: '" + propertySchema.getEntityName() + "',\n";
      source+="   predicate: predicate\n";
      // source+="   entityName:asdf,\n";
      source+="});\n";
      // source+="return this.objectGraph." + propertySchema.get + "[id];";

      // console.log("source: ", source);
   }

   if(!isToMany)
   {
      source+="results=(results && results.length>0) ? results[0] : results;\n";
   }

   source+="return results;\n";

   var getter=new Function(source);

   return getter;
});

function getFetchedPropertyDescriptorWithSource(property, source)
{
   var substituteVariables={"FETCH_SOURCE":source, "FETCHED_PROPERTY":property};
   var predicate=Predicate.parse(property.predicate, substituteVariables);

   var descriptor={};

   descriptor.entityName=property.entityName;

   // add in the predicate if there is one
   property.predicate && (descriptor.predicate=predicate);

   descriptor.properties=property.getIncludedProperties();

   return descriptor;
}

function dynamicGet(key, obj)
{
   var value;
   var Key=key.charAt(0).toUpperCase() + key.substring(1);
   var accessor;

   // Apple search pattern:
   //    getKey()
   //    key()
   //    isKey()
   //    countOfKey()
   //    objectInKey()
   //    keyAtIndexes()
   if((accessor=("get" + Key)) in obj)
   {
      var fn=obj[accessor];

      value=fn.call(obj);
   }
   // else if(("is" + Key) in obj)
   // {
   //    value=obj.isKey();
   // }
   // else if(("_" + key) in obj)
   // {
   //    value=obj["_" + key];
   // }
   // else if(("_is" + Key) in obj)
   // {
   //    value=obj["_is" + key];
   // }
   // else// if((key in obj))
   // {
   //    value=obj[key];
   // }

   return value;
}

Synth.register("fetcher", function(property, context){

   var fetch=function(){

      var self=this;

      return Promise.resolve()
         .then(function(){

            var promise;

            if(property.entityName)
            {
               var fetchedPropertyDescriptor=getFetchedPropertyDescriptorWithSource(property, self);
               promise=self.objectGraph.read(fetchedPropertyDescriptor)
            }
            else
            {
               promise=Promise.resolve(self);
            }

            return promise;
         })
         .then(function(results){

            var value=results;

            if(property.valueExpression)
            {
               var valueExpression=Expression.parse(property.valueExpression);

               value=valueExpression.getValueWithObject(value, dynamicGet);
            }

            return Promise.resolve(value);
         });
   };

   return fetch;
});

Synth.register("relationship-tomany-setter", function(propertySchema){

   var ivar=propertySchema.getIvar();

   var source="";
   // source+="function(value){\n";
   source+="   var l=value.length;\n";
   source+="   var primitive=new Array(l);\n";
   source+="   for(var i=0, o; i<l, (o=value[i]); i++){\n";
   source+="      primitive[i]=getPrimitiveValueOfObject(o);\n";
   source+="   }\n";
   source+="   this." + ivar + "=primitive;"
   // source+="}";

   return new Function("value", source);
});

Synth.register("relationship-toone-setter", function(propertySchema){

   var ivar=propertySchema.getIvar();

   var source="";
   // source+="function(value){\n";
   source+="   var primitive=value.ID;\n";
   source+="   this." + ivar + "=primitive;"
   // source+="}";

   return new Function("value", source);
});

Synth.register("relationship-setter", function(propertySchema){

   return Synth.generate("relationship-" + (propertySchema.isToMany() ? "tomany" : "toone") + "-setter", propertySchema);

});


Synth.register("setter", function(propertySchema){

   return Synth.generate(propertySchema.getType() + "-setter", propertySchema);
});

Synth.register("checker", function(propertySchema){

   var ivar=propertySchema.getIvar();

   var source="";

   source+="  return ('" + ivar + "' in this);";

   return new Function(source);
});


Synth.register("property", function(propertySchema, context){

   var permission=propertySchema.getPermission();

   // generate a setter if the property isn't readonly
   if(permission==="readwrite")
   {
      var setter=propertySchema.getSetterName();

      if(propertySchema.getType()!=="fetched" && !(setter in context))
      {
         Synth.generate("setter", propertySchema, context, setter);
      }
   }

   // generate a getter if it doesn't already exist
   var getter=propertySchema.getGetterName();

   if(!(getter in context))
   {
      Synth.generate("getter", propertySchema, context, getter);
   }

   // generate a checker if it doesn't already exist
   var checker=propertySchema.getCheckerName();

   if(!(checker in context))
   {
      Synth.generate("checker", propertySchema, context, checker);
   }

   // generate a fetcher if appropriate
   var fetcher=propertySchema.getFetcherName();

   if(propertySchema.getType()==="fetched" && !(fetcher in context))
   {
      Synth.generate("fetcher", propertySchema, context, fetcher);
   }

   return context;
});
