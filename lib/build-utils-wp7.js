"use strict";

var _ = require("underscore"),
    fs = require("fs"),
    path = require("path"),
    fsHelper = require("./fs-helper"),
    fileFilters = require("./file-filters"),
    filesets = require("./filesets"),
    BuildUtils = require("./build-utils").BuildUtils;

    
function WP7Utils (argv, nodeModule) {
    BuildUtils.apply(this, arguments);
}

exports.create = function (argv, nodeModule) {
    return new WP7Utils(argv, nodeModule);
};