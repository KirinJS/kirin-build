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
            var paramName = p.name;
            var modifiers = [];
            if (self.isRequest()) {
                if (!_.isString(p.type)) {
                    lines.push("// You can use this dictionary to back an object that behaves like a " + typeName + " object:");
                    lines.push("// " + typeName + " " + paramName + 
                            " = [self.kirinHelper proxyForJavascriptRequest:@protocol(" + p.type.name + ")" +
                            " andDictionary: request." + paramName + "];");
                    typeName = builtins.object;
                }
                modifiers.push("readonly");
            }
            
            if (typeName.indexOf("*") >= 0) {
                modifiers.push("retain");
            }
            
            modifiers = modifiers.length ? ( "(" + modifiers.join(", ") + ")") : "";
            lines.push("@property" + modifiers + " " + typeName + " " + p.name + ";");            
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
                
                // XXX this isn't optimal. We would like to be able to detect the 
                // type from the selector, but this is difficult (read: I don't know how to do it),
                // and then create and pass the correct proxy to the callee.
                // TODO: once we work how to do this, then we don't have to ask the app developer to do it. 
                var typeName = typeString(p.type),
                    paramName = p.name;
                if (this.isRequest("native") && !_.isString(p.type)) {
                    var newParamName = paramName + "Dictionary";
                    lines.push("// You can use this dictionary to back an object that behaves like a " + typeName + " object:");
                    lines.push("// " + typeName + " " + paramName + 
                            " = [self.kirinHelper proxyForJavascriptRequest:@protocol(" + p.type.name + ")" +
                            " andDictionary: " + newParamName + "];");
                    paramName = newParamName;
                    typeName = builtins.object;
                }
                
                sigLine.push("(" + typeName + ")");
                sigLine.push(paramName);
                
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

exports.getOutputDirectory = function (nodeModule, kirinInfo, platformBlock) {
    return platformBlock.idlOutput;
};

exports.generateFiles = function (filePrefix, classOrder, fileMap) {
    fileMap = fileMap || {};
    var generator = new exports.ProtocolGenerator(),
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
