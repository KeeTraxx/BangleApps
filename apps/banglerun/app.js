!function(){"use strict";const t={STOP:63488,PAUSE:65504,RUN:2016};function n(t,n,e){g.setColor(0),g.fillRect(n-60,e,n+60,e+30),g.setColor(65535),g.drawString(t,n,e)}function e(e){var r;g.setFontVector(30),g.setFontAlign(0,-1,0),n((e.distance/1e3).toFixed(2),60,55),n(function(t){const n=Math.round(t),e=Math.floor(n/3600),r=Math.floor(n/60)%60,a=n%60;return(e?e+":":"")+("0"+r).substr(-2)+":"+("0"+a).substr(-2)}(e.duration),180,55),n(function(t){if(t<.1667)return"__'__\"";const n=Math.round(1e3/t),e=Math.floor(n/60),r=n%60;return("0"+e).substr(-2)+"'"+("0"+r).substr(-2)+'"'}(e.speed),60,115),n(e.hr.toFixed(0),180,115),n(e.steps.toFixed(0),60,175),n(e.cadence.toFixed(0),180,175),g.setFont("6x8",2),g.setColor(e.gpsValid?2016:63488),g.fillRect(0,216,80,240),g.setColor(0),g.drawString("GPS",40,220),g.setColor(65535),g.fillRect(80,216,160,240),g.setColor(0),g.drawString(("0"+(r=new Date).getHours()).substr(-2)+":"+("0"+r.getMinutes()).substr(-2),120,220),g.setColor(t[e.status]),g.fillRect(160,216,240,240),g.setColor(0),g.drawString(e.status,200,220)}function r(t){g.clear(),g.setColor(50712),g.setFont("6x8",2),g.setFontAlign(0,-1,0),g.drawString("DIST (KM)",60,32),g.drawString("TIME",180,32),g.drawString("PACE",60,92),g.drawString("HEART",180,92),g.drawString("STEPS",60,152),g.drawString("CADENCE",180,152),e(t),Bangle.drawWidgets()}var a;function s(t){t.status===a.Stopped&&function(t){const n=(new Date).toISOString().replace(/[-:]/g,""),e=`banglerun_${n.substr(2,6)}_${n.substr(9,6)}`;t.file=require("Storage").open(e,"w"),t.file.write(["timestamp","latitude","longitude","altitude","duration","distance","heartrate","steps"].join(",")+"\n")}(t),t.status===a.Running?t.status=a.Paused:t.status=a.Running,e(t)}!function(t){t.Stopped="STOP",t.Paused="PAUSE",t.Running="RUN"}(a||(a={}));const o={fix:NaN,lat:NaN,lon:NaN,alt:NaN,vel:NaN,dop:NaN,gpsValid:!1,x:NaN,y:NaN,z:NaN,v:NaN,t:NaN,dt:NaN,pError:NaN,vError:NaN,hr:60,hrError:100,file:null,drawing:!1,status:a.Stopped,duration:0,distance:0,speed:0,steps:0,cadence:0};var i;i=o,Bangle.on("GPS",t=>function(t,n){t.lat=n.lat,t.lon=n.lon,t.alt=n.alt,t.vel=n.speed/3.6,t.fix=n.fix,t.dop=n.hdop}(i,t)),Bangle.setGPSPower(1),function(t){Bangle.on("HRM",n=>function(t,n){if(0===n.confidence)return;const e=n.bpm-t.hr,r=Math.abs(e)+101-n.confidence,a=t.hrError/(t.hrError+r);t.hr+=e*a,t.hrError+=(r-t.hrError)*a}(t,n)),Bangle.setHRMPower(1)}(o),function(t){Bangle.on("step",()=>function(t){t.status===a.Running&&(t.steps+=1)}(t))}(o),function(t){Bangle.loadWidgets(),Bangle.on("lcdPower",n=>{t.drawing=n,n&&r(t)}),r(t)}(o),setWatch(()=>s(o),BTN1,{repeat:!0,edge:"falling"}),setWatch(()=>function(t){t.status===a.Paused&&function(t){t.duration=0,t.distance=0,t.speed=0,t.steps=0,t.cadence=0}(t),t.status===a.Running?t.status=a.Paused:t.status=a.Stopped,e(t)}(o),BTN3,{repeat:!0,edge:"falling"})}();
