#!/usr/bin/env node

var fs = require('fs');

var my_lzma = require("lzma");

fs.readFile('dist/bundle.js', function (err, data) {
  if (err) {
    throw err;
  }
  my_lzma.compress(data, 9, (result, err) => {
    if (err) {
      throw err;
    }
    var b = Buffer.alloc(result.length);
    for (var i = 0;i < result.length;i++) {
      b[i] = result[i];
    }

    fs.writeFile("dist/bundle.js", b, 'binary', function(err) {
      if(err) {
          return console.log(err);
      }

      console.log("Bundle compressed");
    });
  });
});
