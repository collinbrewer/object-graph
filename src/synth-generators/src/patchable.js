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
   var schemaName=this.getSchema().name;
   var ID=this.ID;

   this.objectGraph.applyPatch([{
      op: "add",
      path: "/" + schemaName + "/0",
      value: {"ID":ID}
   }]);

   this.objectGraph.register(this);
};

function appendUpdateToPatch(schema)
{
   this.objectGraph.applyPatch([{
      op: "replace",
      path: "/" + this.schema.name + "/" + this.uuid + "/" + schema.name,
      value: this[schema.name]
   }]);
};

function appendDeleteToPatch(schema)
{
   this.objectGraph.applyPatch([{
      op: "delete",
      path: "/" + this.schema.name + "/" + this.uuid
   }]);
}

Synth.extend("class", function(_class){

   _class.prototype.afterCreate=appendCreateToPatch;
   _class.prototype.afterUpdate=appendUpdateToPatch;
   _class.prototype.afterDelete=appendDeleteToPatch;
});