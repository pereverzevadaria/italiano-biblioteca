class PcmMic extends AudioWorkletProcessor{
 constructor(){super();this.active=false;this.sum=0;this.n=0;this.phase=0;this.chunk=[];this.port.onmessage=e=>{this.active=e.data===true;this.chunk=[];this.sum=0;this.n=0;this.phase=0;};}
 process(inputs){const x=inputs[0]?.[0];if(!this.active||!x)return true;for(const v of x){this.sum+=v;this.n++;this.phase+=16000;if(this.phase>=sampleRate){this.phase-=sampleRate;this.chunk.push(Math.round(Math.max(-1,Math.min(1,this.sum/this.n))*32767));this.sum=0;this.n=0;if(this.chunk.length===320){const a=new Int16Array(this.chunk);this.port.postMessage(a.buffer,[a.buffer]);this.chunk=[];}}}return true;}
}registerProcessor('pcm-mic',PcmMic);
