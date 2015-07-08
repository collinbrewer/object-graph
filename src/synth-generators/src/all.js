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

Synth.register("unnamed-getter", function(config){
   return get;
});

Synth.register("unnamed-setter", function(config){
   return set;
});

Synth.register("attribute-getter", function(config){

   var name=config.name;
   var ivar=(("ivar" in config) ? config.ivar : name);
   var source="";
   source+="return this." + ivar + ";\n";

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
Synth.register("getter", function(config){

   var type=config.type;
   (type!=="relationship") && (type="attribute");

   return Synth.generate(type + "-getter", config);
});

Synth.register("attribute-setter", function(config){

   var name=config.name;
   var ivar=(("ivar" in config) ? config.ivar : name);

   // it seems like overkill to eval source, but direct access and lookups
   // via: this.varname is much faster than the dynamic: this["varname"]
   var source="";
   // source+="if(Synth.isValidType(value, " + type + "))\n";
   // source+="{\n"
   source+="   this." + ivar + "=value;";
   // source+="}\n";

   return new Function("value", source);
});

/**
 * Extends Synth to support relationships
 */
var getPrimitiveValueOfObject=function(object){ return object.ID; };

Synth.register("relationship-getter", function(config){

   var name=config.name;
   var ivar=(("ivar" in config) ? config.ivar : name);
   var source="";

   var isToMany=(("toMany" in config) && config.toMany===true);

   // resolve the objects out of *context*... this.context[entity][id]
   if(isToMany)
   {
      source+="var l=ids.length;\n";
      source+="var results=new Array(l);\n"
      source+="var ids=this." + ivar + ";\n";
      source+="for(var i=0, id; i<l, (id=ids[i]); i++)\n";
      source+="{\n";
      source+="   console.log(this);\n";
      source+="   resuts[i]=this.objectGraph." + config.entityName + "[id];\n";
      source+="}";
   }
   else
   {
      source+="var id=this." + ivar + ";\n";
      source+="var predicate=\"ID=='\" + id + \"'\";\n";
      source+="var results=this.objectGraph.read({\n";
      source+="   entityName: '" + config.entityName + "',\n";
      source+="   predicate: predicate\n";
      // source+="   entityName:asdf,\n";
      source+="});\n";
      // source+="return this.objectGraph." + config.entityName + "[id];";

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

Synth.register("relationship-tomany-setter", function(config){

   var name=config.name;
   var ivar=(("ivar" in config) ? config.ivar : name);
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

Synth.register("relationship-toone-setter", function(config){

   var name=config.name;
   var ivar=(("ivar" in config) ? config.ivar : name);
   var source="";
   // source+="function(value){\n";
   source+="   var primitive=value.ID;\n";
   source+="   this." + ivar + "=primitive;"
   // source+="}";

   return new Function("value", source);
});

Synth.register("relationship-setter", function(config){

   return Synth.generate("relationship-" + (config.toMany ? "tomany" : "toone") + "-setter", config);

});


Synth.register("setter", function(config){

   var type=config.type;
   (type!=="fetched" && type!=="relationship") && (type="attribute");

   return Synth.generate(type + "-setter", config);
});

Synth.register("checker", function(config){

   var name=config.name;
   var ivar=(("ivar" in config) ? config.ivar : name);
   var source="";

   source+="  return ('" + ivar + "' in this);";

   return new Function(source);
});


Synth.register("property", function(config, context){

   var name=config.name;
   var Name=(name.substr(0, 1).toUpperCase() + name.substr(1));
   var perm=config.permission ? config.permission : "readwrite";

   // generate a setter if the property isn't readonly
   var setter=config.setter || ("set" + Name);

   if(config.type!=="fetched" && (perm==="readwrite") && !(setter in context))
   {
      Synth.generate("setter", config, context, setter);
   }

   // generate a getter if it doesn't already exist
   var getter=config.getter ? config.getter : ("get" + Name);

   if(!(getter in context))
   {
      Synth.generate("getter", config, context, getter);
   }

   // generate a checker if it doesn't already exist
   var checker=config.checker ? config.checker : ("has" + Name);

   if(!(checker in context))
   {
      Synth.generate("checker", config, context, checker);
   }

   // generate a fetcher if appropriate
   var fetcher=config.fetcher ? config.fetcher : ("fetch" + Name);

   if(config.type==="fetched" && !(fetcher in context))
   {
      Synth.generate("fetcher", config, context, fetcher);
   }

   return context;
});

/**
 * Generates a class from the given entity schema
 */

var isFirstRunClass=true;

Synth.register("class", function(entitySchema, context){

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

   var className=entitySchema.className || entitySchema.name;
   var _class=("class" in entitySchema) ? entitySchema.class : null;

   if(_class===null)
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
   propertyContext.getSchema=function(){ return this.constructor.schema; };

   if(entitySchema.properties)
   {
      for(var j=0, ps=entitySchema.properties, c=ps.length, propertySchema; j<c, (propertySchema=ps[j++]);)
      {
         Synth.generate("property", propertySchema, propertyContext);
      }
   }

   return _class;
});

/**
 * Generates an object graph from the given schema
 *
 * @param {Object} schema A Schema or schema definition to synthesize
 * @param {Object} context The context in which to synthesize the object graph
 */
Synth.register("object-graph", function(graphSchema, context){

   var classContext=context || {};
   var classes={};

   // synthesize each entity c
   for(var i=0, entities=graphSchema.entities, l=entities.length, entity; i<l, (entity=entities[i++]);)
   {
      Synth.generate("class", entity, classContext, entity.name);
      classes[entity.name]=classContext[entity.name];
   }

   classContext

   return classContext;
});
