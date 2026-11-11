const fs=require('fs'); const rate=22050, seconds=24, cross=2*rate, n=seconds*rate, raw=new Float64Array(n+cross);let seed=61111,lo=0,mid=0;
function noise(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;}
for(let i=0;i<raw.length;i++){const a=noise();lo+=.018*(a-lo);mid+=.13*(a-mid);const wind=.7+.16*Math.sin(2*Math.PI*i/n)+.12*Math.sin(6*Math.PI*i/n+.7);raw[i]=(lo*2.5+(mid-lo)*.22)*wind;}
const out=new Float64Array(n);out.set(raw.subarray(0,n));for(let i=0;i<cross;i++){const t=i/cross;out[i]=raw[n+i]*(1-t)+raw[i]*t;}
let peak=0;for(const v of out)peak=Math.max(peak,Math.abs(v));
const b=Buffer.alloc(44+n*2);b.write('RIFF');b.writeUInt32LE(36+n*2,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(n*2,40);for(let i=0;i<n;i++)b.writeInt16LE(Math.round(out[i]/peak*11000),44+i*2);
fs.writeFileSync('public/assets/audio/20261111-forest-breeze.wav',b);console.log('24-second original synthetic breeze loop',b.length,'bytes');
