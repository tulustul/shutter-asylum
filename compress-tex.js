#!/usr/bin/env node

const imagemin = require('imagemin');
const imageminPngquant = require('imagemin-pngquant');

const pngquant = imageminPngquant({
  floyd: 0.5,
  nofs: true,
  posterize: 4,
  // quality: 0,
  speed: 1,
  strip: true,
});

imagemin(['dist/tex.png'], 'dist', {use: [pngquant]}).then(() => {
	console.log('Texture compressed');
});
