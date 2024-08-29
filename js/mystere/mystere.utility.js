//UTILITIES MODULE WITH USEFUL THINGS!!! (mys.UTL)
mys.UTL = {
    isFunction: function(functionToCheck) {
      return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
     },
     executeFunctionByName: function(functionName, context /*, args */) {
      var args = Array.prototype.slice.call(arguments, 2);
      var namespaces = functionName.split(".");
      var func = namespaces.pop();
      for (var i = 0; i < namespaces.length; i++) {
          context = context[namespaces[i]];
      }
      return context[func].apply(context, args);
  }
  }
  Object.byString = function(o, s) {
    s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    s = s.replace(/^\./, '');           // strip a leading dot
    var a = s.split('.');
    console.log(o, s)
    for (var i = 0, n = a.length; i < n; ++i) {
        var k = a[i];
        if (k in o) {
            o = o[k];
        } else {
            return;
        }
    }
    return o;
  }
  Object.setPropByString = function(object, path, value) {
    const props = path
        .split(/[./[\]]/g)
        .filter(p => p)
    const prop = props.pop()
    const parent = props.reduce((result, key) => result[key], object)
    parent[prop] = value
  }
  
  