"use strict";
var _ = require("underscore");
var Generator = require("./generators").Generator;

exports.ProtocolGenerator = (function () {
    function IOS (usage) {
        this.usage = usage;
        this.indent = 0;
    }
    IOS.prototype = new Generator();
    
    var builtins = {
            "object": "NSDictionary*",
            "array": "NSArray*",
            "int": "int",
            "float": "float",
            "double": "double",
            "short": "short",
            "boolean": "BOOL",
            "string": "NSString*"
    };
    
    IOS.prototype.importLines = function (importsArray) {
        var importable = _.reject(importsArray, function (type) {
            return _.isString(type) && builtins[type];
        });
        
        return _.map(importable, function (type) {
            var name = _.isString(type) ? type : "\"" + type.name + ".h\"";
            return "#import " + name;
        });
    };

    
    function typeString (type) {
        var builtin = builtins[type];
        
        return builtin ? builtin : ("id<" + type.name + ">");
    }
    
    function docsLines(docs, params) {
        var lines = [],
            comment = false;
        
        if (docs) {
            comment = true;
            lines.push("/**");
            lines.push(" * " + docs);
        }

        if (params) {
            _.each(params, function (param) {
                if (!comment) {
                    lines.push("/**");
                    comment = true;
                }
                var paramLine = [" * @param", param.name];
                if (param.docs) {
                    paramLine.push(param.docs);
                }
                lines.push(paramLine.join(" "));
            });
        }
        
        if (comment) {
            lines.push(" */");
        }
        
        return lines;
    }
    
    
    IOS.prototype.interfaceDeclLines = function (classObject) {
        var lines = [],
            superType = classObject.superClass;
        lines.push(docsLines(classObject.docs));
        superType = _.isObject(superType) ? superType.name : "NSObject";
        lines.push("@protocol " + classObject.name + " <" + superType + ">");
        return _.flatten(lines);
    };    
    
    IOS.prototype.propertyLines = function (properties) {
        var self = this;
        var lines = [];
        
        _.each(properties, function (p) {
            lines.push(" ");
            lines.push(docsLines(p.docs));

            var typeName = typeString(p.type);
            if (self.isRequest()) {
                lines.push("@property(readonly) " + typeName + " " + p.name + ";");
            } else {
                lines.push("@property " + typeName + " " + p.name + ";");            
            }
        });
        
        return _.flatten(lines);
    };
    
    IOS.prototype.methodLine = function (sig) {
        var lines = [];
        
        var comment = false;

        lines.push(docsLines(sig.docs, sig.params));
        
        var namedArgs = _.filter(sig.name.split(":"), function (t) {
            return t;
        });
        
        
        var sigLine = [
            "- (void)"
        ];
        var i = 0,
            params = sig.params,
            numParams=params.length;
        
        
        if (numParams !== 0 && numParams < namedArgs.length) {
            throw new Error("Method name " + sig.name + " doesn't the right number of params defined. Name expects " + (namedArgs.length) + ", declared " + numParams);
        } else if (numParams === 0 && namedArgs.length !== 1) {
            throw new Error("Method name " + sig.name + " doesn't the right number of params defined");
        }
        
        if (numParams === 0) {
            sigLine.push(sig.name);
        } else {
            for (i=0; i<numParams; i++) {
                var p = params[i];
                if (i < namedArgs.length) {
                    sigLine.push(namedArgs[i] + ":");
                } else {
                    sigLine.push(":");
                }
                
                sigLine.push("(" + typeString(p.type) + ")");
                sigLine.push(p.name);
                
            }
        }
        
        lines.push(sigLine.join(" ") + ";");
        
        return _.flatten(lines);
    };
    
    IOS.prototype.methodLines = function (sigArray) {
        var self = this;
        return _.map(sigArray, function (sig) {
            var lines = self.methodLine(sig);
            
            lines.unshift(" ");
            return lines;
        });
    };
    
    
    IOS.prototype.footer = function () {
        return "@end";
    };
    
    return IOS;
}());

exports.getOutputDirectory = function (kirinInfo, platformBlock) {
    return platformBlock.idlOutput;
};

exports.generateFiles = function (kirinInfo, platformBlock, classOrder, fileMap) {
    fileMap = fileMap || {};
    var generator = new exports.ProtocolGenerator(),
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
            filename = path.join(filePrefix, irClass.name + ".h");
        
        fileMap[filename] = content;
    });
    
    return fileMap;
};
