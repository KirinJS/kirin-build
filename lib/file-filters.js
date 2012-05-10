exports.allJavascript = /\.js$/;

exports.generatedFile = /generated/;

exports.handwrittenJavascript = function (f) {
    return exports.allJavascript.test(f) && !exports.generatedFile.test(f); 
};