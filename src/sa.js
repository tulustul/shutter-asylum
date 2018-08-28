const s = document.createElement('script')
s.onload = async () => {
  const r = await fetch('bundle.js')
  const b = await r.arrayBuffer()
  LZMA.decompress(new Uint8Array(b), r => eval(r))
}
s.src = 'lzma.js'
document.body.appendChild(s)
