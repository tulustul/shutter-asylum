const script = document.createElement('script');
script.onload = () => {
  fetch('bundle.js').then(r => {
    r.arrayBuffer().then(d => {
      d = new Uint8Array(d);
      LZMA.decompress(d, result => {
        eval(result);
      });
    });
  });
}
script.src = 'lzma.js';
document.body.appendChild(script);
