

var allJavascript = /\.js$/;
var json = /\.(?:json)$/;
var coffeeOrJs = /\.(?:js)|(?:coffee)$/;
var nonModule = /scripts/;
var minified = /-min\.js$/;
var generated = /generated/;

exports.allJavascript = allJavascript;

exports.handwrittenJavascript = function (f) {
    return exports.allJavascript.test(f) && !generated.test(f) && !minified.test(f); 
};


var browserfiable = function (f) {
    return (coffeeOrJs.test(f) || json.test(f)) && !generated.test(f) && !nonModule.test(f) && !minified.test(f);
};
exports.browserfiable = browserfiable;

exports.nonBrowserfiable = function (f) {
    return allJavascript.test(f) && !browserfiable(f);
};

exports.nonCode = function (f) {
    return !coffeeOrJs.test(f);
};