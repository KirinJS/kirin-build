var _ = require("underscore");

var list = ["Hello", ["world"]];

console.log(_.flatten(list).join(" "));