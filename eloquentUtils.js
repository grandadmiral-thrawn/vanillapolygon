//eloquentUtils.js#

//Utility Functions to make JS more Functional
var op = {
  "+": function(a, b){return a + b;},
  "==": function(a, b){return a == b;},
  "===": function(a, b){return a === b;},
  "!": function(a){return !a;}
};

var asArray = function(quasiArray, start) {
  var result = [];
  for (var i = (start || 0); i < quasiArray.length; i++)
    result.push(quasiArray[i]);
  return result;
}

function partial(func) {
  var fixedArgs = asArray(arguments, 1);
  return function(){
    return func.apply(null, fixedArgs.concat(asArray(arguments)));
  };
}

var Break = {toString: function() {return "Break";}};

var forEach = function(array, action) {
  try {
    for (var i = 0; i < array.length; i++)
      action(array[i]);
  }
  catch (exception) {
    if (exception != Break)
      throw exception;
  }
}

var reduce = function(combine, base, array) {
  forEach(array, function (element) {
    base = combine(base, element);
  });
  return base;
}

var map = function(func, array) {
  var result = [];
  forEach(array, function (element) {
    result.push(func(element));
  });
  return result;
}

var any= function(test, array) {
  for (var i = 0; i < array.length; i++) {
    var found = test(array[i]);
    if (found)
      return found;
  }
  return false;
}

var every=function(test, array) {
  for (var i = 0; i < array.length; i++) {
    var found = test(array[i]);
    if (!found)
      return found;
  }
  return true;
}

var member=function(array, value) {
  return any(partial(op["==="], value), array);
}

var flatten=function(arrays) {
    var result = [];
    forEach(arrays, function (array) {
      forEach(array, function (element){result.push(element);});
    });
    return result;
  }

var filter=function(test, array) {
  var result = [];
  forEach(array, function (element) {
    if (test(element))
      result.push(element);
  });
  return result;
}

var minimise=function(func, array) {
  var minScore = null;
  var found = null;
  forEach(array, function(element) {
    var score = func(element);
    if (minScore == null || score < minScore) {
      minScore = score;
      found = element;
    }
  });
  return found;
}

var getProperty=function(propName) {
  return function(object) {
    return object[propName];
  };
}
