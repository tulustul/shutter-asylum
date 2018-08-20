#!/usr/bin/env node

const fs = require('fs');

const my_lzma = require("lzma");

function compressFile(filepath) {
  fs.readFile(filepath, (err, data) => {
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

      fs.writeFile(filepath, b, 'binary', err => {
        if(err) {
          return console.log(err);
        } else {
          console.log(`file ${filepath} compressed`);
        }

      });
    });
  })
}

compressFile('dist/bundle.js');

fs.readdir('dist/levels', (err, files) => {
  files.forEach(filename => {
    compressFile(`dist/levels/${filename}`);
  });
})
