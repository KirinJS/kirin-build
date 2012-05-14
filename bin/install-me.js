#!/usr/bin/env node
var fsHelper = require("../lib/fs-helper"),
    path = require("path"),
    fs = require("fs");

// TODO this is unix only atm.
var binScript = [ "#!/bin/sh",
                  process.execPath + " " + __dirname + "/kirin-build.js $@"
                 ];
var binScriptLocation = path.join(process.env.HOME, "bin", "kirin-build");
fsHelper.writeFileSync(binScriptLocation, binScript.join("\n"));
fs.chmodSync(binScriptLocation, "755");