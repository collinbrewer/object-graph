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

   function honorDenyDeleteRule()
   {
      // TODO: here we aren't interested in the actual objects, just that they exist, so we can improve performance by just getting IDs

      // fetch all of the *deny* properties for the parent object
      // TODO: just use o.fetch(ps, fn);
      // TODO: we fetch the properties for each delete rule this entity has, instead, just do it once if there are any delete rules
      this.read(
         {
            entityName:o.entity.name,
            predicate:HRPredicate.parse("ID==?", [o.getID()]),
            properties:ps,
            _includeDeleted:true,
            _profile: {
               what:"Gets properties of a specific entity",
               why:"For honoring deny rules for deletion"
            }
         },
            function(result, error){

                    if(result)
                    {
                        var toBeDeleted=[];

                        // if there are any existing properties for the deny rules, then we can't delete this parent object
                        for(var i=0, property; (property=propertiesByDeleteRule.deny[i]); i++)
                        {
                           var value=o.get(property.name);

                           if(value || value.length)
                           {
                              // if we get here, then we have to deny the delete... skip the cascade and nullify rules
                              _doneHonoringDeleteRules(false, "Can't delete because '" + property.name + "' is not null.");
                              // this._doneHonoringDeleteRulesForObject(o, false, "Can't delete because '" + property.name + "' is not null.");

                              return;
                           }
                        }
                     }

                     _honorCascadeRules();

                  }.bind(this), true);
   }

   function honorCascadeDeleteRules()
   {
      if(propertiesByDeleteRule.cascade.length)
      {
         var ps=HR.Object.get(propertiesByDeleteRule.cascade, "@distinctUnion.name");
         debug && console.log("honoring " + propertiesByDeleteRule.cascade.length + " 'cascade' delete rule(s) for properties: " + ps.join(", "));

         // TODO: this is too low-level... use o.fetch(ps);

         console.log("ps: ", ps);

         this.read(
            {
               entityName:o.entity.name,
               predicate:HRPredicate.parse("ID==?", [o.getID()]),
               properties:ps,
               _includeDeleted:true,
               _profile: {
                  what:"Gets properties of a specific entity",
                  why:"For honoring cascade rules for deletion"
               }
            },
            function _checkDeleteRules(result, error){

               debug && console.log("checking delete rules: ", arguments);

               var i, property, value, sub;

               if(result)
               {
                  debug && console.log("fetched properties for %o with cascade delete rule: ", result, ps);

                  var toBeDeleted=[];

                  // if there are any properties with a deny rule, then we can't delete this parent object
                  for(i=0; (property=propertiesByDeleteRule.cascade[i]); i++)
                  {
                     console.log("checking relationships to cascade delete to: ", property.name);

                     value=o.get(property.name);

                     console.log("value: ", value);

                     debug && console.log(value);

                     if(value)
                     {
                        toBeDeleted=toBeDeleted.concat(value); //value.constructor===Array ? value : [value]);
                     }
                  }

                  console.log("to be deleted: ", toBeDeleted);

                  var count=toBeDeleted.length;

                  var finished=function(){

                     count--;

                     if(count<=0)
                     {
                        _honorNullifyRules();
                     }
                  };

                  if(toBeDeleted.length)
                  {
                     for(i=0; (sub=toBeDeleted[i]); i++)
                     {
                        // console.log("destroying: ", sub);
                        this.destroy(sub, finished, bypassQueue);
                     }
                  }
                  else
                  {
                     debug && console.log("no related objects need to be deleted");

                     finished();
                  }
               }
            }.bind(this)
         );
      }
   }

   function honorNullifyRules()
   {
      if(propertiesByDeleteRule.nullify.length)
      {
         // TODO: implement
         console.warn("The 'nullify' delete rull is untested");

         propertiesByDeleteRule.nullify.map(function(p){ o.set(p.name, null); });

         var ps=HR.Object.get(propertiesByDeleteRule.deny, "@distinctUnion.name");

         // TODO: just use o.fetch(ps);
         this.read(
            {
               entityName:o.entity.name,
               predicate:HRPredicate.parse("ID==?", [o.getID()]),
               properties:ps,
               _includeDeleted:true,
               _profile: {
                  what:"Gets properties of a specific entity",
                  why:"For honoring nullify rules for deletion"
               }
            },

            function _checkNullifyRules(result, error){

               if(result)
               {
                  debug && console.log("planning to nullify: ", result);

                  var toBeDeleted=[];

                  _doneHonoringDeleteRules(true);
               }
            }.bind(this),

            true);
      }
      else
      {

         debug && console.log("no 'nullify' delete rules, moving on...");

         _doneHonoringDeleteRules(true);
      }
   }

   function getDeleteSummary(o, summary)
   {
      var schema=this.getSchema();
      var properties=this.getSchema().getProperties();
      var deleteRule;
      var getter;
      var destinationObject;

      if(!summary)
      {
         summary={
            "isDeletable": true,
            "wal": []
         }
      }

      var isDeletable=summary.isDeletable;
      var wal=summary.wal;

      for(var i=0, l=properties.length, property; i<l, (property=properties[i++]);)
      {
         deleteRule=property.getDeleteRule();

         if(deleteRule)
         {
            getter=property.getGetterName();
            destinationObject=getter.call(this);

            if(deleteRule==="nullify") // nullify the inverse relationship
            {
               var inverseProperty=destinationObject.getSchema().getInverse();
               wal.push({
                  "op" : "replace",
                  "path" : "/" + property.getEntityName() + "/" + destinationObject.ID + "/" + inverseProperty.getName(),
                  "value" : null
               });
            }
            else if(deleteRule==="cascade") // propagate the delete
            {
               getDeleteSummary(destinationObject, summary);
            }
            else if(deleteRule==="deny") // prevent the delete
            {
               if(destinationObject)
               {
                  isDeletable=false;

                  break;
               }
            }
         }
      }

      return {
         "isDeletable" : isDeletable,
         "wal" : wal
      };
   }

   // FIXME: the delete rules can lead to fragmented results because the process
   // is not atomic.  for example: the parent object to be deleted may have a
   // property with a nullify delete rule that will wipe out the value of the
   // property, then have another property with a *deny* delete rule, whose
   // value is not null, denying the deletion of the parent object, but the
   // value of the previous property has already been nulled out I guess we'd
   // build a queue of things we'll do if all the rules checkout
   // TODO: following the delete rules turns this operation into an asynchronous
   // one and that isn't clear, need to push all operations onto a queue so
   // everything stays in order
   // TODO: we should preflight the operation against the delete rules, and
   // return the preflight success... validateForDelete

   // to solve these issues, all CRUD operations will return their preflighted results immediately, but the asynchronous results will be queued
   //    create - will create the object in the context and return the object, but will queue the addition to the summary

   // delete rules
   //    no-action: does nothing
   //    nullify: business.destroy() > business.getCEO().setBusiness(null);
   //    cascade: business.destroy() > business.getCEO().destroy();
   //    deny: business.destroy() > if(business.getCEO()==null) return true; else return false;
   // delete: function(){
   //
   //    var deleteSummary=getDeleteSummary(this);
   //
   //    if(deleteSummary.canBeDeleted)
   //    {
   //
   //    }
   // }

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

      var proto=_class.prototype;



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
