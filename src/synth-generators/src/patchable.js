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
      path: "/" + schemaName + "/0",
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

Synth.extend("entity", function(_class){

   _class.prototype.afterCreate=appendCreateToPatch;
   _class.prototype.beforeUpdate=appendUpdateToPatch;
   _class.prototype.afterDelete=appendDeleteToPatch;
});
