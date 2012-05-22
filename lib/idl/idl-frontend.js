var _ = require("underscore");

var builtins = {
    "object": "object",
    "map": "object",
    "dictionary": "object",
    "array": "array",
    "int": "int",
    "integer": "int",
    "float": "float",
    "double": "double",
    "short": "short",
    "boolean": "boolean",
    "string": "string"
};

function Transformer (classes, ordering) {
    this.classes = classes || {};
    this.classOrder = ordering || [];
}
exports.Transformer = Transformer;

Transformer.prototype.findClass = function (className) {
    var self = this;
    if (builtins[className]) {
        return builtins[className];
    }
    
    var c = self.classes[className];
    if (!c) {
        self.classes[className] = c = {};
        self.classOrder.push(c);
    }
    
    if (self.currentClass) {
        var imports = self.currentClass.imports;
        if (!imports) {
            self.currentClass.imports = imports = {};
        }
        imports[className] = c;
    }
    
    return c;
};

Transformer.prototype.transformParameter = function (idlParam) {
    var self = this, 
        param = {};
    _.each(idlParam, function (i, key) {
        var value = idlParam[key];
        if (key === "docs") {
            param.docs = value;
        } else {
            param.name = key;
            param.type = self.findClass(value);
        }
    });
    return param;
};

Transformer.prototype.transformParams = function (idlParams) {
    var self = this;
    return _.map(idlParams, function (idlParam) {
        return self.transformParameter(idlParam);
    });
    
};


Transformer.prototype.transformProperties = function (idlProperties) {
    var self = this, 
        properties = [];
    _.each(idlProperties, function (i, key) {
        var value = idlProperties[key];
        var p;
        if (_.isString(value)) {
            p = {
                name: key,       
                type: self.findClass(value)
            };
        } else if (_.isObject(value)) {
            p = self.transformParamter(value);
        }
        
        properties.push(p);
    });
    return properties;
};

Transformer.prototype.transformMethods = function (idlMethods) {
    var self = this,
        methods = [];
    
    _.each(idlMethods, function (i, methodName) {
        var params = self.transformParams(idlMethods[methodName]);
        var m = {
            params: params,
            name: methodName
        };
        methods.push(m);
    });
    return methods;
};

var commonLanguages = {
    "javascript": 1,
    "gwt": 1
};

var bridgeTypes = {
    "request": 1,
    "response": 1
};

Transformer.prototype.checkClass = function (name, idlClass) {
    var type = idlClass.implementedBy || idlClass.role,
        hasProperties = idlClass.properties && !_.isEmpty(idlClass.properties),
        hasMethods = idlClass.methods && !_.isEmpty(idlClass.methods);
    
    
    if (type === "response" && hasMethods) {
        throw new Error("Objects with a response role are not allowed methods. '" + name + "' is not.");
    }
    
    if (hasProperties && !bridgeTypes[type]) {
        throw new Error("Only objects backed by an object/map/dictionary are allowed properties. '" + name + "' is not.");
    }
    
    idlClass.role = type;
};

Transformer.prototype.transformClass = function (globalIdl, idlClass, irClass) {
    var self = this,
        namespace = idlClass.namespace;
    irClass = irClass || {};

    self.checkClass(idlClass.name, idlClass);        
        
    // look after the superclass chain
    var superClassName = idlClass.superClass;
    
    if (superClassName) {
        if (!self.classes[superClassName] && !builtins[superClassName]) {
            var superIrClass = self.classes[superClassName] = {name: superClassName},
                superIdlClass = globalIdl.classes[superClassName];
            
            if (!superIdlClass) {
                throw new Error("Can't resolve a superclass of " + superClassName);
            }    
            
            self.transformClass(globalIdl, superIdlClass, superIrClass);
            
            if (idlClass.role !== superIdlClass.role) {
                throw new Error("Classes " + idlClass.name + " and " + superClassName + " should be the same role. Currently these are " +
                        idlClass.role + " and " + superIdlClass.role + " respectively");
            }
            
            self.classOrder.push(superIrClass);
        }
    }
        
    // add the class to the imports list.
    self.currentClass = irClass;
    if (superClassName) {
        self.findClass(superClassName);
    }
    
    if (!namespace) {
        namespace = globalIdl.namespace;
    } else if (namespace.indexOf(".") === 0) {
        namespace = globalIdl.namespace + namespace;
    }
    
    if (namespace && !(/^\w+(?:\.\w+)*$/.test(namespace))) {
        throw new Error("Namespace for " + irClass.name + " needs to be a reverse domain format. Currently it is " + namespace);
    }
    irClass.namespace = namespace;
    
    function set (propertyName, fn) {
        var object = idlClass[propertyName];
        if (!_.isObject(object)) {
            return;
        }
        var array = fn.apply(self, [object]);
        if (array && _.isArray(array)) {
            irClass[propertyName] = array;
        }
    }
    
    set("properties", self.transformProperties);
    set("methods", self.transformMethods);
    
    self.currentClass = null;
    return irClass;
};

Transformer.prototype.transformClasses = function (idl) {
    var self = this;
    
    if (!_.isObject(idl) || !_.isObject(idl.classes)) {
        throw new Error("IDL needs to be an object containing a classes object property");
    }
    
    _.each(idl.classes, function (i, name) {
        var idlClass = idl.classes[name];
        idlClass.name = name;
    });
    
    _.each(idl.classes, function (i, name) {
        var idlClass = idl.classes[name],
            irClass = self.classes[name],
            irClassSeenBefore = !!irClass;
        
        irClass = irClass || {};
        
        if (_.isEmpty(irClass)) {
            
            self.classes[name] = irClass;
            irClass.name = name;
            self.transformClass(idl, idlClass, irClass);
            
            if (!irClassSeenBefore) {
                self.classOrder.push(irClass);
            }
        }
        
    });
    
    _.each(self.classes, function (i, name) {
        var irClass = self.classes[name];
        
        if (_.isEmpty(irClass)) {
            throw new Error("No IDL definition for " + name);
        }
    });
    
    return self;
};




function Frontend (filepath) {
    this.idl = _.isString(filepath) ? require(filepath) : filepath;
    this.file = _.isString(filepath) ? filepath : null;
    this.transformer = new Transformer();
}
exports.Frontend = Frontend;

Frontend.prototype.generateIR = function () {
    var self = this;
    try {
        return self.transformer.transformClasses(self.idl).classOrder;
    } catch (e) {
        if (self.file) {
            throw new Error("Problem with " + self.file + ": " + e);
        } else {
            throw e;
        }
    }
};



