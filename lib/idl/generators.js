"use strict";
var _ = require("underscore");
function Generator (usage) {
    // NOP
    this.usage = usage;
}

Generator.prototype.isRequest = function (usage) {
    return this.usage === (usage || "request");
};

Generator.prototype.lines = function (classObject) {
    var self = this, 
        lines = [];
    self.usage = classObject.role;
    lines.push(self.header(classObject));
    lines.push(self.propertyLines(classObject.properties));
    lines.push(self.methodLines(classObject.methods));
    lines.push(self.footer());
    
    return _.flatten(lines);
};

Generator.prototype.header = function (classObject) {
    var lines = [];
    if (classObject.role) {
        this.type = classObject.role;
    }
    lines.push(this.packageLines(classObject));
    lines.push(this.importLines(classObject.imports));
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

exports.Generator = Generator;