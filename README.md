ObjectGraph
===========

Object Graph is an extensible object graph for the browser and node.

Basic Usage
-----------

```javascript
import {Schema} from "schema"
import {ObjectGraph} from "object-graph"

let schema = Schema.load("todo-schema.json");
const graph = new ObjectGraph(schema);
graph.on("change", app.sync);

let todo = new graph.todo();
todo.setTitle("Use ObjectGraph!");
todo.save();
```

**Out of the box it offers:**
- [First-class entities and property methods](#firstclass)
- [Internal querying with hooks to external data stores](#queries)
- [Maintains relationships and computed values](#relationships)
- [Caching of expensive operations](#caching)
- [Data in/out hooks for working with data stores](#stores)

First-class Entity Classes
--------------------------
<a name="firstclass"></a>

```javascript
let todo=new objectGraph.todo();

// high-level property methods
todo.hasTitle(); // <- false
todo.setTitle("Use ObjectGraph!");
todo.has("title"); // <- true
todo.get("title"); // <- "Use ObjectGraph!"

todo.getProject().setDateDue(nextWeek);
```

Querying
----------------
<a name="querying"></a>

Queries are achieved by providing a set of descriptors that describe the desired result set.

### Simple
So if you need a list of all the Todos that have not yet been completed:
```javascript
graph.find({
   entityName: "Todo",
   predicate: "dateCompleted==undefined"
});
```

### Complex with nesting  
Now, let's say you need all the people whose employers have a title that starts with 'T'.  Dot notation can be used to query the relationship.
```javascript
graph.find({
   entityName: "Person",
   predicate: "employer.title BEGINSWITH 'T'"
});
```

Object Graph processes these directives on internal data to provide results quickly, however often this data is not yet in memory.

### External Data Store
Because data will need to be fed in from external data stores of various formats, it is beneficial for the query language to be agnostic.

For this, [Descriptor](https://bitbucket.org/collinbrewer/descriptor) is used to provide an abstract interface that can be easily converted to the required format.

```js
graph.stores.sqlStore.query = (descriptor) => {
   let sql=SQLDescriptor.from(descriptor);
   return sqlDb.query(sql);
}
```

Relationships and Computed Values
---------------------------------
<a name="relationships"></a>

ObjectGraph maintains data consistency automatically between related entities and properties.

For a simple example, the property `fullName` is computed by concatenating the value of the `firstName` and `lastName` properties.  Object Graph knows that if `firstName` or `lastName` change, that `fullName` should also change.

```javascript
let person = new graph.person();
person.on("change:fullName", fullNameChanged);
person.setFirstName("Jennifer"); // fires fullNameChanged!
```

Caching
-------
<a name="caching"></a>

Object Graph automatically caches property values, computed properties, query result sets, and relationship resolutions while also automatically invalidating cached data from changes to the object graph.

Memory footprint is automatically managed with sensible defaults, that can be overridden.  Cache can also be purged manually with `graph.purgeCache();`

Data Stores
-----------
Object graph functionality is only useful with data.

Loading existing data from external stores is simple:

```js
class Store extends ObjectGraph.Store {
   read = (descriptor) => {
      let mongoQuery=mongoQueryFromDescriptor(descriptor);
      return mongodb.find(mongoQuery);
   }
}
graph.addStore(api);
```

Pushing changes is also straightforward:

```js
class Store extends ObjectGraph.Store {
   create = (type, id) => {
      return mongodb.collection[type].insert({id});
   }
}
graph.addStore(api);
```
