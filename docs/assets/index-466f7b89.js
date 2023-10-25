var I=Object.defineProperty;var P=(r,t,e)=>t in r?I(r,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[t]=e;var l=(r,t,e)=>(P(r,typeof t!="symbol"?t+"":t,e),e);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))i(a);new MutationObserver(a=>{for(const s of a)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function e(a){const s={};return a.integrity&&(s.integrity=a.integrity),a.referrerPolicy&&(s.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?s.credentials="include":a.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(a){if(a.ep)return;a.ep=!0;const s=e(a);fetch(a.href,s)}})();const u={ALL:"all",FPS:"fps",INIT:"init",RENDER_START:"renderStart",RENDER_END:"renderEnd",IMAGE_LOADED:"imageLoaded",RENDER_SPRITE:"renderSprite",ANIMATION_END:"animationEnd",ATTACK:"attack",ATTACK_COMMAND:"attackCommand"},p=class p{constructor(){l(this,"listeners",{[p.ALL]:[]});l(this,"on",(t,e)=>{this.listeners[t]||(this.listeners[t]=[]),this.listeners[t].push(e)});l(this,"once",(t,e)=>{let i=(a,s)=>{e(a,s),this.off(a,i)};this.on(t,i)});l(this,"emit",(t,e)=>{const i=this.listeners[t];if(i){const s=i.length;for(let o=0;o<s;o++)i[o](t,e)}const a=this.listeners[p.ALL];if(a){const s=a.length;for(let o=0;o<s;o++)a[o](t,e)}});l(this,"off",(t,e)=>{const i=this.listeners[t];i&&(this.listeners[t]=i.filter(a=>a!==e))})}};l(p,"ALL",u.ALL);let D=p;const m={up:["ArrowUp","w"],down:["ArrowDown","s"],left:["ArrowLeft","a"],right:["ArrowRight","d"],attack:[" "],toggleDebugGameState:["O"],debugPlayerSpriteSheet:["P"]},X=r=>t=>{m.attack.includes(t.key)&&(t.preventDefault(),r.controls.attack=!0,r.emitter.emit(u.ATTACK_COMMAND,null)),m.up.includes(t.key)&&(t.preventDefault(),r.controls.up=!0),m.down.includes(t.key)&&(t.preventDefault(),r.controls.down=!0),m.left.includes(t.key)&&(t.preventDefault(),r.controls.left=!0),m.right.includes(t.key)&&(t.preventDefault(),r.controls.right=!0),m.toggleDebugGameState.includes(t.key)&&(t.preventDefault(),r.settings.debugGameState=!r.settings.debugGameState,r.elements.gameStateContainer.style.display=r.settings.debugGameState?"block":"none"),m.debugPlayerSpriteSheet.includes(t.key)&&(t.preventDefault(),r.settings.debugPlayerSpriteSheet=!r.settings.debugPlayerSpriteSheet)},O=r=>t=>{m.up.includes(t.key)&&(t.preventDefault(),r.controls.up=!1),m.down.includes(t.key)&&(t.preventDefault(),r.controls.down=!1),m.left.includes(t.key)&&(t.preventDefault(),r.controls.left=!1),m.right.includes(t.key)&&(t.preventDefault(),r.controls.right=!1)};const U=1,A=.25,W=.25,G=(r,t)=>{const e=new Image;return e.onload=r,e.src=t,e},_=r=>r.split(" ").reduce((i,a)=>{const[s,o]=a.split("=");return["true","false"].includes(o)?i[s]=o==="true":i[s]=o,i},{}),H=r=>Object.entries(r.frames).reduce((t,[e,i],a)=>{var n;const[s,o]=e.split("--");if(t[s])t[s].frames.push(i);else if(r.meta.frameTags){const f=((n=r.meta.frameTags.find(({name:c})=>s===c))==null?void 0:n.data)||"",d=_(f);t[s]={frames:[i],data:d}}return t},{});class M{constructor(t,e,i,a){l(this,"spriteSheet");l(this,"spriteFrames");this.spriteJSON=t,this.emitter=i,this.onLoad=a,this.spriteSheet=G(()=>{var s;(s=this.onLoad)==null||s.call(this),this.emitter.emit(u.IMAGE_LOADED,{imagePath:e})},e),this.spriteJSON=t,this.spriteFrames=H(this.spriteJSON)}}function Y(r,t){return([e,i])=>i.data.direction===t&&(!!i.data.movement==!!r.moving||r.attacking)&&!!r.attacking==!!i.data.attack}const w=r=>r.width/20,L=(r,t,e,{canvasX:i,canvasY:a,canvasWidth:s,canvasHeight:o,spriteX:n,spriteY:f,spriteWidth:d,spriteHeight:c})=>{r.imageSmoothingEnabled=!1,r.drawImage(e,n,f,d,c,i,a,s,o)},K={"Blink Bounce Down--0":{frame:{x:2,y:2,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Blink Bounce Down--1":{frame:{x:20,y:2,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Blink Bounce Down--2":{frame:{x:38,y:2,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Blink Bounce Down--3":{frame:{x:56,y:2,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Blink Bounce Down--4":{frame:{x:74,y:2,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Bounce Down--0":{frame:{x:2,y:20,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Bounce Down--1":{frame:{x:20,y:20,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Bounce Down--2":{frame:{x:38,y:20,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Bounce Down--3":{frame:{x:56,y:20,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Bounce Right--0":{frame:{x:2,y:38,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Bounce Right--1":{frame:{x:20,y:38,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Bounce Right--2":{frame:{x:38,y:38,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Bounce Right--3":{frame:{x:56,y:38,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Blink Bounce Right--0":{frame:{x:2,y:56,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Blink Bounce Right--1":{frame:{x:20,y:56,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Blink Bounce Right--2":{frame:{x:38,y:56,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Blink Bounce Right--3":{frame:{x:56,y:56,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Blink Bounce Right--4":{frame:{x:74,y:56,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Bounce Left--0":{frame:{x:2,y:74,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Bounce Left--1":{frame:{x:20,y:74,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Bounce Left--2":{frame:{x:38,y:74,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Bounce Left--3":{frame:{x:56,y:74,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Bounce Left--4":{frame:{x:74,y:74,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Blink Bounce Left--0":{frame:{x:2,y:92,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Blink Bounce Left--1":{frame:{x:20,y:92,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Blink Bounce Left--2":{frame:{x:38,y:92,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Blink Bounce Left--3":{frame:{x:56,y:92,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Blink Bounce Left--4":{frame:{x:74,y:92,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Bounce Up--0":{frame:{x:2,y:110,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Bounce Up--1":{frame:{x:20,y:110,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Bounce Up--2":{frame:{x:38,y:110,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Bounce Up--3":{frame:{x:56,y:110,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Hair Move up--0":{frame:{x:2,y:128,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Hair Move up--1":{frame:{x:20,y:128,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Hair Move up--2":{frame:{x:38,y:128,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Hair Move up--3":{frame:{x:56,y:128,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Walk Down--0":{frame:{x:2,y:146,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Walk Down--1":{frame:{x:20,y:146,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Walk Down--2":{frame:{x:38,y:146,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Walk Down--3":{frame:{x:56,y:146,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Walk Down--4":{frame:{x:74,y:146,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Walk Right--0":{frame:{x:2,y:164,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Walk Right--1":{frame:{x:20,y:164,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Walk Right--2":{frame:{x:38,y:164,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Walk Right--3":{frame:{x:56,y:164,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Walk Right--4":{frame:{x:74,y:164,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Walk Right--5":{frame:{x:92,y:164,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Walk Right--6":{frame:{x:110,y:164,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Walk Right--7":{frame:{x:128,y:164,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Walk Left--0":{frame:{x:2,y:182,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Walk Left--1":{frame:{x:20,y:182,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Walk Left--2":{frame:{x:38,y:182,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Walk Left--3":{frame:{x:56,y:182,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Walk Left--4":{frame:{x:74,y:182,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Walk Left--5":{frame:{x:92,y:182,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Walk Left--6":{frame:{x:110,y:182,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Walk Left--7":{frame:{x:128,y:182,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Walk Left--8":{frame:{x:146,y:182,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Walk Up--0":{frame:{x:2,y:200,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Walk Up--1":{frame:{x:20,y:200,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Walk Up--2":{frame:{x:38,y:200,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Walk Up--3":{frame:{x:56,y:200,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Walk Up--4":{frame:{x:74,y:200,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Walk Up--5":{frame:{x:92,y:200,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Swing Down--0":{frame:{x:2,y:218,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Swing Down--1":{frame:{x:20,y:218,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Swing Down--2":{frame:{x:38,y:218,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Swing Right--0":{frame:{x:2,y:236,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Swing Right--1":{frame:{x:20,y:236,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Swing Right--2":{frame:{x:38,y:236,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Swing Left--0":{frame:{x:2,y:254,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Swing Left--1":{frame:{x:20,y:254,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Swing Left--2":{frame:{x:38,y:254,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Swing Up--0":{frame:{x:2,y:272,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Swing Up--1":{frame:{x:20,y:272,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Swing Up--2":{frame:{x:38,y:272,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100}},q={app:"https://www.aseprite.org/",version:"1.3-rc6-x64",image:"kuesuto-player.png",format:"RGBA8888",size:{w:164,h:290},scale:"1",frameTags:[{name:"Blink Bounce Down",from:0,to:4,direction:"forward",color:"#000000ff",data:"direction=down movement=false blink=true"},{name:"Bounce Down",from:5,to:8,direction:"forward",color:"#000000ff",data:"direction=down movement=false blink=false"},{name:"Bounce Right",from:9,to:12,direction:"forward",color:"#000000ff",data:"direction=right movement=false blink=false"},{name:"Blink Bounce Right",from:13,to:17,direction:"forward",color:"#000000ff",data:"direction=right movement=false blink=true"},{name:"Bounce Left",from:18,to:22,direction:"forward",color:"#000000ff",data:"direction=left movement=false blink=false"},{name:"Blink Bounce Left",from:23,to:27,direction:"forward",color:"#000000ff",data:"direction=left movement=false blink=true"},{name:"Bounce Up",from:28,to:31,direction:"forward",color:"#000000ff",data:"direction=up movement=false blink=false"},{name:"Hair Move up",from:32,to:35,direction:"forward",color:"#000000ff",data:"direction=up movement=false blink=true"},{name:"Walk Down",from:36,to:40,direction:"forward",color:"#000000ff",data:"direction=down movement=true blink=false"},{name:"Walk Right",from:41,to:48,direction:"forward",color:"#000000ff",data:"direction=right movement=true blink=false"},{name:"Walk Left",from:49,to:57,direction:"forward",color:"#000000ff",data:"direction=left movement=true blink=false"},{name:"Walk Up",from:58,to:63,direction:"forward",color:"#000000ff",data:"direction=up movement=true blink=false"},{name:"Swing Down",from:64,to:66,direction:"forward",color:"#000000ff",data:"direction=down movement=false blink=false attack=true"},{name:"Swing Right",from:67,to:69,direction:"forward",color:"#000000ff",data:"direction=right movement=false blink=false attack=true"},{name:"Swing Left",from:70,to:72,direction:"forward",color:"#000000ff",data:"direction=left movement=false blink=false attack=true"},{name:"Swing Up",from:73,to:75,direction:"forward",color:"#000000ff",data:"direction=up movement=false blink=false attack=true"}]},J={frames:K,meta:q},$={"Swing Up--0":{frame:{x:2,y:2,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Swing Up--1":{frame:{x:20,y:2,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Swing Up--2":{frame:{x:38,y:2,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Swing Right--0":{frame:{x:2,y:20,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Swing Right--1":{frame:{x:20,y:20,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Swing Right--2":{frame:{x:38,y:20,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Swing Down--0":{frame:{x:2,y:38,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Swing Down--1":{frame:{x:20,y:38,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Swing Down--2":{frame:{x:38,y:38,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Swing Left--0":{frame:{x:2,y:56,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Swing Left--1":{frame:{x:20,y:56,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Swing Left--2":{frame:{x:38,y:56,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100}},j={app:"https://www.aseprite.org/",version:"1.3-rc6-x64",image:"kuesuto-sword.png",format:"RGBA8888",size:{w:56,h:74},scale:"1",frameTags:[{name:"Swing Up",from:0,to:2,direction:"forward",color:"#000000ff",data:"direction=up attack=true"},{name:"Swing Right",from:3,to:5,direction:"forward",color:"#000000ff",data:"direction=right attack=true"},{name:"Swing Down",from:6,to:8,direction:"forward",color:"#000000ff",data:"direction=down attack=true"},{name:"Swing Left",from:9,to:11,direction:"forward",color:"#000000ff",data:"direction=left attack=true"}]},Q={frames:$,meta:j};let V=0;class b{constructor(t,e,i,a){l(this,"id",V++);l(this,"sprite");l(this,"parent");l(this,"setChild",t=>{this.children.push(t),t.setParent(this)});l(this,"setParent",t=>{this.parent=t});this.state=t,this.name=e,this.children=i,this.emitter=a,this.children.forEach(s=>{s.setParent(this)})}static getDirection(t){const e=t.yDir<0,i=t.yDir>0,a=t.xDir>0,s=t.xDir<0;return e?"up":i?"down":a?"right":s?"left":"down"}getDirection(){return b.getDirection(this.state)}update(t,e){var i;if((i=this.children)!=null&&i.length)for(let a=0;a<this.children.length;a++)this.children[a].update(t,e)}}class v extends b{constructor(t,e,i,a,s,o){super(t,e,i,a),this.state=t,this.name=e,this.children=i,this.emitter=a,this.sprite=new M(s,o,a)}}const z=class z extends v{constructor(e,i,a){super(e,z.NAME,i,a,J,"./kuesuto-player.png");l(this,"update",(e,i)=>{super.update(e,i);let a=!1,s=this.state.yDir,o=this.state.xDir,n=!1,f=!1;if(e.controls.up&&(s=-1,a=!0,f=!0),e.controls.down&&(s=1,a=!0,f=!0),e.controls.left&&(o=-1,a=!0,n=!0),e.controls.right&&(o=1,a=!0,n=!0),a){const d=Math.atan2(s,o);this.state.x+=Math.cos(d)*this.state.speedX*e.time.delta,this.state.y+=Math.sin(d)*this.state.speedY*e.time.delta}this.state.moving=a,n&&!f?s=0:f&&!n&&(o=0),this.state.yDir=s,this.state.xDir=o,this.state.attacking=e.controls.attack});this.state=e,this.children=i}};l(z,"NAME","player");let x=z;class Z extends v{constructor(t,e,i,a,s,o){super(t,e,i,a,s,o),this.state=t,this.name=e,this.children=i}}const g=class g extends Z{constructor(e,i,a){super(e,g.NAME,i,a,Q,"./kuesuto-sword.png");l(this,"attackListener",null);l(this,"update",(e,i)=>{if(super.update(e,i),this.parent)switch(this.state.xDir=this.parent.state.xDir,this.state.yDir=this.parent.state.yDir,this.parent.getDirection()){case"up":{this.state.x=this.parent.state.x,this.state.y=this.parent.state.y-w(e.elements.mainCanvas)*this.parent.state.scaleY;break}case"down":{this.state.x=this.parent.state.x,this.state.y=this.parent.state.y+w(e.elements.mainCanvas)*this.parent.state.scaleY;break}case"right":{this.state.x=this.parent.state.x+w(e.elements.mainCanvas)*this.parent.state.scaleX,this.state.y=this.parent.state.y;break}case"left":{this.state.x=this.parent.state.x-w(e.elements.mainCanvas)*this.parent.state.scaleX,this.state.y=this.parent.state.y;break}}if(!this.attackListener){const a=(s,o)=>{o.entity===this&&(e.controls.attack=!1,this.state.attacking=!1,this.state.visible=!1)};this.emitter.on(u.ANIMATION_END,a),this.attackListener=a}e.controls.attack&&!this.state.attacking&&(this.state.attacking=!0,this.state.visible=!0)});this.state=e,this.children=i,this.emitter=a}};l(g,"NAME","sword");let B=g;const ee=(r,t,e)=>{r.beginPath(),r.fillStyle=e,r.rect(0,0,t.width,t.height),r.fill(),r.closePath()},te=(r,t,e)=>{var n;if(!e.sprite)throw new Error("No sprite on entity");const i=e.state;let a;a=Object.entries((n=e.sprite)==null?void 0:n.spriteFrames).filter(Y(i,t));const[s,o]=a.find(([f,d])=>{var y;if(!f)throw new Error("Failed to load sprite sheet");let c=null;if(i.currentAnimationName===f&&i.animationToEnd&&i.animationFrameX===0&&(i.lastAnimationName=f,r.emitter.emit(u.ANIMATION_END,{entity:e,name:f}),i.animationToEnd=!1,c=!1),i.lastAnimationName===f&&a.length>1&&(c=!1),i.animationFrameX>=d.frames.length-1&&(i.animationToEnd=!0),c!==!1&&(c=!0),c){const k=r.time.lastFrameTimeMs-i.animationFrameXStart;i.animationFrameX>=d.frames.length&&(i.animationFrameX=0),k>((y=d.frames[i.animationFrameX])==null?void 0:y.duration)*U&&(i.animationFrameXStart=r.time.lastFrameTimeMs,i.animationFrameX++,i.animationFrameX>=d.frames.length&&(i.animationFrameX=0))}return c})||a[0];if(s==="")throw new Error("Sprite frame name not found");if(!o)throw new Error("Sprite frame value not found");return i.currentAnimationName=s,o.frames[i.animationFrameX]},T=(r,t,e,i)=>{if(!r.sprite||!r.state.visible)return;const a=r.state,s=r.getDirection(),o=te(i,s,r),n=o.spriteSourceSize.w,f=o.spriteSourceSize.h,d=o.frame.x,c=o.frame.y,y=a.x,k=a.y,F={canvasX:y,canvasY:k,canvasWidth:w(e)*a.scaleX,canvasHeight:w(e)*a.scaleY,spriteX:d,spriteY:c,spriteWidth:n,spriteHeight:f};i.emitter.emit(u.RENDER_SPRITE,{spriteData:F,entity:r});const S=r.sprite.spriteSheet;if(L(t,e,S,F),i.settings.debugPlayerSpriteSheet&&r.name===x.NAME){L(t,e,S,{canvasX:250,canvasY:250,canvasWidth:S.naturalWidth*4,canvasHeight:S.naturalHeight*4,spriteX:0,spriteY:0,spriteWidth:S.naturalWidth,spriteHeight:S.naturalHeight}),t.beginPath(),t.strokeStyle="teal";const C=t.lineWidth;t.lineWidth=5,t.rect(250+d*4,250+c*4,n*4,f*4),t.stroke(),t.lineWidth=C,t.closePath()}},re=(r,t,e)=>{var s,o;e.emitter.emit(u.RENDER_START,null),ee(r,t,"#fff"),e.map.render(r,t,e);const i=e.entities,a=i.length;for(let n=0;n<a;n++){T(i[n],r,t,e);for(let f=0;f<(((o=(s=i[n])==null?void 0:s.children)==null?void 0:o.length)||0);f++)T(i[n].children[f],r,t,e)}e.settings.debugGameState&&e.elements.gameStateContainer&&(e.elements.gameStateContainer.innerHTML=JSON.stringify({controls:e.controls,emitter:e.emitter,entities:e.entities.map(n=>({id:n.id,name:n.name,state:n.state})),settings:e.settings,time:e.time,world:e.world},null,2)),e.emitter.emit(u.RENDER_END,null)},ie=(r,t)=>{const e=r.entities,i=e.length;for(let a=0;a<i;a++)e[a].update(r,t)},ae=r=>{r.time.resetDeltaCount++,r.time.delta=0},se=(r,t,e)=>{if(!r)throw new Error("Missing canvas context");const i=a=>{if(a<e.time.lastFrameTimeMs+1e3/e.time.maxFPS){e.time.stepID=window.requestAnimationFrame(i);return}if(e.world.running){e.time.delta+=a-e.time.lastFrameTimeMs,e.time.lastFrameTimeMs=a,a>e.time.lastFpsUpdate+1e3&&(e.time.fps=.25*e.time.framesThisSecond+.75*e.time.fps,e.time.lastFpsUpdate=a,e.time.framesThisSecond=0,e.emitter.emit(u.FPS,{fps:e.time.fps})),e.time.framesThisSecond++;let s=0;for(;e.time.delta>=e.time.timeStep;)if(ie(e,a),e.time.delta-=e.time.timeStep,++s>=240){ae(e);break}}e.time.frameID++,re(r,t,e),e.time.stepID=window.requestAnimationFrame(i)};i(1)},oe={"Tall Grass":{frame:{x:2,y:2,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Tall Grass and Flowers":{frame:{x:2,y:20,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},Grass:{frame:{x:2,y:38,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Grass Path Left":{frame:{x:2,y:56,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100},"Gras Path Right":{frame:{x:2,y:74,w:16,h:16},rotated:!1,trimmed:!1,spriteSourceSize:{x:0,y:0,w:16,h:16},sourceSize:{w:16,h:16},duration:100}},ne={app:"https://www.aseprite.org/",version:"1.3-rc6-x64",image:"kuesuto-tiles.png",format:"RGBA8888",size:{w:20,h:92},scale:"1",frameTags:[],layers:[{name:"Tall Grass",opacity:255,blendMode:"normal"},{name:"Tall Grass and Flowers",opacity:255,blendMode:"normal"},{name:"Grass",opacity:255,blendMode:"normal"},{name:"Grass Path Left",opacity:255,blendMode:"normal"},{name:"Gras Path Right",opacity:255,blendMode:"normal"}]},N={frames:oe,meta:ne};class fe{constructor(t,e){l(this,"tiles");l(this,"render",(t,e,i)=>{const a=e.width,s=e.height,o=w(e),n=N.frames.Grass;for(let f=0;f<=a;f+=o*.9)for(let d=0;d<=s;d+=o*.9)L(t,e,this.tiles.spriteSheet,{spriteX:n.frame.x,spriteY:n.frame.y,spriteWidth:n.frame.w,spriteHeight:n.frame.h,canvasX:f,canvasY:d,canvasWidth:w(e)*this.state.scaleX,canvasHeight:w(e)*this.state.scaleY})});this.state=t,this.emitter=e,this.tiles=new M(N,"./kuesuto-tiles.png",e)}}let E,R,h;const le=()=>{const r=new D,t=document.querySelector("#main-game-canvas");if(!t)throw new Error("Main canvas not found");t.width=window.innerWidth,t.height=window.innerHeight;const e=t==null?void 0:t.getContext("2d");if(!e)throw new Error("Main canvas context not found");r.emit(u.INIT,{mainCanvas:t,mainCanvasContext:e});const i=document.querySelector("#game-state");if(!i)throw new Error("Game State Container not found");const a=document.querySelector("#main-game-fps");if(!a)throw new Error("Main Game Fps Container not found");const s={entities:[new x({x:0,y:0,xDir:0,yDir:0,speedX:A,speedY:W,scaleX:1,scaleY:1,visible:!0,moving:!1,attacking:!1,currentAnimationName:"",lastAnimationName:"",animationToEnd:!1,animationFrameX:0,animationFrameXStart:0},[new B({x:0,y:0,xDir:0,yDir:0,speedX:A,speedY:W,scaleX:1,scaleY:1,visible:!1,moving:!1,attacking:!1,currentAnimationName:"",lastAnimationName:"",animationToEnd:!1,animationFrameX:0,animationFrameXStart:0},[],r)],r)],map:new fe({scaleX:1,scaleY:1},r),controls:{up:!1,down:!1,left:!1,right:!1,attack:!1},world:{running:!1,started:!1},settings:{debugGameState:!1,debugPlayerSpriteSheet:!1,showFps:!0},time:{delta:0,fps:60,framesThisSecond:0,lastFpsUpdate:0,lastFrameTimeMs:0,maxFPS:60,timeStep:1e3/60,stepID:0,frameID:0,resetDeltaCount:0},elements:{mainCanvas:t,mainCanvasContext:e,gameStateContainer:i,mainGameFpsContainer:a},emitter:r};return r.on(u.FPS,(o,n)=>{console.log(n),s.settings.showFps&&(n!=null&&n.fps)&&(s.elements.mainGameFpsContainer.innerHTML=Math.round(n.fps).toString())}),e==null||e.rect(0,0,t.width,t.height),e==null||e.fill(),{mainCanvas:t,mainCanvasContext:e,gameState:s}};try{const r=le();E=r.mainCanvas,R=r.mainCanvasContext,h=r.gameState}catch(r){console.error("Failed to initialize"+r)}document.addEventListener("keydown",r=>{X(h)(r)});document.addEventListener("keyup",r=>{O(h)(r)});window.addEventListener("resize",()=>{h.elements.mainCanvas.width=window.innerWidth,h.elements.mainCanvas.height=window.innerHeight});document.addEventListener("visibilitychange",()=>{h.world.running=document.visibilityState==="visible",console.log({running:h.world.running})});const de=()=>{R&&E&&h&&(h.world.started=!0,h.world.running=!0,se(R,E,h))};de();