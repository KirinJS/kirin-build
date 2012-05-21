"use strict";
var _ = require("underscore");
function Generator (usage) {
    // NOP
    this.usage = usage;
}

Generator.prototype.isRequest = function () {
    return this.usage === "request";
};

Generator.prototype.lines = function (classObject) {
    var self = this, 
        lines = [];
    
    lines.push(self.header(classObject));
    lines.push(self.propertyLines(classObject.properties));
    lines.push(self.methodLines(classObject.methods));
    lines.push(self.footer());
    
    return _.flatten(lines);
};

Generator.prototype.header = function (classObject) {
    var lines = [];

    lines.push(this.importLines(classObject.imports));
    lines.push(this.interfaceDeclLines(classObject));
    return lines;
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