"use strict";
var _ = require("underscore");
var Generator = require("./generators").Generator;

var defaultIndent = "    ";

exports.InterfaceGenerator = (function () {
    function Android (usage) {
        this.usage = usage;
        this.indent = 0;
    }
    Android.prototype = new Generator();
    
    var builtins = {
            "object": "JSONObject",
            "array": "JSONArray",
            "int": "int",
            "float": "float",
            "double": "double",
            "short": "short",
            "boolean": "boolean",
            "string": "String"
    };
    
    var builtinImportables = {
            "object": "org.json.JSONObject",
            "array": "org.json.JSONArray"
    };
    
    Android.prototype.importLines = function (importsArray) {
        
        
        var importable = _.reject(importsArray, function (type) {
            return _.isString(type) && !builtinImportables[type];
        });
        
        var lines = _.map(importable, function (type) {
            var name = _.isString(type) ? builtinImportables[type] : (type.namespace + "." + type.name);
            return "import " + name + ";";
        });
        
        lines.push(" ");
        return lines;
    };

    Android.prototype.packageLines = function (classObject) {
        // NOP;
        return ["package " + classObject.namespace + ";", " "];
    };
    
    function typeString (type) {
        var builtin = builtins[type];
        
        return builtin ? builtin : type.name;
    }
    
    function docsLines(docs, params, suppressIndent) {
        if (_.isUndefined(suppressIndent) && _.isBoolean(params)) {
            suppressIndent = params;
            params = null;
        }
        var indent = suppressIndent ? "" : defaultIndent;
        
        var lines = [],
            comment = false;
        
        if (docs) {
            comment = true;
            lines.push(indent + "/**");
            lines.push(indent + " * " + docs);
        }

        if (params) {
            _.each(params, function (param) {
                if (!comment) {
                    lines.push(indent + "/**");
                    comment = true;
                }
                
                var paramLine = [" * @param", param.name, "{@link " + typeString(param.type) + "}"];
                if (param.docs) {
                    paramLine.push(param.docs);
                }
                lines.push(indent + paramLine.join(" "));
            });
        }
        
        if (comment) {
            lines.push(indent + " */");
        }
        
        return lines;
    }
    
    
    Android.prototype.interfaceDeclLines = function (classObject) {
        var lines = [],
            superType = classObject.superClass;
        
        lines.push(docsLines(classObject.docs, true));
        superType = _.isObject(superType) ? (" implements " + superType.name) : "";
        lines.push("public interface " + classObject.name + superType + " {");
        return _.flatten(lines);
    };    
    
    Android.prototype.propertyLines = function (properties) {
        var self = this;
        var lines = [];
        
        _.each(properties, function (p) {
            lines.push(" ");
            lines.push(docsLines(p.docs));

            var typeName = typeString(p.type),
                paramName = p.name;
            paramName = paramName[0].toUpperCase() + paramName.substring(1);
            if (self.isRequest()) {
                lines.push(defaultIndent + typeName + " get" + paramName + "();");
            } else {
                lines.push(defaultIndent + "void set" + paramName + "(" + typeName + " " + p.name + ");");
            }
        });
        
        return _.flatten(lines);
    };
    
    Android.prototype.methodLine = function (sig) {
        var lines = [];
        
        var comment = false;

        lines.push(docsLines(sig.docs, sig.params));
        
        var namedArgs = _.filter(sig.name.split(":"), function (t) {
            return t;
        });
        
        var isFirst = true;
        var methodName = _.map(namedArgs, function (s) {
            if (isFirst) {
                isFirst = false;
                return s;
            }
            return s[0].toUpperCase() + s.substring(1);
        }).join("");
        
        var params  = _.map(sig.params, function (p) {
            return typeString(p.type) + " " + p.name;
        });        
        lines.push(defaultIndent + "void " + methodName + "(" + params.join(", ") + ");");
        
        return _.flatten(lines);
    };
    
    Android.prototype.methodLines = function (sigArray) {
        var self = this;
        return _.map(sigArray, function (sig) {
            var lines = self.methodLine(sig);
            
            lines.unshift(" ");
            return lines;
        });
    };
    
    
    Android.prototype.footer = function () {
        return "}";
    };
    
    return Android;
}());

exports.getOutputDirectory = function (kirinInfo, platformBlock) {
    return platformBlock.idlOutput;
};

exports.generateFiles = function (kirinInfo, platformBlock, classOrder, fileMap) {
    fileMap = fileMap || {};
    var generator = new exports.InterfaceGenerator(),
        filePrefix = exports.getOutputDirectory(kirinInfo, platformBlock),
        path = require("path");
    
    if (!filePrefix) {
        throw new Error("An idlOutput is needed in package.json");
    }
    
    _.each(classOrder, function (irClass) {
        if (!irClass) {
            return;
        }
        
        var lines = generator.lines(irClass),
            content = lines.join("\n"),
            packageName = irClass.namespace.replace(/\./g, "/"),
            filename = irClass.name + ".java";
        
        fileMap[path.join(filePrefix, packageName, filename)] = content;
    });
    
    return fileMap;
};
