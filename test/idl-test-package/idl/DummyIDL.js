module.exports = {
    namespace: "com.example.kirin.bridge",
    classes: {
        "MyScreen": {
            implementedBy: "native",
            methods: { 
                // only methods allowed
                "do:times:plus": [{ x : "int" }, { y : "int" }, { z : "int" }], // capitalise properly
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
        },
        "Request": {
            role: "request",
            namespace: ".net", // dot appends
            properties: {
                headers: "object" // strings == types of return
            },
            methods: {
                respondWith: [ { response: "Response" } ], // arrays == void methods.
                onError: [] // no arg
            }
        },
        "Response": {
            namespace: ".net", // dot appends
            role: "response", // synonym for from native
            properties: {
                // no methods allowed
                status : "integer"
            }
        },
        "ValidatedRequest": {
            role: "request",
            properties: {
                myInteger: "integer",
                myBoolean: "boolean",
                myOtherBoolean: "boolean",
                myString: "string"
            },
            validation: {
                dependencies: {
                    myInteger: ["myBoolean", "myOtherBoolean"]
                },
                acceptedForms: [
                    ["myInteger"],
                    ["myString", "myOtherBoolean"]
                ],
                defaults: {
                    myString: "Help"
                }
            }
        
        }
    }
};