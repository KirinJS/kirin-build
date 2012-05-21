"use strict";
var tap = require("tap"),
    test = tap.test,
    plan = tap.plan,
    _ = require("underscore");

var Generator = require("../lib/idl/generators-ios").ProtocolGenerator;

var g,
    classes;

var subClass, baseClass;

function setup() {

    baseClass = {
        name: "BaseClass"
    };
    
    classes = {
        BaseClass: baseClass,
        mySubclass: {
            docs: "A little class that could",
            name: "mySubclass",
            superClass: baseClass,
        
            imports: [
                      "array", "object", baseClass
             ],
        
        
            properties: [
                 {
                     name: "foo",
                     type: "int",
                     docs: "It wasn't supposed to be like this"
                 },
                 {
                     name: "bar",
                     type: "object"
                 },
                 {
                     name: "baz",
                     type: "array"
                 },
                 {
                     name: "quuz",
                     type: baseClass
                 }
                 
            ],
            
            methods: [
                {
                    name: "noArg",
                    docs: "Some pig",
                    params: []
                },
                {
                    name: "oneArg:",
                    docs: "Moar pigs",
                    params: [
                        {
                            name: "foo",
                            type: "int",
                            docs: "A foo"
                        }
                    ]
                },
                {
                    name: "two:args:",
                    params: [
                             {
                                 name: "foo",
                                 type: "int",
                                 docs: "A foo"
                             },
                             {
                                 name: "bar",
                                 type: "string",
                                 docs: "A bar"
                             }
                             ]
                }
            ]
        }
    };
    
    subClass = classes.mySubclass;
    
    g = new Generator("request");
}

test("generating imports", function (t) {
    setup();
    
    
    t.deepEqual(['#import "BaseClass.h"'], g.importLines(subClass.imports));
    
    t.end();
});

test("generating declaration", function (t) {
    setup();
    
    t.deepEqual(g.interfaceDeclLines(baseClass), ["@protocol BaseClass <NSObject>"]);
    t.deepEqual(g.interfaceDeclLines(subClass), [
         "/**",
         " * A little class that could",
         " */",
         "@protocol mySubclass <BaseClass>"
    ]);
   
    t.end();
});

test("generating properties", function (t) {
    setup();
    t.deepEqual(g.propertyLines(subClass.properties), 
                [" ",
                 "/**", 
                 " * It wasn't supposed to be like this", 
                 " */",
                 "@property(readonly) int foo;",
                 " ",
                 "@property(readonly) NSDictionary* bar;",
                 " ",
                 "@property(readonly) NSArray* baz;",
                 " ",
                 "@property(readonly) id<BaseClass> quuz;"]);
    t.end();
});

test("generating method sig happy case", function (t) {
    setup();
    t.deepEqual(["/**",
                 " * Some pig",
                 " */",
                 "- (void) noArg;"], g.methodLine(subClass.methods[0]));
    t.deepEqual(["/**",
                 " * Moar pigs",
                 " * @param foo A foo",
                 " */",
                 "- (void) oneArg: (int) foo;"], g.methodLine(subClass.methods[1]));
    t.deepEqual(["/**",
                 " * @param foo A foo",
                 " * @param bar A bar",
                 " */",
                 "- (void) two: (int) foo args: (NSString*) bar;"], g.methodLine(subClass.methods[2]));
    
    t.end();
});

test("generating method sig wrong number of colons", function (t) {
    var lines, 
        sig = {
        name: "two:args:",
        params: [
                 {
                     name: "foo",
                     type: "int"
                 },
                 {
                     name: "bar",
                     type: "string"
                 }
                 ]
    };
    // happy case
    t.ok(g.methodLine(sig));
    
    sig.name = "two::args";
    lines = g.methodLine(sig);
    t.equal(lines[lines.length - 1], "- (void) two: (int) foo args: (NSString*) bar;");
    
    sig.name = "two:args";
    lines = g.methodLine(sig);
    t.equal(lines[lines.length - 1], "- (void) two: (int) foo args: (NSString*) bar;");
    
    sig.name = "twoargs";
    lines = g.methodLine(sig);
    t.equal(lines[lines.length - 1], "- (void) twoargs: (int) foo : (NSString*) bar;");

    sig.name = "two::args:";
    lines = g.methodLine(sig);
    t.equal(lines[lines.length - 1], "- (void) two: (int) foo args: (NSString*) bar;");
    
    // we could go one all night like this.
    sig.name = "two::::args:::::";
    lines = g.methodLine(sig);
    t.equal(lines[lines.length - 1], "- (void) two: (int) foo args: (NSString*) bar;");

    sig.name = "two:args:notthree:";
    t.throws(function () {        
        lines = g.methodLine(sig);
    });

    sig.name = "two:args:notthree";
    t.throws(function () {        
        lines = g.methodLine(sig);
    });
    
    t.end();
});


test("Whole protocol", function (t) {
    setup();
    
    t.ok(subClass);
    console.log(g.lines(subClass).join("\n"));
    
    t.end();
});