console.log("ah sali");

const heatshrink = require("./heatshrink");

var input = Buffer.from(
  "sEUBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADMAAAAAAAAAAAAAAAAAAAAAAAAAAABMgAAAAAAAAAAAAAAAAAAAAAAAAAAAgEAAAAAAAAAAAAAAAAAAAAAAAAAAAIBAAAAAAAAAAAAAAAAAAAAAAAAAAACAQAAAAAAAAAAAAAAAAAAAAAAAAAAAQIAAAAAAAAAAAAAAAAAAAAAAAAAAACEAAAAAAAAAAAAAAAAAAAAAAAAAAAASAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAAA///+AAAAAAAAAAAAAAAAAAAAAAAAAP///gAAAAAAAAAAAAAAAAAAAAAAAAf////AAAAAAAAAAAAAAAAAAAAAAAAH////wDYAAAAAAAAAAAAAAAAAAAAAB+f//8A2AAAAAAAAAAAAAAAAAAAAAAfn///AwYAAAAAAAAAAAAAAAAAAAAAH////wN2AAAAAAAAAAAAAAAAAAAAAB////8A+AAAAAAAAAAAAAAAAAAAAAAf////AfgAAAAAAAAAAAAAAAAAAAAAH////wH8AAAAAAAAAAAAAAAAAAAAAB////8B/AAAAAAAAAAAAD4AAAAAAAAf////APgAAAAAAAAAAAB/AAAAAAAAH////wAAAAAAAAAAAAAAfwAAAAAAAB////8AAAAAAAAAAAAAAH8AAAAAAAAf////AAAAAAAAAAAAAAB/AAAAAAAAH////wAAAAAAAAAAAAAAfwAAAAAAAB//wAAAAAAAAAAAAAAAAH8AAAAAAAAf/8AAAAAAAAAAAAAAAAB/AAAAAAAAH///wAAAAAAAAAAAAAAAfwAAAAAAAB///8AAAAAAAAAAAAAAAH8AAADgAAD////AAAAAAAAAAAAAAAB/DgAA4AAA//4AAAAAAAAAAAAAAAAAfx8AAOAAAP/+AAAAAAAAAAAAAAAAOH8fAADgAA///gAAAAAAAAAAAAAAAHx/HwAA4AAP//4AAAAAAAAAAAAAAAB8fx8AAOAAD//+AAAAAAAAAAAAAAAAfH8fAAD8AP////gAAAAAAAAAAAAAAHx/HwAA/AD////4AAAAAAAAAAAAAAB8fx8AAPwA////+AAAAAAAAAAAAAAAfH8fAAD/B/////gAAAAAAAAAAAAAAHx/HwAA/wf///54AAAAAAAAAAAAAAB8fx8AAP8H///+eAAAAAAAAAAAAAAAfH8fAAD//////ngAAAAAAAAAAAAAAHx/HwAA//////4AAAAAAAAAAAAAAAB8fx8AAP/////+AAAAAAAAAAAAAAAAfH8fAAD//////gAAAAAAAAAAAAAAAHx/HwAA//////4AAAAAAAAAAAAAAAB///4AAP/////+AAAAAAAAAAAAAAAAf//8AAA//////gAAAAAAAAAAAAAAAD//+AAAP/////4AAAAAAAAAAAAAAAAf//AAAD/////wAAAAAAAAAAAAAAAAD/8AAAAP////8AAAAAAAAAAAAAAAAAB/AAAAD/////AAAAAAAAAAAAAAAAAAfwAAAAP///+AAAAAAAAAAAAAAAAAAH8AAAAA////gAAAAAAAAAAAAAAAAAB/AAAAAH///4AAAAAAAAAAAAAAAAAAfwAAAAB///wAAAAAAAAAAAAAAAAAAH8AAAAAD/z8AAAAAAAAAAAAAAAAAAB/AAAAAA/8/AAAAAAAAAAAAAAAAAAAfwAAAAAP8DwAAAAAAAAPwAAPwAAAAH8AAAAAD/A8AAAAAAAAGEAAGEAAAAB/AAAAAA/wPAAAAAAAAHAwAHAwAAAAfwAAAAAPADwAAAAAAADADAGADAH/////////////////////gAf/AAfwAAB/AAAAAA8APAAAAAAAAAAAAAAAAPAAfwAAAAAP4D+AAAAAAAAAAAAAAAAAAH8BgAAAD+A/gAEAAAAAAAAAAAAAAAAAAAAAAA/gP4AAAAAAAAAACAAAAAAAABAHAAAAAAAAAAABGAAcAAAAAA",
  "base64"
);

console.log(input);

var compressed = heatshrink.compress(input);
var compressedBase64 = Buffer.from(compressed).toString("base64");

console.log(compressedBase64);