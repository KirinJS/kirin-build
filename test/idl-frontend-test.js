"use strict";
var tap = require("tap"),
    test = tap.test,
    plan = tap.plan,
    _ = require("underscore");

var Transformer = require("../lib/idl/idl-frontend").Transformer;

var classes,
    transformer;
function setup () {
    classes = {};
    transformer = new Transformer(classes);
}


test("Transform parameter", function (t) {
    setup();
    var p0 = transformer.transformParameter({ arg0 : "object" });
    t.deepEqual(p0, {name: "arg0", type: "object"});
    
    var p1 = transformer.transformParameter({ arg1 : "AnotherType" });
    t.deepEqual(p1, {name: "arg1", type: classes.AnotherType });
    
    t.end();
});

test("Transform methods", function (t) {
    setup();
    
    var idlMethods = {
        noArg: [],
        oneArg: [{myArg: "int"}],
        twoArgs: [{arg0: "object"}, {arg1: "int"}]
    };
    
    var methods = transformer.transformMethods(idlMethods);
    t.ok(_.isArray(methods));

    t.equal(_.size(methods), _.size(idlMethods));
    
    var map = {};
    _.each(methods, function (m) {
        t.ok(m.name, m.name + " is represented");
        t.ok(idlMethods[m.name], m.name + " is part of the input IDL");
        map[m.name] = m;
    });
    
    t.deepEqual(map.noArg.params, []);
    t.deepEqual(map.oneArg.params, [{name: "myArg", type: "int"}]);
    t.deepEqual(map.twoArgs.params, [{name: "arg0", type: "object"}, {name: "arg1", type: "int"}]);
    t.end();
});

test("Transform properties", function (t) {
    setup();
    
    var idlProperties = {
        myDictionary: "object",
        myInt: "int",
        myBoolean: "boolean"
    };
    
    var properties = transformer.transformProperties(idlProperties);
    t.ok(_.isArray(properties));

    t.equal(_.size(properties), _.size(idlProperties));
    
    var map = {};
    _.each(properties, function (m) {
        t.ok(m.name, m.name + " is represented");
        t.ok(idlProperties[m.name], m.name + " is part of the input IDL");
        map[m.name] = m;
    });
    
    
    t.equal(map.myDictionary.name, "myDictionary");
    t.equal(map.myInt.name, "myInt");
    t.equal(map.myBoolean.name, "myBoolean");
    
    t.equal(map.myDictionary.type, idlProperties.myDictionary);
    t.equal(map.myInt.type, idlProperties.myInt);
    t.equal(map.myBoolean.type, idlProperties.myBoolean);
    
    t.end();
});

test("Transform screens and modules classes", function (t) {
    setup();
    var idl = { 
        namespace: "com.example.kirin.bridge",
        classes: {
                "MyScreen": {
                    implementedBy: "native",
                    namespace: ".screens",
                    methods: { 
                        // only methods allowed
                        "do:times:plus": [{ x : "integer" }, { y : "integer" }, { z : "integer" }], // capitalise properly
                        "displayRequest": [{ reqest: "Request" }]
                    }
                },
                "MyScreenPresenter": {
                    implementedBy: "javascript", // || gwt
                    namespace: "org.example.modules", // overrides above.
                    methods: {
                        // no non methods allowed
                        "onOkButtonTappedWithKey:andValue": [{ key : "string" }, { value : "string" }]
                    }
                }
            }
        };
    
    transformer.transformClasses(idl);
    var classes = transformer.classes;
    t.ok(classes.MyScreen);
    
    var c = classes.MyScreen;
    t.equal(c.namespace, "com.example.kirin.bridge.screens");
    
    t.ok(c.methods);
    t.equal(c.methods.length, 2);
    
    t.ok(!c.properties);
    
    // presenter
    c = classes.MyScreenPresenter;
    t.ok(c);
    t.equal(c.namespace, "org.example.modules");
    t.ok(c.methods);
    t.equal(c.methods.length, 1);
    t.end();
});

test("Transform super classes", function (t) {
    setup();
    var idl = { 
        namespace: "com.example.kirin.bridge",
        classes: {
                "MySubDTO": {
                    superClass: "MySuperDTO",
                    role: "request",
                    properties: { 
                        "bar": "int"
                    }
                },
                "MyRequest": {
                    role: "request",
                    properties: { 
                        "baz": "int"
                    }
                },
                "MySuperDTO": {
                    superClass: "MyRequest",
                    role: "request",
                    properties: { 
                        "foo": "int"
                    }
                }
            }
        };
    
    transformer.transformClasses(idl);
    var classes = transformer.classes;
    
    t.equal(_.size(classes), 3);
    var classOrder = transformer.classOrder;
    
    t.deepEqual(_.pluck(classOrder, "name"), ["MyRequest", "MySuperDTO", "MySubDTO"]);
    
    t.equal(classes.MySubDTO.imports.MySuperDTO.name, "MySuperDTO");
    t.equal(classes.MySuperDTO.imports.MyRequest.name, "MyRequest");
    t.ok(!classes.MyRequest.imports);
    
    t.end();
});

test("Transform bridge types as params", function (t) {
    setup();
    var idl = { 
        namespace: "com.example.kirin.bridge",
        classes: {
                "Module": {
                    implementedBy: "javascript",
                    methods: []
                },
                "Screen": {
                    implementedBy: "native",
                    methods: {
                        "sendRequest": [{request: "Request"}]
                    }
                },
                "Request": {
                    role: "request",
                    properties: { 
                        "foo": "int"
                    }
                }
            }
        };
    
    transformer.transformClasses(idl);
    var classes = transformer.classes;
    
    t.equal(_.size(classes), 3);
    var classOrder = transformer.classOrder;
    
    var order = _.pluck(classOrder, "name");
    console.dir(order);
    t.ok(_.indexOf(order, "Request") < _.indexOf(order, "Screen"));
    
    t.equal(classes.Screen.imports.Request.name, "Request");
    t.ok(!classes.Module.imports);
    t.ok(!classes.Request.imports);
    
    t.end();
}); 