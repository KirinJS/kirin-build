

var allJavascript = /\.js$/;
var json = /package\.json$/;
var coffeeOrJs = /\.(?:js)|(?:coffee)$/;
var nonModule = /scripts/;
var minified = /-min\.js$/;
var generated = /generated/;
var stub = /\.stub\.js/;

exports.allJavascript = function (f) {
    return allJavascript.test(f) && !stub.test(f);
};

exports.handwrittenJavascript = function (f) {
    return exports.allJavascript(f) && !generated.test(f) && !minified.test(f); 
};


var browserfiable = function (f) {
    return (coffeeOrJs.test(f) || json.test(f)) && !generated.test(f) && !nonModule.test(f) && !minified.test(f) && !stub.test(f);
};
exports.browserfiable = browserfiable;

exports.nonBrowserfiable = function (f) {
    return exports.allJavascript(f) && !browserfiable(f);
};

exports.nonCode = function (f) {
    return !coffeeOrJs.test(f);
};