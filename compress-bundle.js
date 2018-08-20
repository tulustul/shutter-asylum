#!/usr/bin/env node

const fs = require('fs');

const my_lzma = require("lzma");

fs.readFile('dist/bundle.js', function (err, data) {
  if (err) {
    throw err;
  }
  my_lzma.compress(data, 9, (result, err) => {
    if (err) {
      throw err;
    }
    const b = Buffer.alloc(result.length);
    for (let i = 0;i < result.length;i++) {
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
