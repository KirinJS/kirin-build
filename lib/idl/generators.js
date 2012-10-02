"use strict";
var _ = require("underscore");
function Generator (usage) {
    // NOP
    this.usage = usage;
}

Generator.prototype.isRequest = function (usage) {
    return this.usage === (usage || "request");
};

function fillDefault(object, property, defaultValue) {
	if (typeof object[property] === 'undefined') {
		object[property] = defaultValue;
	}
	return object[property];
}

Generator.prototype.lines = function (classObject) {
    var self = this, 
        lines = [];
    fillDefault(classObject, "properties", []);
    fillDefault(classObject, "methods", []);
    fillDefault(classObject, "imports", []);
    self.usage = classObject.role;
    lines.push(self.header(classObject));
    lines.push(self.propertyLines(classObject.properties));
    lines.push(self.methodLines(classObject.methods));
    lines.push(self.footer(classObject));
    
    return _.flatten(lines);
};

Generator.prototype.header = function (classObject) {
    var lines = [];
    if (classObject.role) {
        this.type = classObject.role;
    }
    lines.push(this.packageLines(classObject));
    lines.push(this.importLines(classObject.imports || []));    	
    lines.push(this.interfaceDeclLines(classObject));
    return lines;
};

Generator.prototype.packageLines = function (classObject) {
    // NOP;
    return null;
};

// this should already have imports and super classes resolved
Generator.prototype.importLines = function (importsArray) {
    throw new Error("Not implemented");
};

Generator.prototype.interfaceDeclLines = function (classObject) {
    throw new Error("Not implemented");
};

Generator.prototype.propertyLines = function (properties) {
    throw new Error("Not implemented");
};

Generator.prototype.methodLines = function (properties) {
    throw new Error("Not implemented");
};

Generator.prototype.unObjectiveC = function (name) {
    var namedArgs = _.filter(name.split(":"), function (t) {
        return t;
    });
    
    var isFirst = true;
    return _.map(namedArgs, function (s) {
        if (isFirst) {
            isFirst = false;
            return s;
        }
        return s[0].toUpperCase() + s.substring(1);
    }).join("");
    
}

exports.Generator = Generator;