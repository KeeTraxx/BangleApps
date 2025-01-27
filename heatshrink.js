/*
  Compiled to JS with Emscripten by Gordon Williams <gw@espruino.com>
  heatshrink_config.h matches that of Espruino.
  Source for conversion at http://github.com/gfwilliams/heatshrink-js
*/
(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    root.heatshrink = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  /*
Copyright (c) 2013-2015, Scott Vokes <vokes.s@gmail.com>
All rights reserved.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/

  var Module = typeof Module !== "undefined" ? Module : {};
  var moduleOverrides = {};
  var key;
  for (key in Module) {
    if (Module.hasOwnProperty(key)) {
      moduleOverrides[key] = Module[key];
    }
  }
  var arguments_ = [];
  var thisProgram = "./this.program";
  var quit_ = function (status, toThrow) {
    throw toThrow;
  };
  var ENVIRONMENT_IS_WEB = false;
  var ENVIRONMENT_IS_WORKER = false;
  var ENVIRONMENT_IS_NODE = false;
  var ENVIRONMENT_HAS_NODE = false;
  var ENVIRONMENT_IS_SHELL = false;
  ENVIRONMENT_IS_WEB = typeof window === "object";
  ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
  ENVIRONMENT_HAS_NODE =
    typeof process === "object" &&
    typeof process.versions === "object" &&
    typeof process.versions.node === "string";
  ENVIRONMENT_IS_NODE =
    ENVIRONMENT_HAS_NODE && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
  ENVIRONMENT_IS_SHELL =
    !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
  var scriptDirectory = "";
  function locateFile(path) {
    if (Module["locateFile"]) {
      return Module["locateFile"](path, scriptDirectory);
    }
    return scriptDirectory + path;
  }
  var read_, readAsync, readBinary, setWindowTitle;
  if (ENVIRONMENT_IS_NODE) {
    scriptDirectory = __dirname + "/";
    var nodeFS;
    var nodePath;
    read_ = function shell_read(filename, binary) {
      var ret;
      ret = tryParseAsDataURI(filename);
      if (!ret) {
        if (!nodeFS) nodeFS = require("fs");
        if (!nodePath) nodePath = require("path");
        filename = nodePath["normalize"](filename);
        ret = nodeFS["readFileSync"](filename);
      }
      return binary ? ret : ret.toString();
    };
    readBinary = function readBinary(filename) {
      var ret = read_(filename, true);
      if (!ret.buffer) {
        ret = new Uint8Array(ret);
      }
      assert(ret.buffer);
      return ret;
    };
    if (process["argv"].length > 1) {
      thisProgram = process["argv"][1].replace(/\\/g, "/");
    }
    arguments_ = process["argv"].slice(2);
    if (typeof module !== "undefined") {
      module["exports"] = Module;
    }
    process["on"]("uncaughtException", function (ex) {
      if (!(ex instanceof ExitStatus)) {
        throw ex;
      }
    });
    process["on"]("unhandledRejection", abort);
    quit_ = function (status) {
      process["exit"](status);
    };
    Module["inspect"] = function () {
      return "[Emscripten Module object]";
    };
  } else if (ENVIRONMENT_IS_SHELL) {
    if (typeof read != "undefined") {
      read_ = function shell_read(f) {
        var data = tryParseAsDataURI(f);
        if (data) {
          return intArrayToString(data);
        }
        return read(f);
      };
    }
    readBinary = function readBinary(f) {
      var data;
      data = tryParseAsDataURI(f);
      if (data) {
        return data;
      }
      if (typeof readbuffer === "function") {
        return new Uint8Array(readbuffer(f));
      }
      data = read(f, "binary");
      assert(typeof data === "object");
      return data;
    };
    if (typeof scriptArgs != "undefined") {
      arguments_ = scriptArgs;
    } else if (typeof arguments != "undefined") {
      arguments_ = arguments;
    }
    if (typeof quit === "function") {
      quit_ = function (status) {
        quit(status);
      };
    }
    if (typeof print !== "undefined") {
      if (typeof console === "undefined") console = {};
      console.log = print;
      console.warn = console.error =
        typeof printErr !== "undefined" ? printErr : print;
    }
  } else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    if (ENVIRONMENT_IS_WORKER) {
      scriptDirectory = self.location.href;
    } else if (document.currentScript) {
      scriptDirectory = document.currentScript.src;
    }
    if (scriptDirectory.indexOf("blob:") !== 0) {
      scriptDirectory = scriptDirectory.substr(
        0,
        scriptDirectory.lastIndexOf("/") + 1
      );
    } else {
      scriptDirectory = "";
    }
    read_ = function shell_read(url) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.send(null);
        return xhr.responseText;
      } catch (err) {
        var data = tryParseAsDataURI(url);
        if (data) {
          return intArrayToString(data);
        }
        throw err;
      }
    };
    if (ENVIRONMENT_IS_WORKER) {
      readBinary = function readBinary(url) {
        try {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", url, false);
          xhr.responseType = "arraybuffer";
          xhr.send(null);
          return new Uint8Array(xhr.response);
        } catch (err) {
          var data = tryParseAsDataURI(url);
          if (data) {
            return data;
          }
          throw err;
        }
      };
    }
    readAsync = function readAsync(url, onload, onerror) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.responseType = "arraybuffer";
      xhr.onload = function xhr_onload() {
        if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
          onload(xhr.response);
          return;
        }
        var data = tryParseAsDataURI(url);
        if (data) {
          onload(data.buffer);
          return;
        }
        onerror();
      };
      xhr.onerror = onerror;
      xhr.send(null);
    };
    setWindowTitle = function (title) {
      document.title = title;
    };
  } else {
  }
  var out = Module["print"] || console.log.bind(console);
  var err = Module["printErr"] || console.warn.bind(console);
  for (key in moduleOverrides) {
    if (moduleOverrides.hasOwnProperty(key)) {
      Module[key] = moduleOverrides[key];
    }
  }
  moduleOverrides = null;
  if (Module["arguments"]) arguments_ = Module["arguments"];
  if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
  if (Module["quit"]) quit_ = Module["quit"];
  var STACK_ALIGN = 16;
  function dynamicAlloc(size) {
    var ret = HEAP32[DYNAMICTOP_PTR >> 2];
    var end = (ret + size + 15) & -16;
    if (end > _emscripten_get_heap_size()) {
      abort();
    }
    HEAP32[DYNAMICTOP_PTR >> 2] = end;
    return ret;
  }
  function getNativeTypeSize(type) {
    switch (type) {
      case "i1":
      case "i8":
        return 1;
      case "i16":
        return 2;
      case "i32":
        return 4;
      case "i64":
        return 8;
      case "float":
        return 4;
      case "double":
        return 8;
      default: {
        if (type[type.length - 1] === "*") {
          return 4;
        } else if (type[0] === "i") {
          var bits = parseInt(type.substr(1));
          assert(
            bits % 8 === 0,
            "getNativeTypeSize invalid bits " + bits + ", type " + type
          );
          return bits / 8;
        } else {
          return 0;
        }
      }
    }
  }
  function warnOnce(text) {
    if (!warnOnce.shown) warnOnce.shown = {};
    if (!warnOnce.shown[text]) {
      warnOnce.shown[text] = 1;
      err(text);
    }
  }
  var jsCallStartIndex = 1;
  var functionPointers = new Array(0);
  var funcWrappers = {};
  function dynCall(sig, ptr, args) {
    if (args && args.length) {
      return Module["dynCall_" + sig].apply(null, [ptr].concat(args));
    } else {
      return Module["dynCall_" + sig].call(null, ptr);
    }
  }
  var tempRet0 = 0;
  var setTempRet0 = function (value) {
    tempRet0 = value;
  };
  var getTempRet0 = function () {
    return tempRet0;
  };
  var GLOBAL_BASE = 8;
  var wasmBinary;
  if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
  var noExitRuntime;
  if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];
  function setValue(ptr, value, type, noSafe) {
    type = type || "i8";
    if (type.charAt(type.length - 1) === "*") type = "i32";
    switch (type) {
      case "i1":
        HEAP8[ptr >> 0] = value;
        break;
      case "i8":
        HEAP8[ptr >> 0] = value;
        break;
      case "i16":
        HEAP16[ptr >> 1] = value;
        break;
      case "i32":
        HEAP32[ptr >> 2] = value;
        break;
      case "i64":
        (tempI64 = [
          value >>> 0,
          ((tempDouble = value),
          +Math_abs(tempDouble) >= +1
            ? tempDouble > +0
              ? (Math_min(+Math_floor(tempDouble / +4294967296), +4294967295) |
                  0) >>>
                0
              : ~~+Math_ceil(
                  (tempDouble - +(~~tempDouble >>> 0)) / +4294967296
                ) >>> 0
            : 0),
        ]),
          (HEAP32[ptr >> 2] = tempI64[0]),
          (HEAP32[(ptr + 4) >> 2] = tempI64[1]);
        break;
      case "float":
        HEAPF32[ptr >> 2] = value;
        break;
      case "double":
        HEAPF64[ptr >> 3] = value;
        break;
      default:
        abort("invalid type for setValue: " + type);
    }
  }
  var ABORT = false;
  var EXITSTATUS = 0;
  function assert(condition, text) {
    if (!condition) {
      abort("Assertion failed: " + text);
    }
  }
  function getCFunc(ident) {
    var func = Module["_" + ident];
    assert(
      func,
      "Cannot call unknown function " + ident + ", make sure it is exported"
    );
    return func;
  }
  function ccall(ident, returnType, argTypes, args, opts) {
    var toC = {
      string: function (str) {
        var ret = 0;
        if (str !== null && str !== undefined && str !== 0) {
          var len = (str.length << 2) + 1;
          ret = stackAlloc(len);
          stringToUTF8(str, ret, len);
        }
        return ret;
      },
      array: function (arr) {
        var ret = stackAlloc(arr.length);
        writeArrayToMemory(arr, ret);
        return ret;
      },
    };
    function convertReturnValue(ret) {
      if (returnType === "string") return UTF8ToString(ret);
      if (returnType === "boolean") return Boolean(ret);
      return ret;
    }
    var func = getCFunc(ident);
    var cArgs = [];
    var stack = 0;
    if (args) {
      for (var i = 0; i < args.length; i++) {
        var converter = toC[argTypes[i]];
        if (converter) {
          if (stack === 0) stack = stackSave();
          cArgs[i] = converter(args[i]);
        } else {
          cArgs[i] = args[i];
        }
      }
    }
    var ret = func.apply(null, cArgs);
    ret = convertReturnValue(ret);
    if (stack !== 0) stackRestore(stack);
    return ret;
  }
  var ALLOC_NONE = 3;
  var UTF8Decoder =
    typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;
  function UTF8ArrayToString(u8Array, idx, maxBytesToRead) {
    var endIdx = idx + maxBytesToRead;
    var endPtr = idx;
    while (u8Array[endPtr] && !(endPtr >= endIdx)) ++endPtr;
    if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
      return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
    } else {
      var str = "";
      while (idx < endPtr) {
        var u0 = u8Array[idx++];
        if (!(u0 & 128)) {
          str += String.fromCharCode(u0);
          continue;
        }
        var u1 = u8Array[idx++] & 63;
        if ((u0 & 224) == 192) {
          str += String.fromCharCode(((u0 & 31) << 6) | u1);
          continue;
        }
        var u2 = u8Array[idx++] & 63;
        if ((u0 & 240) == 224) {
          u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
        } else {
          u0 =
            ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (u8Array[idx++] & 63);
        }
        if (u0 < 65536) {
          str += String.fromCharCode(u0);
        } else {
          var ch = u0 - 65536;
          str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
        }
      }
    }
    return str;
  }
  function UTF8ToString(ptr, maxBytesToRead) {
    return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
  }
  function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
    if (!(maxBytesToWrite > 0)) return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1;
    for (var i = 0; i < str.length; ++i) {
      var u = str.charCodeAt(i);
      if (u >= 55296 && u <= 57343) {
        var u1 = str.charCodeAt(++i);
        u = (65536 + ((u & 1023) << 10)) | (u1 & 1023);
      }
      if (u <= 127) {
        if (outIdx >= endIdx) break;
        outU8Array[outIdx++] = u;
      } else if (u <= 2047) {
        if (outIdx + 1 >= endIdx) break;
        outU8Array[outIdx++] = 192 | (u >> 6);
        outU8Array[outIdx++] = 128 | (u & 63);
      } else if (u <= 65535) {
        if (outIdx + 2 >= endIdx) break;
        outU8Array[outIdx++] = 224 | (u >> 12);
        outU8Array[outIdx++] = 128 | ((u >> 6) & 63);
        outU8Array[outIdx++] = 128 | (u & 63);
      } else {
        if (outIdx + 3 >= endIdx) break;
        outU8Array[outIdx++] = 240 | (u >> 18);
        outU8Array[outIdx++] = 128 | ((u >> 12) & 63);
        outU8Array[outIdx++] = 128 | ((u >> 6) & 63);
        outU8Array[outIdx++] = 128 | (u & 63);
      }
    }
    outU8Array[outIdx] = 0;
    return outIdx - startIdx;
  }
  function stringToUTF8(str, outPtr, maxBytesToWrite) {
    return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
  }
  function lengthBytesUTF8(str) {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
      var u = str.charCodeAt(i);
      if (u >= 55296 && u <= 57343)
        u = (65536 + ((u & 1023) << 10)) | (str.charCodeAt(++i) & 1023);
      if (u <= 127) ++len;
      else if (u <= 2047) len += 2;
      else if (u <= 65535) len += 3;
      else len += 4;
    }
    return len;
  }
  var UTF16Decoder =
    typeof TextDecoder !== "undefined"
      ? new TextDecoder("utf-16le")
      : undefined;
  function writeArrayToMemory(array, buffer) {
    HEAP8.set(array, buffer);
  }
  function writeAsciiToMemory(str, buffer, dontAddNull) {
    for (var i = 0; i < str.length; ++i) {
      HEAP8[buffer++ >> 0] = str.charCodeAt(i);
    }
    if (!dontAddNull) HEAP8[buffer >> 0] = 0;
  }
  var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
  function updateGlobalBufferAndViews(buf) {
    buffer = buf;
    Module["HEAP8"] = HEAP8 = new Int8Array(buf);
    Module["HEAP16"] = HEAP16 = new Int16Array(buf);
    Module["HEAP32"] = HEAP32 = new Int32Array(buf);
    Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
    Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
    Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
    Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
    Module["HEAPF64"] = HEAPF64 = new Float64Array(buf);
  }
  var STACK_BASE = 2928,
    DYNAMIC_BASE = 5245808,
    DYNAMICTOP_PTR = 2896;
  var INITIAL_TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 16777216;
  if (Module["buffer"]) {
    buffer = Module["buffer"];
  } else {
    buffer = new ArrayBuffer(INITIAL_TOTAL_MEMORY);
  }
  INITIAL_TOTAL_MEMORY = buffer.byteLength;
  updateGlobalBufferAndViews(buffer);
  HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;
  function callRuntimeCallbacks(callbacks) {
    while (callbacks.length > 0) {
      var callback = callbacks.shift();
      if (typeof callback == "function") {
        callback();
        continue;
      }
      var func = callback.func;
      if (typeof func === "number") {
        if (callback.arg === undefined) {
          Module["dynCall_v"](func);
        } else {
          Module["dynCall_vi"](func, callback.arg);
        }
      } else {
        func(callback.arg === undefined ? null : callback.arg);
      }
    }
  }
  var __ATPRERUN__ = [];
  var __ATINIT__ = [];
  var __ATMAIN__ = [];
  var __ATPOSTRUN__ = [];
  var runtimeInitialized = false;
  var runtimeExited = false;
  function preRun() {
    if (Module["preRun"]) {
      if (typeof Module["preRun"] == "function")
        Module["preRun"] = [Module["preRun"]];
      while (Module["preRun"].length) {
        addOnPreRun(Module["preRun"].shift());
      }
    }
    callRuntimeCallbacks(__ATPRERUN__);
  }
  function initRuntime() {
    runtimeInitialized = true;
    callRuntimeCallbacks(__ATINIT__);
  }
  function preMain() {
    callRuntimeCallbacks(__ATMAIN__);
  }
  function exitRuntime() {
    runtimeExited = true;
  }
  function postRun() {
    if (Module["postRun"]) {
      if (typeof Module["postRun"] == "function")
        Module["postRun"] = [Module["postRun"]];
      while (Module["postRun"].length) {
        addOnPostRun(Module["postRun"].shift());
      }
    }
    callRuntimeCallbacks(__ATPOSTRUN__);
  }
  function addOnPreRun(cb) {
    __ATPRERUN__.unshift(cb);
  }
  function addOnPostRun(cb) {
    __ATPOSTRUN__.unshift(cb);
  }
  var Math_abs = Math.abs;
  var Math_ceil = Math.ceil;
  var Math_floor = Math.floor;
  var Math_min = Math.min;
  var runDependencies = 0;
  var runDependencyWatcher = null;
  var dependenciesFulfilled = null;
  function addRunDependency(id) {
    runDependencies++;
    if (Module["monitorRunDependencies"]) {
      Module["monitorRunDependencies"](runDependencies);
    }
  }
  function removeRunDependency(id) {
    runDependencies--;
    if (Module["monitorRunDependencies"]) {
      Module["monitorRunDependencies"](runDependencies);
    }
    if (runDependencies == 0) {
      if (runDependencyWatcher !== null) {
        clearInterval(runDependencyWatcher);
        runDependencyWatcher = null;
      }
      if (dependenciesFulfilled) {
        var callback = dependenciesFulfilled;
        dependenciesFulfilled = null;
        callback();
      }
    }
  }
  Module["preloadedImages"] = {};
  Module["preloadedAudios"] = {};
  var memoryInitializer = null;
  var dataURIPrefix = "data:application/octet-stream;base64,";
  function isDataURI(filename) {
    return String.prototype.startsWith
      ? filename.startsWith(dataURIPrefix)
      : filename.indexOf(dataURIPrefix) === 0;
  }
  var tempDouble;
  var tempI64;
  memoryInitializer =
    "data:application/octet-stream;base64,AAAAAAAAAAARAAoAERERAAAAAAUAAAAAAAAJAAAAAAsAAAAAAAAAABEADwoREREDCgcAARMJCwsAAAkGCwAACwAGEQAAABEREQAAAAAAAAAAAAAAAAAAAAALAAAAAAAAAAARAAoKERERAAoAAAIACQsAAAAJAAsAAAsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAADAAAAAAMAAAAAAkMAAAAAAAMAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAA0AAAAEDQAAAAAJDgAAAAAADgAADgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAPAAAAAA8AAAAACRAAAAAAABAAABAAABIAAAASEhIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEgAAABISEgAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAsAAAAAAAAAAAAAAAoAAAAACgAAAAAJCwAAAAAACwAACwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAMAAAAAAwAAAAACQwAAAAAAAwAAAwAADAxMjM0NTY3ODlBQkNERUYFAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAEgEAAAABAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAK/////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB8CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAApeXiBDT01QUkVTU0lORyAlZCBieXRlcwoAQXNzZXJ0IGF0IGhlYXRzaHJpbmtfd3JhcHBlci5jOiVkCgBeXiBzdW5rICV6ZAoAXl4gcG9sbGVkICV6ZAoAaW46ICV1IGNvbXByZXNzZWQ6ICV1CgAKXl4gREVDT01QUkVTU0lORyAlZCBieXRlcwoALSsgICAwWDB4AChudWxsKQAtMFgrMFggMFgtMHgrMHggMHgAaW5mAElORgBuYW4ATkFOAC4=";
  var tempDoublePtr = 2912;
  function demangle(func) {
    return func;
  }
  function demangleAll(text) {
    var regex = /\b__Z[\w\d_]+/g;
    return text.replace(regex, function (x) {
      var y = demangle(x);
      return x === y ? x : y + " [" + x + "]";
    });
  }
  function jsStackTrace() {
    var err = new Error();
    if (!err.stack) {
      try {
        throw new Error(0);
      } catch (e) {
        err = e;
      }
      if (!err.stack) {
        return "(no stack trace available)";
      }
    }
    return err.stack.toString();
  }
  function stackTrace() {
    var js = jsStackTrace();
    if (Module["extraStackTrace"]) js += "\n" + Module["extraStackTrace"]();
    return demangleAll(js);
  }
  function flush_NO_FILESYSTEM() {
    var fflush = Module["_fflush"];
    if (fflush) fflush(0);
    var buffers = SYSCALLS.buffers;
    if (buffers[1].length) SYSCALLS.printChar(1, 10);
    if (buffers[2].length) SYSCALLS.printChar(2, 10);
  }
  var PATH = {
    splitPath: function (filename) {
      var splitPathRe =
        /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
      return splitPathRe.exec(filename).slice(1);
    },
    normalizeArray: function (parts, allowAboveRoot) {
      var up = 0;
      for (var i = parts.length - 1; i >= 0; i--) {
        var last = parts[i];
        if (last === ".") {
          parts.splice(i, 1);
        } else if (last === "..") {
          parts.splice(i, 1);
          up++;
        } else if (up) {
          parts.splice(i, 1);
          up--;
        }
      }
      if (allowAboveRoot) {
        for (; up; up--) {
          parts.unshift("..");
        }
      }
      return parts;
    },
    normalize: function (path) {
      var isAbsolute = path.charAt(0) === "/",
        trailingSlash = path.substr(-1) === "/";
      path = PATH.normalizeArray(
        path.split("/").filter(function (p) {
          return !!p;
        }),
        !isAbsolute
      ).join("/");
      if (!path && !isAbsolute) {
        path = ".";
      }
      if (path && trailingSlash) {
        path += "/";
      }
      return (isAbsolute ? "/" : "") + path;
    },
    dirname: function (path) {
      var result = PATH.splitPath(path),
        root = result[0],
        dir = result[1];
      if (!root && !dir) {
        return ".";
      }
      if (dir) {
        dir = dir.substr(0, dir.length - 1);
      }
      return root + dir;
    },
    basename: function (path) {
      if (path === "/") return "/";
      var lastSlash = path.lastIndexOf("/");
      if (lastSlash === -1) return path;
      return path.substr(lastSlash + 1);
    },
    extname: function (path) {
      return PATH.splitPath(path)[3];
    },
    join: function () {
      var paths = Array.prototype.slice.call(arguments, 0);
      return PATH.normalize(paths.join("/"));
    },
    join2: function (l, r) {
      return PATH.normalize(l + "/" + r);
    },
  };
  var SYSCALLS = {
    buffers: [null, [], []],
    printChar: function (stream, curr) {
      var buffer = SYSCALLS.buffers[stream];
      if (curr === 0 || curr === 10) {
        (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
        buffer.length = 0;
      } else {
        buffer.push(curr);
      }
    },
    varargs: 0,
    get: function (varargs) {
      SYSCALLS.varargs += 4;
      var ret = HEAP32[(SYSCALLS.varargs - 4) >> 2];
      return ret;
    },
    getStr: function () {
      var ret = UTF8ToString(SYSCALLS.get());
      return ret;
    },
    get64: function () {
      var low = SYSCALLS.get(),
        high = SYSCALLS.get();
      return low;
    },
    getZero: function () {
      SYSCALLS.get();
    },
  };
  function _fd_write(stream, iov, iovcnt, pnum) {
    try {
      var num = 0;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAP32[(iov + i * 8) >> 2];
        var len = HEAP32[(iov + (i * 8 + 4)) >> 2];
        for (var j = 0; j < len; j++) {
          SYSCALLS.printChar(stream, HEAPU8[ptr + j]);
        }
        num += len;
      }
      HEAP32[pnum >> 2] = num;
      return 0;
    } catch (e) {
      if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
      return -e.errno;
    }
  }
  function ___wasi_fd_write() {
    return _fd_write.apply(null, arguments);
  }
  function _emscripten_get_heap_size() {
    return HEAP8.length;
  }
  function _emscripten_memcpy_big(dest, src, num) {
    HEAPU8.set(HEAPU8.subarray(src, src + num), dest);
  }
  function ___setErrNo(value) {
    if (Module["___errno_location"])
      HEAP32[Module["___errno_location"]() >> 2] = value;
    return value;
  }
  function abortOnCannotGrowMemory(requestedSize) {
    abort("OOM");
  }
  function _emscripten_resize_heap(requestedSize) {
    abortOnCannotGrowMemory(requestedSize);
  }
  var ASSERTIONS = false;
  function intArrayToString(array) {
    var ret = [];
    for (var i = 0; i < array.length; i++) {
      var chr = array[i];
      if (chr > 255) {
        if (ASSERTIONS) {
          assert(
            false,
            "Character code " +
              chr +
              " (" +
              String.fromCharCode(chr) +
              ")  at offset " +
              i +
              " not in 0x00-0xFF."
          );
        }
        chr &= 255;
      }
      ret.push(String.fromCharCode(chr));
    }
    return ret.join("");
  }
  var decodeBase64 =
    typeof atob === "function"
      ? atob
      : function (input) {
          var keyStr =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
          var output = "";
          var chr1, chr2, chr3;
          var enc1, enc2, enc3, enc4;
          var i = 0;
          input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
          do {
            enc1 = keyStr.indexOf(input.charAt(i++));
            enc2 = keyStr.indexOf(input.charAt(i++));
            enc3 = keyStr.indexOf(input.charAt(i++));
            enc4 = keyStr.indexOf(input.charAt(i++));
            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;
            output = output + String.fromCharCode(chr1);
            if (enc3 !== 64) {
              output = output + String.fromCharCode(chr2);
            }
            if (enc4 !== 64) {
              output = output + String.fromCharCode(chr3);
            }
          } while (i < input.length);
          return output;
        };
  function intArrayFromBase64(s) {
    if (typeof ENVIRONMENT_IS_NODE === "boolean" && ENVIRONMENT_IS_NODE) {
      var buf;
      try {
        buf = Buffer.from(s, "base64");
      } catch (_) {
        buf = new Buffer(s, "base64");
      }
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    try {
      var decoded = decodeBase64(s);
      var bytes = new Uint8Array(decoded.length);
      for (var i = 0; i < decoded.length; ++i) {
        bytes[i] = decoded.charCodeAt(i);
      }
      return bytes;
    } catch (_) {
      throw new Error("Converting base64 string to bytes failed.");
    }
  }
  function tryParseAsDataURI(filename) {
    if (!isDataURI(filename)) {
      return;
    }
    return intArrayFromBase64(filename.slice(dataURIPrefix.length));
  }
  var asmGlobalArg = {
    Math: Math,
    Int8Array: Int8Array,
    Int16Array: Int16Array,
    Int32Array: Int32Array,
    Uint8Array: Uint8Array,
    Uint16Array: Uint16Array,
    Float32Array: Float32Array,
    Float64Array: Float64Array,
  };
  var asmLibraryArg = {
    a: abort,
    b: setTempRet0,
    c: getTempRet0,
    d: ___setErrNo,
    e: ___wasi_fd_write,
    f: _emscripten_get_heap_size,
    g: _emscripten_memcpy_big,
    h: _emscripten_resize_heap,
    i: _fd_write,
    j: abortOnCannotGrowMemory,
    k: demangle,
    l: demangleAll,
    m: flush_NO_FILESYSTEM,
    n: jsStackTrace,
    o: stackTrace,
    p: tempDoublePtr,
    q: DYNAMICTOP_PTR,
  }; // EMSCRIPTEN_START_ASM
  var asm = /** @suppress {uselessCode} */ (function (global, env, buffer) {
    "use asm";
    var a = new global.Int8Array(buffer),
      b = new global.Int16Array(buffer),
      c = new global.Int32Array(buffer),
      d = new global.Uint8Array(buffer),
      e = new global.Uint16Array(buffer),
      f = new global.Float32Array(buffer),
      g = new global.Float64Array(buffer),
      h = env.p | 0,
      i = env.q | 0,
      j = 0,
      k = 0,
      l = 0,
      m = 0,
      n = 0,
      o = 0,
      p = 0,
      q = 0.0,
      r = global.Math.imul,
      s = global.Math.clz32,
      t = env.a,
      u = env.b,
      v = env.c,
      w = env.d,
      x = env.e,
      y = env.f,
      z = env.g,
      A = env.h,
      B = env.i,
      C = env.j,
      D = env.k,
      E = env.l,
      F = env.m,
      G = env.n,
      H = env.o,
      I = 2928,
      J = 5245808,
      K = 0.0;
    // EMSCRIPTEN_START_FUNCS
    function Q(a) {
      a = a | 0;
      var b = 0;
      b = I;
      I = (I + a) | 0;
      I = (I + 15) & -16;
      return b | 0;
    }
    function R() {
      return I | 0;
    }
    function S(a) {
      a = a | 0;
      I = a;
    }
    function T(a, b) {
      a = a | 0;
      b = b | 0;
      I = a;
      J = b;
    }
    function U(a, b, d, e, f) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      var g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0,
        t = 0,
        u = 0,
        v = 0,
        w = 0,
        x = 0,
        y = 0;
      y = I;
      I = (I + 672) | 0;
      w = (y + 128) | 0;
      v = (y + 120) | 0;
      u = (y + 112) | 0;
      q = (y + 104) | 0;
      t = (y + 96) | 0;
      x = (y + 88) | 0;
      r = (y + 80) | 0;
      s = (y + 72) | 0;
      g = (y + 64) | 0;
      p = (y + 144) | 0;
      o = (y + 136) | 0;
      m = y;
      W(p);
      c[o >> 2] = 0;
      n = (f | 0) > 1;
      if (n) {
        c[g >> 2] = b;
        ab(888, g) | 0;
      }
      l = (d | 0) == 0;
      g = 0;
      h = 0;
      a: while (1) {
        if (h >>> 0 >= b >>> 0) {
          h = 26;
          break;
        }
        if ((X(p, (a + h) | 0, (b - h) | 0, o) | 0) <= -1) {
          h = 6;
          break;
        }
        i = c[o >> 2] | 0;
        h = (i + h) | 0;
        if (n) {
          c[r >> 2] = i;
          ab(949, r) | 0;
        }
        k = (h | 0) == (b | 0);
        if (k ? (ma(p) | 0) != 1 : 0) {
          h = 12;
          break;
        }
        b: while (1) {
          if (l) j = Z(p, m, 64, o) | 0;
          else j = Z(p, (d + g) | 0, (e - g) | 0, o) | 0;
          if ((j | 0) <= -1) {
            h = 17;
            break a;
          }
          i = c[o >> 2] | 0;
          g = (i + g) | 0;
          if (n) {
            c[q >> 2] = i;
            ab(962, q) | 0;
          }
          switch (j | 0) {
            case 1:
              break;
            case 0:
              break b;
            default: {
              h = 21;
              break a;
            }
          }
        }
        if (k ? ma(p) | 0 : 0) {
          h = 25;
          break;
        }
      }
      if ((h | 0) == 6) {
        c[s >> 2] = 21;
        ab(914, s) | 0;
        g = 0;
      } else if ((h | 0) == 12) {
        c[x >> 2] = 25;
        ab(914, x) | 0;
        g = 0;
      } else if ((h | 0) == 17) {
        c[t >> 2] = 36;
        ab(914, t) | 0;
        g = 0;
      } else if ((h | 0) == 21) {
        c[u >> 2] = 40;
        ab(914, u) | 0;
        g = 0;
      } else if ((h | 0) == 25) {
        c[v >> 2] = 42;
        ab(914, v) | 0;
        g = 0;
      } else if ((h | 0) == 26)
        if ((f | 0) > 0) {
          c[w >> 2] = b;
          c[(w + 4) >> 2] = g;
          ab(977, w) | 0;
        }
      I = y;
      return g | 0;
    }
    function V(a, b, d, e, f) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      var g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0,
        t = 0,
        u = 0,
        v = 0,
        w = 0,
        x = 0,
        y = 0;
      y = I;
      I = (I + 448) | 0;
      w = (y + 128) | 0;
      v = (y + 120) | 0;
      u = (y + 112) | 0;
      q = (y + 104) | 0;
      t = (y + 96) | 0;
      x = (y + 88) | 0;
      r = (y + 80) | 0;
      s = (y + 72) | 0;
      g = (y + 64) | 0;
      p = (y + 140) | 0;
      o = (y + 136) | 0;
      m = y;
      na(p);
      c[o >> 2] = 0;
      n = (f | 0) > 1;
      if (n) {
        c[g >> 2] = b;
        ab(1e3, g) | 0;
      }
      l = (d | 0) == 0;
      g = 0;
      h = 0;
      a: while (1) {
        if (h >>> 0 >= b >>> 0) {
          h = 27;
          break;
        }
        if ((oa(p, (a + h) | 0, (b - h) | 0, o) | 0) <= -1) {
          h = 6;
          break;
        }
        i = c[o >> 2] | 0;
        h = (i + h) | 0;
        if (n) {
          c[r >> 2] = i;
          ab(949, r) | 0;
        }
        k = (h | 0) == (b | 0);
        if (k ? (za(p) | 0) != 1 : 0) {
          h = 12;
          break;
        }
        do {
          if (l) j = pa(p, m, 64, o) | 0;
          else j = pa(p, (d + g) | 0, (e - g) | 0, o) | 0;
          if ((j | 0) <= -1) {
            h = 17;
            break a;
          }
          i = c[o >> 2] | 0;
          g = (i + g) | 0;
          if (n) {
            c[q >> 2] = i;
            ab(962, q) | 0;
            i = c[o >> 2] | 0;
          }
        } while (((j | 0) == 1) & ((i | 0) != 0));
        if (j | 0) {
          h = 22;
          break;
        }
        if (k ? za(p) | 0 : 0) {
          h = 26;
          break;
        }
      }
      if ((h | 0) == 6) {
        c[s >> 2] = 63;
        ab(914, s) | 0;
        g = 0;
      } else if ((h | 0) == 12) {
        c[x >> 2] = 67;
        ab(914, x) | 0;
        g = 0;
      } else if ((h | 0) == 17) {
        c[t >> 2] = 78;
        ab(914, t) | 0;
        g = 0;
      } else if ((h | 0) == 22) {
        c[u >> 2] = 82;
        ab(914, u) | 0;
        g = 0;
      } else if ((h | 0) == 26) {
        c[v >> 2] = 84;
        ab(914, v) | 0;
        g = 0;
      } else if ((h | 0) == 27)
        if ((f | 0) > 0) {
          c[w >> 2] = b;
          c[(w + 4) >> 2] = g;
          ab(977, w) | 0;
        }
      I = y;
      return g | 0;
    }
    function W(c) {
      c = c | 0;
      ob((c + 15) | 0, 0, 512) | 0;
      b[c >> 1] = 0;
      a[(c + 12) >> 0] = 0;
      b[(c + 2) >> 1] = 0;
      a[(c + 11) >> 0] = 0;
      a[(c + 14) >> 0] = -128;
      a[(c + 13) >> 0] = 0;
      b[(c + 4) >> 1] = 0;
      b[(c + 8) >> 1] = 0;
      a[(c + 10) >> 0] = 0;
      return;
    }
    function X(d, e, f, g) {
      d = d | 0;
      e = e | 0;
      f = f | 0;
      g = g | 0;
      var h = 0,
        i = 0,
        j = 0,
        k = 0;
      if (!(((d | 0) == 0) | ((e | 0) == 0) | ((g | 0) == 0)))
        if ((Y(d) | 0) == 0 ? ((h = (d + 12) | 0), (a[h >> 0] | 0) == 0) : 0) {
          j = b[d >> 1] | 0;
          i = (256 - j) & 65535;
          k = i >>> 0 < f >>> 0 ? i : f;
          mb((((j + 256) & 65535) + (d + 15)) | 0, e | 0, k | 0) | 0;
          c[g >> 2] = k;
          b[d >> 1] = k + (j & 65535);
          if (i >>> 0 > f >>> 0) d = 0;
          else {
            a[h >> 0] = 1;
            d = 0;
          }
        } else d = -2;
      else d = -1;
      return d | 0;
    }
    function Y(b) {
      b = b | 0;
      return (a[(b + 11) >> 0] & 1) | 0;
    }
    function Z(b, d, e, f) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      var g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0;
      k = I;
      I = (I + 16) | 0;
      i = k;
      if (!(((b | 0) == 0) | ((d | 0) == 0) | ((f | 0) == 0)))
        if (!e) d = -2;
        else {
          c[f >> 2] = 0;
          c[i >> 2] = d;
          c[(i + 4) >> 2] = e;
          c[(i + 8) >> 2] = f;
          h = (b + 12) | 0;
          g = a[h >> 0] | 0;
          a: while (1) {
            switch ((g << 24) >> 24) {
              case 9:
              case 0: {
                d = 0;
                j = 15;
                break a;
              }
              case 8: {
                j = 11;
                break a;
              }
              case 1: {
                d = 2;
                break;
              }
              case 2: {
                d = (_(b) | 0) & 255;
                break;
              }
              case 3: {
                d = ($(b, i) | 0) & 255;
                break;
              }
              case 4: {
                d = (aa(b, i) | 0) & 255;
                break;
              }
              case 5: {
                d = (ba(b, i) | 0) & 255;
                break;
              }
              case 6: {
                d = (ca(b, i) | 0) & 255;
                break;
              }
              case 7: {
                da(b);
                d = 0;
                break;
              }
              default: {
                d = -2;
                break a;
              }
            }
            a[h >> 0] = d;
            if (
              (d << 24) >> 24 == (g << 24) >> 24
                ? (c[f >> 2] | 0) == (e | 0)
                : 0
            ) {
              d = 1;
              j = 15;
              break;
            }
            g = d;
          }
          if ((j | 0) == 11) {
            a[h >> 0] = ea(b, i) | 0;
            d = 0;
          }
        }
      else d = -1;
      I = k;
      return d | 0;
    }
    function _(a) {
      a = a | 0;
      var c = 0,
        d = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0;
      j = I;
      I = (I + 16) | 0;
      h = j;
      i = (a + 2) | 0;
      c = b[i >> 1] | 0;
      g = (Y(a) | 0) != 0;
      d = c & 65535;
      f = e[a >> 1] | 0;
      if (((f - (g ? 1 : 64)) | 0) < (d | 0)) c = g ? 8 : 7;
      else {
        g = (f - d) | 0;
        b[h >> 1] = 0;
        c =
          la(
            a,
            (((c + 256) & 65535) + 65280) & 65535,
            (d + 256) & 65535,
            ((g | 0) < 64 ? g : 64) & 65535,
            h
          ) | 0;
        if ((c << 16) >> 16 == -1) {
          b[i >> 1] = (((b[i >> 1] | 0) + 1) << 16) >> 16;
          c = 0;
        } else {
          b[(a + 6) >> 1] = c;
          c = b[h >> 1] | 0;
        }
        b[(a + 4) >> 1] = c;
        c = 3;
      }
      I = j;
      return c | 0;
    }
    function $(c, d) {
      c = c | 0;
      d = d | 0;
      do
        if (fa(d) | 0)
          if (!(b[(c + 4) >> 1] | 0)) {
            ka(c, d, 1);
            c = 4;
            break;
          } else {
            ka(c, d, 0);
            b[(c + 8) >> 1] = (e[(c + 6) >> 1] | 0) + 65535;
            a[(c + 10) >> 0] = 8;
            c = 5;
            break;
          }
        else c = 3;
      while (0);
      return c | 0;
    }
    function aa(a, b) {
      a = a | 0;
      b = b | 0;
      if (!(fa(b) | 0)) a = 4;
      else {
        ja(a, b);
        a = 2;
      }
      return a | 0;
    }
    function ba(c, d) {
      c = c | 0;
      d = d | 0;
      if ((fa(d) | 0) != 0 ? ((ha(c, d) | 0) << 24) >> 24 == 0 : 0) {
        b[(c + 8) >> 1] = (e[(c + 4) >> 1] | 0) + 65535;
        a[(c + 10) >> 0] = 6;
        c = 6;
      } else c = 5;
      return c | 0;
    }
    function ca(a, c) {
      a = a | 0;
      c = c | 0;
      if ((fa(c) | 0) != 0 ? ((ha(a, c) | 0) << 24) >> 24 == 0 : 0) {
        c = (a + 4) | 0;
        a = (a + 2) | 0;
        b[a >> 1] = (e[a >> 1] | 0) + (e[c >> 1] | 0);
        b[c >> 1] = 0;
        a = 2;
      } else a = 6;
      return a | 0;
    }
    function da(a) {
      a = a | 0;
      ga(a);
      return;
    }
    function ea(b, d) {
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      if ((a[(b + 14) >> 0] | 0) != -128)
        if (!(fa(d) | 0)) b = 8;
        else {
          f = a[(b + 13) >> 0] | 0;
          e = c[d >> 2] | 0;
          d = c[(d + 8) >> 2] | 0;
          b = c[d >> 2] | 0;
          c[d >> 2] = b + 1;
          a[(e + b) >> 0] = f;
          b = 9;
        }
      else b = 9;
      return b | 0;
    }
    function fa(a) {
      a = a | 0;
      return (
        ((c[c[(a + 8) >> 2] >> 2] | 0) >>> 0 < (c[(a + 4) >> 2] | 0) >>> 0) | 0
      );
    }
    function ga(a) {
      a = a | 0;
      var c = 0,
        d = 0,
        f = 0;
      d = (a + 2) | 0;
      f = ((256 - (b[d >> 1] | 0)) << 16) >> 16;
      c = (256 - (f & 65535)) | 0;
      nb((a + 15) | 0, (a + 15 + c) | 0, ((f + 256) & 65535) | 0) | 0;
      b[d >> 1] = 0;
      b[a >> 1] = (e[a >> 1] | 0) - c;
      return;
    }
    function ha(c, f) {
      c = c | 0;
      f = f | 0;
      var g = 0,
        h = 0,
        i = 0,
        j = 0;
      i = (c + 10) | 0;
      g = a[i >> 0] | 0;
      if ((g & 255) <= 8)
        if (!((g << 24) >> 24)) g = 0;
        else {
          h = b[(c + 8) >> 1] & 255;
          j = 4;
        }
      else {
        h = ((e[(c + 8) >> 1] | 0) >>> (((g & 255) + -8) | 0)) & 255;
        g = 8;
        j = 4;
      }
      if ((j | 0) == 4) {
        ia(c, g, h, f);
        a[i >> 0] = (d[i >> 0] | 0) - (g & 255);
      }
      return g | 0;
    }
    function ia(b, d, e, f) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      var g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0;
      h = d & 255;
      j = (b + 14) | 0;
      if ((d << 24) >> 24 == 8 ? (a[j >> 0] | 0) == -128 : 0) {
        j = c[f >> 2] | 0;
        i = c[(f + 8) >> 2] | 0;
        f = c[i >> 2] | 0;
        c[i >> 2] = f + 1;
        a[(j + f) >> 0] = e;
      } else g = 4;
      a: do
        if ((g | 0) == 4) {
          i = e & 255;
          g = (b + 13) | 0;
          b = (f + 8) | 0;
          e = h;
          while (1) {
            d = (e + -1) | 0;
            if ((e | 0) <= 0) break a;
            e = a[j >> 0] | 0;
            if (((1 << d) & i) | 0) a[g >> 0] = a[g >> 0] | e;
            h = (e & 255) >>> 1;
            a[j >> 0] = h;
            if (!((h << 24) >> 24)) {
              a[j >> 0] = -128;
              k = a[g >> 0] | 0;
              e = c[f >> 2] | 0;
              l = c[b >> 2] | 0;
              h = c[l >> 2] | 0;
              c[l >> 2] = h + 1;
              a[(e + h) >> 0] = k;
              a[g >> 0] = 0;
            }
            e = d;
          }
        }
      while (0);
      return;
    }
    function ja(c, d) {
      c = c | 0;
      d = d | 0;
      ia(
        c,
        8,
        a[((((b[(c + 2) >> 1] | 0) + 255) & 65535) + (c + 15)) >> 0] | 0,
        d
      );
      return;
    }
    function ka(a, b, c) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      ia(a, 1, c, b);
      return;
    }
    function la(c, d, e, f, g) {
      c = c | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      g = g | 0;
      var h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0;
      n = e & 65535;
      l = (c + 15 + n) | 0;
      h = -1;
      e = 0;
      m = (n + 65535) & 65535;
      while (1) {
        if ((m << 16) >> 16 < (d << 16) >> 16) break;
        i = (((m << 16) >> 16) + (c + 15)) | 0;
        k = e & 65535;
        if (
          (a[(i + k) >> 0] | 0) == (a[(l + k) >> 0] | 0)
            ? (a[i >> 0] | 0) == (a[l >> 0] | 0)
            : 0
        ) {
          k = 1;
          while (1) {
            j = k & 65535;
            if ((k & 65535) >= (f & 65535)) break;
            if ((a[(i + j) >> 0] | 0) != (a[(l + j) >> 0] | 0)) break;
            k = ((k + 1) << 16) >> 16;
          }
          if ((k & 65535) > (e & 65535))
            if ((k << 16) >> 16 == (f << 16) >> 16) {
              h = m;
              e = f;
              break;
            } else {
              h = m;
              e = k;
            }
        }
        m = ((m + -1) << 16) >> 16;
      }
      if ((e & 65535) > 1) {
        b[g >> 1] = e;
        e = (n - (h & 65535)) & 65535;
      } else e = -1;
      return e | 0;
    }
    function ma(b) {
      b = b | 0;
      var c = 0;
      if (!b) b = -1;
      else {
        c = (b + 11) | 0;
        a[c >> 0] = a[c >> 0] | 1;
        c = (b + 12) | 0;
        b = a[c >> 0] | 0;
        if (!((b << 24) >> 24)) {
          a[c >> 0] = 1;
          b = 1;
        }
        b = ((b << 24) >> 24 != 9) & 1;
      }
      return b | 0;
    }
    function na(a) {
      a = a | 0;
      ob(a | 0, 0, 301) | 0;
      return;
    }
    function oa(a, d, f, g) {
      a = a | 0;
      d = d | 0;
      f = f | 0;
      g = g | 0;
      var h = 0,
        i = 0,
        j = 0;
      if (((a | 0) == 0) | ((d | 0) == 0) | ((g | 0) == 0)) f = -1;
      else {
        i = e[a >> 1] | 0;
        j = (32 - i) | 0;
        h = j >>> 0 < f >>> 0 ? j : f;
        if (!j) {
          f = 1;
          h = 0;
        } else {
          mb((a + 13 + i) | 0, d | 0, h | 0) | 0;
          b[a >> 1] = h + i;
          f = 0;
        }
        c[g >> 2] = h;
      }
      return f | 0;
    }
    function pa(b, d, e, f) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      var g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0;
      k = I;
      I = (I + 16) | 0;
      i = k;
      if (((b | 0) == 0) | ((d | 0) == 0) | ((f | 0) == 0)) d = -1;
      else {
        c[f >> 2] = 0;
        c[i >> 2] = d;
        c[(i + 4) >> 2] = e;
        c[(i + 8) >> 2] = f;
        h = (b + 10) | 0;
        d = a[h >> 0] | 0;
        a: while (1) {
          switch ((d << 24) >> 24) {
            case 0: {
              g = qa(b) | 0;
              break;
            }
            case 1: {
              g = ra(b, i) | 0;
              break;
            }
            case 2: {
              g = sa(b) | 0;
              break;
            }
            case 3: {
              g = ta(b) | 0;
              break;
            }
            case 4: {
              g = ua(b) | 0;
              break;
            }
            case 5: {
              g = va(b) | 0;
              break;
            }
            case 6: {
              g = wa(b, i) | 0;
              break;
            }
            default: {
              d = -2;
              break a;
            }
          }
          l = d;
          d = g & 255;
          a[h >> 0] = d;
          if ((l << 24) >> 24 == (d << 24) >> 24) {
            j = 12;
            break;
          }
        }
        if ((j | 0) == 12) d = ((c[f >> 2] | 0) == (e | 0)) & 1;
      }
      I = k;
      return d | 0;
    }
    function qa(a) {
      a = a | 0;
      switch (((ya(a, 1) | 0) << 16) >> 16) {
        case -1: {
          a = 0;
          break;
        }
        case 0: {
          b[(a + 6) >> 1] = 0;
          a = 3;
          break;
        }
        default:
          a = 1;
      }
      return a | 0;
    }
    function ra(d, e) {
      d = d | 0;
      e = e | 0;
      var f = 0,
        g = 0,
        h = 0;
      if (
        (c[c[(e + 8) >> 2] >> 2] | 0) >>> 0 < (c[(e + 4) >> 2] | 0) >>> 0
          ? ((f = ya(d, 8) | 0), (f << 16) >> 16 != -1)
          : 0
      ) {
        f = f & 255;
        h = (d + 8) | 0;
        g = b[h >> 1] | 0;
        b[h >> 1] = ((g + 1) << 16) >> 16;
        a[(d + 45 + (g & 255)) >> 0] = f;
        xa(e, f);
        f = 0;
      } else f = 1;
      return f | 0;
    }
    function sa(a) {
      a = a | 0;
      var c = 0;
      c = ya(a, 0) | 0;
      if ((c << 16) >> 16 == -1) c = 2;
      else {
        b[(a + 6) >> 1] = (c & 65535) << 8;
        c = 3;
      }
      return c | 0;
    }
    function ta(a) {
      a = a | 0;
      var c = 0,
        d = 0;
      c = ya(a, 8) | 0;
      if ((c << 16) >> 16 == -1) c = 3;
      else {
        d = (a + 6) | 0;
        b[d >> 1] = (((b[d >> 1] | c) + 1) << 16) >> 16;
        b[(a + 4) >> 1] = 0;
        c = 5;
      }
      return c | 0;
    }
    function ua(a) {
      a = a | 0;
      var c = 0;
      c = ya(a, -2) | 0;
      if ((c << 16) >> 16 == -1) c = 4;
      else {
        b[(a + 4) >> 1] = (c & 65535) << 8;
        c = 5;
      }
      return c | 0;
    }
    function va(a) {
      a = a | 0;
      var c = 0;
      c = ya(a, 6) | 0;
      if ((c << 16) >> 16 == -1) c = 5;
      else {
        a = (a + 4) | 0;
        b[a >> 1] = (((b[a >> 1] | c) + 1) << 16) >> 16;
        c = 6;
      }
      return c | 0;
    }
    function wa(d, f) {
      d = d | 0;
      f = f | 0;
      var g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0;
      g = ((c[(f + 4) >> 2] | 0) - (c[c[(f + 8) >> 2] >> 2] | 0)) | 0;
      if (g) {
        k = (d + 4) | 0;
        j = e[k >> 1] | 0;
        j = g >>> 0 > j >>> 0 ? j : g;
        h = (d + 45) | 0;
        i = (d + 8) | 0;
        g = e[(d + 6) >> 1] | 0;
        d = 0;
        while (1) {
          if (d >>> 0 >= j >>> 0) break;
          n = a[(h + (((e[i >> 1] | 0) - g) & 255)) >> 0] | 0;
          xa(f, n);
          m = b[i >> 1] | 0;
          a[(h + (m & 255)) >> 0] = n;
          b[i >> 1] = ((m + 1) << 16) >> 16;
          d = (d + 1) | 0;
        }
        n = ((e[k >> 1] | 0) - j) | 0;
        b[k >> 1] = n;
        if (!(n & 65535)) g = 0;
        else l = 6;
      } else l = 6;
      if ((l | 0) == 6) g = 6;
      return g | 0;
    }
    function xa(b, d) {
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      e = c[b >> 2] | 0;
      f = c[(b + 8) >> 2] | 0;
      b = c[f >> 2] | 0;
      c[f >> 2] = b + 1;
      a[(e + b) >> 0] = d;
      return;
    }
    function ya(c, e) {
      c = c | 0;
      e = e | 0;
      var f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0;
      m = e & 255;
      a: do
        if ((e & 255) > 15) e = -1;
        else {
          e = b[c >> 1] | 0;
          j = (c + 12) | 0;
          if (
            (e << 16) >> 16 == 0
              ? ((1 << (m + -1)) | 0) > (d[j >> 0] | 0 | 0)
              : 0
          ) {
            e = -1;
            break;
          }
          k = (c + 11) | 0;
          l = (c + 2) | 0;
          g = e;
          e = 0;
          i = 0;
          while (1) {
            if (i >>> 0 >= m >>> 0) break a;
            f = a[j >> 0] | 0;
            if (!((f << 24) >> 24)) {
              if (!((g << 16) >> 16)) {
                e = -1;
                break a;
              }
              h = b[l >> 1] | 0;
              f = ((h + 1) << 16) >> 16;
              b[l >> 1] = f;
              h = a[((h & 65535) + (c + 13)) >> 0] | 0;
              a[k >> 0] = h;
              if ((f << 16) >> 16 == (g << 16) >> 16) {
                b[l >> 1] = 0;
                b[c >> 1] = 0;
                g = 0;
              }
              a[j >> 0] = -128;
              f = -128;
            } else h = a[k >> 0] | 0;
            a[j >> 0] = (f & 255) >>> 1;
            e = (((e & 65535) << 1) | (((f & h) << 24) >> 24 != 0)) & 65535;
            i = (i + 1) | 0;
          }
        }
      while (0);
      return e | 0;
    }
    function za(c) {
      c = c | 0;
      a: do
        if (!c) c = -1;
        else
          switch (a[(c + 10) >> 0] | 0) {
            case 0: {
              c = ((b[c >> 1] | 0) != 0) & 1;
              break a;
            }
            case 4:
            case 5:
            case 2:
            case 3: {
              c = ((b[c >> 1] | 0) != 0) & 1;
              break a;
            }
            case 1: {
              c = ((b[c >> 1] | 0) != 0) & 1;
              break a;
            }
            default: {
              c = 1;
              break a;
            }
          }
      while (0);
      return c | 0;
    }
    function Aa(a) {
      a = a | 0;
      return 0;
    }
    function Ba(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0;
      l = I;
      I = (I + 32) | 0;
      g = l;
      i = (l + 16) | 0;
      j = (a + 28) | 0;
      f = c[j >> 2] | 0;
      c[g >> 2] = f;
      k = (a + 20) | 0;
      f = ((c[k >> 2] | 0) - f) | 0;
      c[(g + 4) >> 2] = f;
      c[(g + 8) >> 2] = b;
      c[(g + 12) >> 2] = d;
      e = (a + 60) | 0;
      h = 2;
      f = (f + d) | 0;
      while (1) {
        if (!(((x(c[e >> 2] | 0, g | 0, h | 0, i | 0) | 0) << 16) >> 16))
          b = c[i >> 2] | 0;
        else {
          c[i >> 2] = -1;
          b = -1;
        }
        if ((f | 0) == (b | 0)) {
          b = 6;
          break;
        }
        if ((b | 0) < 0) {
          b = 8;
          break;
        }
        p = c[(g + 4) >> 2] | 0;
        m = b >>> 0 > p >>> 0;
        n = m ? (g + 8) | 0 : g;
        p = (b - (m ? p : 0)) | 0;
        c[n >> 2] = (c[n >> 2] | 0) + p;
        o = (n + 4) | 0;
        c[o >> 2] = (c[o >> 2] | 0) - p;
        g = n;
        h = (h + ((m << 31) >> 31)) | 0;
        f = (f - b) | 0;
      }
      if ((b | 0) == 6) {
        p = c[(a + 44) >> 2] | 0;
        c[(a + 16) >> 2] = p + (c[(a + 48) >> 2] | 0);
        c[j >> 2] = p;
        c[k >> 2] = p;
      } else if ((b | 0) == 8) {
        c[(a + 16) >> 2] = 0;
        c[j >> 2] = 0;
        c[k >> 2] = 0;
        c[a >> 2] = c[a >> 2] | 32;
        if ((h | 0) == 2) d = 0;
        else d = (d - (c[(g + 4) >> 2] | 0)) | 0;
      }
      I = l;
      return d | 0;
    }
    function Ca(a, b, c, d) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      d = d | 0;
      u(0);
      return 0;
    }
    function Da() {
      return 2128;
    }
    function Ea(a, b, c) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      return Ha(a, b, c, 1, 1) | 0;
    }
    function Fa(b, e, f, g, h, i) {
      b = b | 0;
      e = +e;
      f = f | 0;
      g = g | 0;
      h = h | 0;
      i = i | 0;
      var j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        s = 0.0,
        t = 0,
        u = 0,
        w = 0,
        x = 0,
        y = 0,
        z = 0,
        A = 0,
        B = 0,
        C = 0,
        D = 0,
        E = 0,
        F = 0,
        G = 0,
        H = 0;
      H = I;
      I = (I + 560) | 0;
      m = (H + 32) | 0;
      u = (H + 536) | 0;
      G = H;
      F = G;
      l = (H + 540) | 0;
      c[u >> 2] = 0;
      E = (l + 12) | 0;
      _a(e) | 0;
      j = v() | 0;
      if ((j | 0) < 0) {
        e = -e;
        _a(e) | 0;
        j = v() | 0;
        D = 1;
        B = 1045;
      } else {
        D = (((h & 2049) | 0) != 0) & 1;
        B = ((h & 2048) | 0) == 0 ? (((h & 1) | 0) == 0 ? 1046 : 1051) : 1048;
      }
      do
        if ((0 == 0) & (((j & 2146435072) | 0) == 2146435072)) {
          G = ((i & 32) | 0) != 0;
          j = (D + 3) | 0;
          Ta(b, 32, f, j, h & -65537);
          La(b, B, D);
          La(
            b,
            (e != e) | (0.0 != 0.0) ? (G ? 1072 : 1076) : G ? 1064 : 1068,
            3
          );
          Ta(b, 32, f, j, h ^ 8192);
        } else {
          s = +$a(e, u) * 2.0;
          j = s != 0.0;
          if (j) c[u >> 2] = (c[u >> 2] | 0) + -1;
          x = i | 32;
          if ((x | 0) == 97) {
            o = i & 32;
            q = (o | 0) == 0 ? B : (B + 9) | 0;
            p = D | 2;
            j = (12 - g) | 0;
            do
              if (!((g >>> 0 > 11) | ((j | 0) == 0))) {
                e = 8.0;
                do {
                  j = (j + -1) | 0;
                  e = e * 16.0;
                } while ((j | 0) != 0);
                if ((a[q >> 0] | 0) == 45) {
                  e = -(e + (-s - e));
                  break;
                } else {
                  e = s + e - e;
                  break;
                }
              } else e = s;
            while (0);
            k = c[u >> 2] | 0;
            j = (k | 0) < 0 ? (0 - k) | 0 : k;
            j = Ra(j, (((j | 0) < 0) << 31) >> 31, E) | 0;
            if ((j | 0) == (E | 0)) {
              j = (l + 11) | 0;
              a[j >> 0] = 48;
            }
            a[(j + -1) >> 0] = ((k >> 31) & 2) + 43;
            n = (j + -2) | 0;
            a[n >> 0] = i + 15;
            k = (g | 0) < 1;
            l = ((h & 8) | 0) == 0;
            j = G;
            while (1) {
              D = ~~e;
              m = (j + 1) | 0;
              a[j >> 0] = o | d[(480 + D) >> 0];
              e = (e - +(D | 0)) * 16.0;
              if (((m - F) | 0) == 1 ? !(l & (k & (e == 0.0))) : 0) {
                a[m >> 0] = 46;
                m = (j + 2) | 0;
              }
              if (!(e != 0.0)) break;
              else j = m;
            }
            if ((g | 0) != 0 ? ((-2 - F + m) | 0) < (g | 0) : 0) {
              k = E;
              l = n;
              j = (g + 2 + k - l) | 0;
            } else {
              k = E;
              l = n;
              j = (k - F - l + m) | 0;
            }
            E = (j + p) | 0;
            Ta(b, 32, f, E, h);
            La(b, q, p);
            Ta(b, 48, f, E, h ^ 65536);
            F = (m - F) | 0;
            La(b, G, F);
            G = (k - l) | 0;
            Ta(b, 48, (j - (F + G)) | 0, 0, 0);
            La(b, n, G);
            Ta(b, 32, f, E, h ^ 8192);
            j = E;
            break;
          }
          k = (g | 0) < 0 ? 6 : g;
          if (j) {
            l = ((c[u >> 2] | 0) + -28) | 0;
            c[u >> 2] = l;
            e = s * 268435456.0;
          } else {
            l = c[u >> 2] | 0;
            e = s;
          }
          C = (l | 0) < 0 ? m : (m + 288) | 0;
          m = C;
          do {
            z = ~~e >>> 0;
            c[m >> 2] = z;
            m = (m + 4) | 0;
            e = (e - +(z >>> 0)) * 1.0e9;
          } while (e != 0.0);
          z = C;
          if ((l | 0) > 0) {
            j = C;
            do {
              o = (l | 0) < 29 ? l : 29;
              l = (m + -4) | 0;
              if (l >>> 0 >= j >>> 0) {
                n = 0;
                do {
                  t = lb(c[l >> 2] | 0, 0, o | 0) | 0;
                  t = fb(t | 0, v() | 0, n | 0, 0) | 0;
                  w = v() | 0;
                  n = jb(t | 0, w | 0, 1e9, 0) | 0;
                  y = eb(n | 0, v() | 0, 1e9, 0) | 0;
                  y = gb(t | 0, w | 0, y | 0, v() | 0) | 0;
                  v() | 0;
                  c[l >> 2] = y;
                  l = (l + -4) | 0;
                } while (l >>> 0 >= j >>> 0);
                if (n) {
                  j = (j + -4) | 0;
                  c[j >> 2] = n;
                }
              }
              a: do
                if (m >>> 0 > j >>> 0)
                  while (1) {
                    l = (m + -4) | 0;
                    if (c[l >> 2] | 0) break a;
                    if (l >>> 0 > j >>> 0) m = l;
                    else {
                      m = l;
                      break;
                    }
                  }
              while (0);
              l = ((c[u >> 2] | 0) - o) | 0;
              c[u >> 2] = l;
            } while ((l | 0) > 0);
          } else j = C;
          if ((l | 0) < 0) {
            g = (((((k + 25) | 0) / 9) | 0) + 1) | 0;
            t = (x | 0) == 102;
            do {
              q = (0 - l) | 0;
              q = (q | 0) < 9 ? q : 9;
              if (j >>> 0 < m >>> 0) {
                o = ((1 << q) + -1) | 0;
                n = 1e9 >>> q;
                p = 0;
                l = j;
                do {
                  y = c[l >> 2] | 0;
                  c[l >> 2] = (y >>> q) + p;
                  p = r(y & o, n) | 0;
                  l = (l + 4) | 0;
                } while (l >>> 0 < m >>> 0);
                j = (c[j >> 2] | 0) == 0 ? (j + 4) | 0 : j;
                if (p) {
                  c[m >> 2] = p;
                  m = (m + 4) | 0;
                }
              } else j = (c[j >> 2] | 0) == 0 ? (j + 4) | 0 : j;
              l = t ? C : j;
              m = (((m - l) >> 2) | 0) > (g | 0) ? (l + (g << 2)) | 0 : m;
              l = ((c[u >> 2] | 0) + q) | 0;
              c[u >> 2] = l;
            } while ((l | 0) < 0);
            t = m;
          } else t = m;
          if (j >>> 0 < t >>> 0) {
            l = (((z - j) >> 2) * 9) | 0;
            n = c[j >> 2] | 0;
            if (n >>> 0 >= 10) {
              m = 10;
              do {
                m = (m * 10) | 0;
                l = (l + 1) | 0;
              } while (n >>> 0 >= m >>> 0);
            }
          } else l = 0;
          u = (x | 0) == 103;
          w = (k | 0) != 0;
          m = (k - ((x | 0) == 102 ? 0 : l) + (((w & u) << 31) >> 31)) | 0;
          if ((m | 0) < ((((((t - z) >> 2) * 9) | 0) + -9) | 0)) {
            y = (m + 9216) | 0;
            m = ((y | 0) / 9) | 0;
            g = (C + 4 + ((m + -1024) << 2)) | 0;
            m = (y - ((m * 9) | 0)) | 0;
            if ((m | 0) < 8) {
              n = 10;
              while (1) {
                n = (n * 10) | 0;
                if ((m | 0) < 7) m = (m + 1) | 0;
                else break;
              }
            } else n = 10;
            p = c[g >> 2] | 0;
            m = ((p >>> 0) / (n >>> 0)) | 0;
            q = (p - (r(m, n) | 0)) | 0;
            o = ((g + 4) | 0) == (t | 0);
            if (!(o & ((q | 0) == 0))) {
              s = ((m & 1) | 0) == 0 ? 9007199254740992.0 : 9007199254740994.0;
              y = n >>> 1;
              e =
                q >>> 0 < y >>> 0 ? 0.5 : o & ((q | 0) == (y | 0)) ? 1.0 : 1.5;
              if (D) {
                y = (a[B >> 0] | 0) == 45;
                s = y ? -s : s;
                e = y ? -e : e;
              }
              m = (p - q) | 0;
              c[g >> 2] = m;
              if (s + e != s) {
                y = (m + n) | 0;
                c[g >> 2] = y;
                if (y >>> 0 > 999999999) {
                  l = g;
                  while (1) {
                    m = (l + -4) | 0;
                    c[l >> 2] = 0;
                    if (m >>> 0 < j >>> 0) {
                      j = (j + -4) | 0;
                      c[j >> 2] = 0;
                    }
                    y = ((c[m >> 2] | 0) + 1) | 0;
                    c[m >> 2] = y;
                    if (y >>> 0 > 999999999) l = m;
                    else break;
                  }
                } else m = g;
                l = (((z - j) >> 2) * 9) | 0;
                o = c[j >> 2] | 0;
                if (o >>> 0 >= 10) {
                  n = 10;
                  do {
                    n = (n * 10) | 0;
                    l = (l + 1) | 0;
                  } while (o >>> 0 >= n >>> 0);
                }
              } else m = g;
            } else m = g;
            x = (m + 4) | 0;
            y = j;
            j = t >>> 0 > x >>> 0 ? x : t;
          } else {
            y = j;
            j = t;
          }
          q = (0 - l) | 0;
          b: do
            if (j >>> 0 > y >>> 0)
              while (1) {
                m = (j + -4) | 0;
                if (c[m >> 2] | 0) {
                  t = 1;
                  x = j;
                  break b;
                }
                if (m >>> 0 > y >>> 0) j = m;
                else {
                  t = 0;
                  x = m;
                  break;
                }
              }
            else {
              t = 0;
              x = j;
            }
          while (0);
          do
            if (u) {
              j = (k + ((w ^ 1) & 1)) | 0;
              if (((j | 0) > (l | 0)) & ((l | 0) > -5)) {
                k = (j + -1 - l) | 0;
                n = (i + -1) | 0;
              } else {
                k = (j + -1) | 0;
                n = (i + -2) | 0;
              }
              if (!(h & 8)) {
                if (t ? ((A = c[(x + -4) >> 2] | 0), (A | 0) != 0) : 0)
                  if (!((A >>> 0) % 10 | 0)) {
                    j = 10;
                    m = 0;
                    do {
                      j = (j * 10) | 0;
                      m = (m + 1) | 0;
                    } while (!((A >>> 0) % (j >>> 0) | 0 | 0));
                  } else m = 0;
                else m = 9;
                j = (((((x - z) >> 2) * 9) | 0) + -9) | 0;
                if ((n | 32 | 0) == 102) {
                  i = (j - m) | 0;
                  i = (i | 0) > 0 ? i : 0;
                  k = (k | 0) < (i | 0) ? k : i;
                  break;
                } else {
                  i = (j + l - m) | 0;
                  i = (i | 0) > 0 ? i : 0;
                  k = (k | 0) < (i | 0) ? k : i;
                  break;
                }
              }
            } else n = i;
          while (0);
          g = (k | 0) != 0;
          o = g ? 1 : (h >>> 3) & 1;
          p = (n | 32 | 0) == 102;
          if (p) {
            w = 0;
            j = (l | 0) > 0 ? l : 0;
          } else {
            j = (l | 0) < 0 ? q : l;
            j = Ra(j, (((j | 0) < 0) << 31) >> 31, E) | 0;
            m = E;
            if (((m - j) | 0) < 2)
              do {
                j = (j + -1) | 0;
                a[j >> 0] = 48;
              } while (((m - j) | 0) < 2);
            a[(j + -1) >> 0] = ((l >> 31) & 2) + 43;
            j = (j + -2) | 0;
            a[j >> 0] = n;
            w = j;
            j = (m - j) | 0;
          }
          j = (D + 1 + k + o + j) | 0;
          Ta(b, 32, f, j, h);
          La(b, B, D);
          Ta(b, 48, f, j, h ^ 65536);
          if (p) {
            o = y >>> 0 > C >>> 0 ? C : y;
            q = (G + 9) | 0;
            p = q;
            n = (G + 8) | 0;
            m = o;
            do {
              l = Ra(c[m >> 2] | 0, 0, q) | 0;
              if ((m | 0) == (o | 0)) {
                if ((l | 0) == (q | 0)) {
                  a[n >> 0] = 48;
                  l = n;
                }
              } else if (l >>> 0 > G >>> 0) {
                ob(G | 0, 48, (l - F) | 0) | 0;
                do l = (l + -1) | 0;
                while (l >>> 0 > G >>> 0);
              }
              La(b, l, (p - l) | 0);
              m = (m + 4) | 0;
            } while (m >>> 0 <= C >>> 0);
            if (!((((h & 8) | 0) == 0) & (g ^ 1))) La(b, 1080, 1);
            if ((m >>> 0 < x >>> 0) & ((k | 0) > 0))
              while (1) {
                l = Ra(c[m >> 2] | 0, 0, q) | 0;
                if (l >>> 0 > G >>> 0) {
                  ob(G | 0, 48, (l - F) | 0) | 0;
                  do l = (l + -1) | 0;
                  while (l >>> 0 > G >>> 0);
                }
                La(b, l, (k | 0) < 9 ? k : 9);
                m = (m + 4) | 0;
                l = (k + -9) | 0;
                if (!((m >>> 0 < x >>> 0) & ((k | 0) > 9))) {
                  k = l;
                  break;
                } else k = l;
              }
            Ta(b, 48, (k + 9) | 0, 9, 0);
          } else {
            g = t ? x : (y + 4) | 0;
            if ((y >>> 0 < g >>> 0) & ((k | 0) > -1)) {
              q = (G + 9) | 0;
              u = ((h & 8) | 0) == 0;
              t = q;
              n = (0 - F) | 0;
              p = (G + 8) | 0;
              o = y;
              do {
                l = Ra(c[o >> 2] | 0, 0, q) | 0;
                if ((l | 0) == (q | 0)) {
                  a[p >> 0] = 48;
                  l = p;
                }
                do
                  if ((o | 0) == (y | 0)) {
                    m = (l + 1) | 0;
                    La(b, l, 1);
                    if (u & ((k | 0) < 1)) {
                      l = m;
                      break;
                    }
                    La(b, 1080, 1);
                    l = m;
                  } else {
                    if (l >>> 0 <= G >>> 0) break;
                    ob(G | 0, 48, (l + n) | 0) | 0;
                    do l = (l + -1) | 0;
                    while (l >>> 0 > G >>> 0);
                  }
                while (0);
                F = (t - l) | 0;
                La(b, l, (k | 0) > (F | 0) ? F : k);
                k = (k - F) | 0;
                o = (o + 4) | 0;
              } while ((o >>> 0 < g >>> 0) & ((k | 0) > -1));
            }
            Ta(b, 48, (k + 18) | 0, 18, 0);
            La(b, w, (E - w) | 0);
          }
          Ta(b, 32, f, j, h ^ 8192);
        }
      while (0);
      I = H;
      return ((j | 0) < (f | 0) ? f : j) | 0;
    }
    function Ga(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0.0,
        e = 0;
      e = ((c[b >> 2] | 0) + (8 - 1)) & ~(8 - 1);
      d = +g[e >> 3];
      c[b >> 2] = e + 8;
      g[a >> 3] = d;
      return;
    }
    function Ha(b, d, e, f, g) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      g = g | 0;
      var h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0,
        t = 0;
      t = I;
      I = (I + 224) | 0;
      o = (t + 208) | 0;
      s = (t + 160) | 0;
      r = (t + 80) | 0;
      q = t;
      h = s;
      i = (h + 40) | 0;
      do {
        c[h >> 2] = 0;
        h = (h + 4) | 0;
      } while ((h | 0) < (i | 0));
      c[o >> 2] = c[e >> 2];
      if ((Ia(0, d, o, r, s, f, g) | 0) < 0) e = -1;
      else {
        if ((c[(b + 76) >> 2] | 0) > -1) p = Ja(b) | 0;
        else p = 0;
        e = c[b >> 2] | 0;
        n = e & 32;
        if ((a[(b + 74) >> 0] | 0) < 1) c[b >> 2] = e & -33;
        j = (b + 48) | 0;
        if (!(c[j >> 2] | 0)) {
          i = (b + 44) | 0;
          e = c[i >> 2] | 0;
          c[i >> 2] = q;
          k = (b + 28) | 0;
          c[k >> 2] = q;
          m = (b + 20) | 0;
          c[m >> 2] = q;
          c[j >> 2] = 80;
          l = (b + 16) | 0;
          c[l >> 2] = q + 80;
          h = Ia(b, d, o, r, s, f, g) | 0;
          if (e) {
            N[c[(b + 36) >> 2] & 1](b, 0, 0) | 0;
            h = (c[m >> 2] | 0) == 0 ? -1 : h;
            c[i >> 2] = e;
            c[j >> 2] = 0;
            c[l >> 2] = 0;
            c[k >> 2] = 0;
            c[m >> 2] = 0;
          }
        } else h = Ia(b, d, o, r, s, f, g) | 0;
        e = c[b >> 2] | 0;
        c[b >> 2] = e | n;
        if (p | 0) Ka(b);
        e = ((e & 32) | 0) == 0 ? h : -1;
      }
      I = t;
      return e | 0;
    }
    function Ia(d, e, f, h, i, j, k) {
      d = d | 0;
      e = e | 0;
      f = f | 0;
      h = h | 0;
      i = i | 0;
      j = j | 0;
      k = k | 0;
      var l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0,
        t = 0,
        u = 0,
        w = 0,
        x = 0,
        y = 0,
        z = 0,
        A = 0,
        B = 0,
        C = 0,
        D = 0,
        E = 0,
        F = 0,
        G = 0,
        H = 0,
        J = 0,
        K = 0,
        L = 0;
      K = I;
      I = (I + 64) | 0;
      H = (K + 56) | 0;
      F = (K + 40) | 0;
      z = K;
      J = (K + 48) | 0;
      G = (K + 60) | 0;
      c[H >> 2] = e;
      C = (d | 0) != 0;
      y = (z + 40) | 0;
      B = y;
      z = (z + 39) | 0;
      A = (J + 4) | 0;
      e = 0;
      l = 0;
      o = 0;
      a: while (1) {
        do {
          do
            if ((e | 0) > -1)
              if ((l | 0) > ((2147483647 - e) | 0)) {
                c[(Da() | 0) >> 2] = 75;
                e = -1;
                break;
              } else {
                e = (l + e) | 0;
                break;
              }
          while (0);
          s = c[H >> 2] | 0;
          l = a[s >> 0] | 0;
          if (!((l << 24) >> 24)) {
            x = 92;
            break a;
          }
          m = s;
          b: while (1) {
            switch ((l << 24) >> 24) {
              case 37: {
                x = 10;
                break b;
              }
              case 0: {
                l = m;
                break b;
              }
              default: {
              }
            }
            w = (m + 1) | 0;
            c[H >> 2] = w;
            l = a[w >> 0] | 0;
            m = w;
          }
          c: do
            if ((x | 0) == 10) {
              x = 0;
              n = m;
              l = m;
              do {
                if ((a[(n + 1) >> 0] | 0) != 37) break c;
                l = (l + 1) | 0;
                n = (n + 2) | 0;
                c[H >> 2] = n;
              } while ((a[n >> 0] | 0) == 37);
            }
          while (0);
          l = (l - s) | 0;
          if (C) La(d, s, l);
        } while ((l | 0) != 0);
        w = (Ma(a[((c[H >> 2] | 0) + 1) >> 0] | 0) | 0) == 0;
        l = c[H >> 2] | 0;
        if (!w ? (a[(l + 2) >> 0] | 0) == 36 : 0) {
          m = 3;
          q = ((a[(l + 1) >> 0] | 0) + -48) | 0;
          p = 1;
        } else {
          m = 1;
          q = -1;
          p = o;
        }
        m = (l + m) | 0;
        c[H >> 2] = m;
        l = a[m >> 0] | 0;
        n = (((l << 24) >> 24) + -32) | 0;
        if ((n >>> 0 > 31) | ((((1 << n) & 75913) | 0) == 0)) o = 0;
        else {
          l = 0;
          while (1) {
            o = (1 << n) | l;
            m = (m + 1) | 0;
            c[H >> 2] = m;
            l = a[m >> 0] | 0;
            n = (((l << 24) >> 24) + -32) | 0;
            if ((n >>> 0 > 31) | ((((1 << n) & 75913) | 0) == 0)) break;
            else l = o;
          }
        }
        if ((l << 24) >> 24 == 42) {
          if (
            (Ma(a[(m + 1) >> 0] | 0) | 0) != 0
              ? ((D = c[H >> 2] | 0), (a[(D + 2) >> 0] | 0) == 36)
              : 0
          ) {
            l = (D + 1) | 0;
            c[(i + (((a[l >> 0] | 0) + -48) << 2)) >> 2] = 10;
            n = 1;
            m = (D + 3) | 0;
            l = c[(h + (((a[l >> 0] | 0) + -48) << 3)) >> 2] | 0;
          } else {
            if (p | 0) {
              e = -1;
              break;
            }
            if (C) {
              w = ((c[f >> 2] | 0) + (4 - 1)) & ~(4 - 1);
              l = c[w >> 2] | 0;
              c[f >> 2] = w + 4;
            } else l = 0;
            n = 0;
            m = ((c[H >> 2] | 0) + 1) | 0;
          }
          c[H >> 2] = m;
          u = (l | 0) < 0;
          o = u ? o | 8192 : o;
          w = n;
          u = u ? (0 - l) | 0 : l;
        } else {
          l = Na(H) | 0;
          if ((l | 0) < 0) {
            e = -1;
            break;
          }
          m = c[H >> 2] | 0;
          w = p;
          u = l;
        }
        do
          if ((a[m >> 0] | 0) == 46) {
            l = (m + 1) | 0;
            if ((a[l >> 0] | 0) != 42) {
              c[H >> 2] = l;
              t = Na(H) | 0;
              l = c[H >> 2] | 0;
              break;
            }
            if (
              Ma(a[(m + 2) >> 0] | 0) | 0
                ? ((E = c[H >> 2] | 0), (a[(E + 3) >> 0] | 0) == 36)
                : 0
            ) {
              t = (E + 2) | 0;
              c[(i + (((a[t >> 0] | 0) + -48) << 2)) >> 2] = 10;
              t = c[(h + (((a[t >> 0] | 0) + -48) << 3)) >> 2] | 0;
              l = (E + 4) | 0;
              c[H >> 2] = l;
              break;
            }
            if (w | 0) {
              e = -1;
              break a;
            }
            if (C) {
              t = ((c[f >> 2] | 0) + (4 - 1)) & ~(4 - 1);
              m = c[t >> 2] | 0;
              c[f >> 2] = t + 4;
            } else m = 0;
            l = ((c[H >> 2] | 0) + 2) | 0;
            c[H >> 2] = l;
            t = m;
          } else {
            l = m;
            t = -1;
          }
        while (0);
        r = 0;
        while (1) {
          if ((((a[l >> 0] | 0) + -65) | 0) >>> 0 > 57) {
            e = -1;
            break a;
          }
          m = l;
          l = (l + 1) | 0;
          c[H >> 2] = l;
          m = a[((a[m >> 0] | 0) + -65 + (16 + ((r * 58) | 0))) >> 0] | 0;
          p = m & 255;
          if (((p + -1) | 0) >>> 0 >= 8) break;
          else r = p;
        }
        if (!((m << 24) >> 24)) {
          e = -1;
          break;
        }
        n = (q | 0) > -1;
        do
          if ((m << 24) >> 24 == 19)
            if (n) {
              e = -1;
              break a;
            } else x = 54;
          else {
            if (n) {
              c[(i + (q << 2)) >> 2] = p;
              p = (h + (q << 3)) | 0;
              q = c[(p + 4) >> 2] | 0;
              x = F;
              c[x >> 2] = c[p >> 2];
              c[(x + 4) >> 2] = q;
              x = 54;
              break;
            }
            if (!C) {
              e = 0;
              break a;
            }
            Oa(F, p, f, k);
            l = c[H >> 2] | 0;
            x = 55;
          }
        while (0);
        if ((x | 0) == 54) {
          x = 0;
          if (C) x = 55;
          else l = 0;
        }
        d: do
          if ((x | 0) == 55) {
            x = 0;
            n = a[(l + -1) >> 0] | 0;
            n = ((r | 0) != 0) & (((n & 15) | 0) == 3) ? n & -33 : n;
            l = o & -65537;
            q = ((o & 8192) | 0) == 0 ? o : l;
            e: do
              switch (n | 0) {
                case 110:
                  switch (((r & 255) << 24) >> 24) {
                    case 0: {
                      c[c[F >> 2] >> 2] = e;
                      l = 0;
                      break d;
                    }
                    case 1: {
                      c[c[F >> 2] >> 2] = e;
                      l = 0;
                      break d;
                    }
                    case 2: {
                      l = c[F >> 2] | 0;
                      c[l >> 2] = e;
                      c[(l + 4) >> 2] = (((e | 0) < 0) << 31) >> 31;
                      l = 0;
                      break d;
                    }
                    case 3: {
                      b[c[F >> 2] >> 1] = e;
                      l = 0;
                      break d;
                    }
                    case 4: {
                      a[c[F >> 2] >> 0] = e;
                      l = 0;
                      break d;
                    }
                    case 6: {
                      c[c[F >> 2] >> 2] = e;
                      l = 0;
                      break d;
                    }
                    case 7: {
                      l = c[F >> 2] | 0;
                      c[l >> 2] = e;
                      c[(l + 4) >> 2] = (((e | 0) < 0) << 31) >> 31;
                      l = 0;
                      break d;
                    }
                    default: {
                      l = 0;
                      break d;
                    }
                  }
                case 112: {
                  l = q | 8;
                  m = t >>> 0 > 8 ? t : 8;
                  n = 120;
                  x = 67;
                  break;
                }
                case 88:
                case 120: {
                  l = q;
                  m = t;
                  x = 67;
                  break;
                }
                case 111: {
                  o = F;
                  o = Qa(c[o >> 2] | 0, c[(o + 4) >> 2] | 0, y) | 0;
                  m = (B - o) | 0;
                  l = q;
                  m =
                    (((q & 8) | 0) == 0) | ((t | 0) > (m | 0))
                      ? t
                      : (m + 1) | 0;
                  r = 0;
                  p = 1028;
                  x = 73;
                  break;
                }
                case 105:
                case 100: {
                  m = F;
                  l = c[m >> 2] | 0;
                  m = c[(m + 4) >> 2] | 0;
                  if ((m | 0) < 0) {
                    l = gb(0, 0, l | 0, m | 0) | 0;
                    m = v() | 0;
                    n = F;
                    c[n >> 2] = l;
                    c[(n + 4) >> 2] = m;
                    n = 1;
                    p = 1028;
                    x = 72;
                    break e;
                  } else {
                    n = (((q & 2049) | 0) != 0) & 1;
                    p =
                      ((q & 2048) | 0) == 0
                        ? ((q & 1) | 0) == 0
                          ? 1028
                          : 1030
                        : 1029;
                    x = 72;
                    break e;
                  }
                }
                case 117: {
                  m = F;
                  l = c[m >> 2] | 0;
                  m = c[(m + 4) >> 2] | 0;
                  n = 0;
                  p = 1028;
                  x = 72;
                  break;
                }
                case 99: {
                  a[z >> 0] = c[F >> 2];
                  s = z;
                  q = l;
                  o = 1;
                  n = 0;
                  m = 1028;
                  l = B;
                  break;
                }
                case 115: {
                  p = c[F >> 2] | 0;
                  p = (p | 0) == 0 ? 1038 : p;
                  r = Sa(p, 0, t) | 0;
                  L = (r | 0) == 0;
                  s = p;
                  q = l;
                  o = L ? t : (r - p) | 0;
                  n = 0;
                  m = 1028;
                  l = L ? (p + t) | 0 : r;
                  break;
                }
                case 67: {
                  c[J >> 2] = c[F >> 2];
                  c[A >> 2] = 0;
                  c[F >> 2] = J;
                  o = -1;
                  x = 79;
                  break;
                }
                case 83: {
                  if (!t) {
                    Ta(d, 32, u, 0, q);
                    l = 0;
                    x = 89;
                  } else {
                    o = t;
                    x = 79;
                  }
                  break;
                }
                case 65:
                case 71:
                case 70:
                case 69:
                case 97:
                case 103:
                case 102:
                case 101: {
                  l = M[j & 1](d, +g[F >> 3], u, t, q, n) | 0;
                  break d;
                }
                default: {
                  o = t;
                  n = 0;
                  m = 1028;
                  l = B;
                }
              }
            while (0);
            f: do
              if ((x | 0) == 67) {
                o = F;
                o = Pa(c[o >> 2] | 0, c[(o + 4) >> 2] | 0, y, n & 32) | 0;
                p = F;
                p =
                  (((l & 8) | 0) == 0) |
                  (((c[p >> 2] | 0) == 0) & ((c[(p + 4) >> 2] | 0) == 0));
                r = p ? 0 : 2;
                p = p ? 1028 : (1028 + (n >>> 4)) | 0;
                x = 73;
              } else if ((x | 0) == 72) {
                o = Ra(l, m, y) | 0;
                l = q;
                m = t;
                r = n;
                x = 73;
              } else if ((x | 0) == 79) {
                x = 0;
                l = 0;
                p = c[F >> 2] | 0;
                while (1) {
                  m = c[p >> 2] | 0;
                  if (!m) break;
                  m = Ua(G, m) | 0;
                  n = (m | 0) < 0;
                  if (n | (m >>> 0 > ((o - l) | 0) >>> 0)) {
                    x = 83;
                    break;
                  }
                  l = (m + l) | 0;
                  if (o >>> 0 > l >>> 0) p = (p + 4) | 0;
                  else break;
                }
                if ((x | 0) == 83) {
                  x = 0;
                  if (n) {
                    e = -1;
                    break a;
                  }
                }
                Ta(d, 32, u, l, q);
                if (!l) {
                  l = 0;
                  x = 89;
                } else {
                  n = 0;
                  o = c[F >> 2] | 0;
                  while (1) {
                    m = c[o >> 2] | 0;
                    if (!m) {
                      x = 89;
                      break f;
                    }
                    m = Ua(G, m) | 0;
                    n = (m + n) | 0;
                    if ((n | 0) > (l | 0)) {
                      x = 89;
                      break f;
                    }
                    La(d, G, m);
                    if (n >>> 0 >= l >>> 0) {
                      x = 89;
                      break;
                    } else o = (o + 4) | 0;
                  }
                }
              }
            while (0);
            if ((x | 0) == 73) {
              x = 0;
              n = F;
              n = ((c[n >> 2] | 0) != 0) | ((c[(n + 4) >> 2] | 0) != 0);
              L = ((m | 0) != 0) | n;
              n = (B - o + ((n ^ 1) & 1)) | 0;
              s = L ? o : y;
              q = (m | 0) > -1 ? l & -65537 : l;
              o = L ? ((m | 0) > (n | 0) ? m : n) : 0;
              n = r;
              m = p;
              l = B;
            } else if ((x | 0) == 89) {
              x = 0;
              Ta(d, 32, u, l, q ^ 8192);
              l = (u | 0) > (l | 0) ? u : l;
              break;
            }
            t = (l - s) | 0;
            r = (o | 0) < (t | 0) ? t : o;
            L = (r + n) | 0;
            l = (u | 0) < (L | 0) ? L : u;
            Ta(d, 32, l, L, q);
            La(d, m, n);
            Ta(d, 48, l, L, q ^ 65536);
            Ta(d, 48, r, t, 0);
            La(d, s, t);
            Ta(d, 32, l, L, q ^ 8192);
          }
        while (0);
        o = w;
      }
      g: do
        if ((x | 0) == 92)
          if (!d)
            if (!o) e = 0;
            else {
              e = 1;
              while (1) {
                l = c[(i + (e << 2)) >> 2] | 0;
                if (!l) break;
                Oa((h + (e << 3)) | 0, l, f, k);
                e = (e + 1) | 0;
                if (e >>> 0 >= 10) {
                  e = 1;
                  break g;
                }
              }
              while (1) {
                if (c[(i + (e << 2)) >> 2] | 0) {
                  e = -1;
                  break g;
                }
                e = (e + 1) | 0;
                if (e >>> 0 >= 10) {
                  e = 1;
                  break;
                }
              }
            }
      while (0);
      I = K;
      return e | 0;
    }
    function Ja(a) {
      a = a | 0;
      return 1;
    }
    function Ka(a) {
      a = a | 0;
      return;
    }
    function La(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      if (!(c[a >> 2] & 32)) Ya(b, d, a) | 0;
      return;
    }
    function Ma(a) {
      a = a | 0;
      return (((a + -48) | 0) >>> 0 < 10) | 0;
    }
    function Na(b) {
      b = b | 0;
      var d = 0,
        e = 0;
      if (!(Ma(a[c[b >> 2] >> 0] | 0) | 0)) d = 0;
      else {
        d = 0;
        do {
          e = c[b >> 2] | 0;
          d = (((d * 10) | 0) + -48 + (a[e >> 0] | 0)) | 0;
          e = (e + 1) | 0;
          c[b >> 2] = e;
        } while ((Ma(a[e >> 0] | 0) | 0) != 0);
      }
      return d | 0;
    }
    function Oa(a, b, d, e) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0,
        h = 0.0;
      a: do
        if (b >>> 0 <= 20)
          do
            switch (b | 0) {
              case 9: {
                e = ((c[d >> 2] | 0) + (4 - 1)) & ~(4 - 1);
                b = c[e >> 2] | 0;
                c[d >> 2] = e + 4;
                c[a >> 2] = b;
                break a;
              }
              case 10: {
                b = ((c[d >> 2] | 0) + (4 - 1)) & ~(4 - 1);
                e = c[b >> 2] | 0;
                c[d >> 2] = b + 4;
                b = a;
                c[b >> 2] = e;
                c[(b + 4) >> 2] = (((e | 0) < 0) << 31) >> 31;
                break a;
              }
              case 11: {
                b = ((c[d >> 2] | 0) + (4 - 1)) & ~(4 - 1);
                e = c[b >> 2] | 0;
                c[d >> 2] = b + 4;
                b = a;
                c[b >> 2] = e;
                c[(b + 4) >> 2] = 0;
                break a;
              }
              case 12: {
                b = ((c[d >> 2] | 0) + (8 - 1)) & ~(8 - 1);
                e = b;
                f = c[e >> 2] | 0;
                e = c[(e + 4) >> 2] | 0;
                c[d >> 2] = b + 8;
                b = a;
                c[b >> 2] = f;
                c[(b + 4) >> 2] = e;
                break a;
              }
              case 13: {
                f = ((c[d >> 2] | 0) + (4 - 1)) & ~(4 - 1);
                b = c[f >> 2] | 0;
                c[d >> 2] = f + 4;
                b = ((b & 65535) << 16) >> 16;
                f = a;
                c[f >> 2] = b;
                c[(f + 4) >> 2] = (((b | 0) < 0) << 31) >> 31;
                break a;
              }
              case 14: {
                f = ((c[d >> 2] | 0) + (4 - 1)) & ~(4 - 1);
                b = c[f >> 2] | 0;
                c[d >> 2] = f + 4;
                f = a;
                c[f >> 2] = b & 65535;
                c[(f + 4) >> 2] = 0;
                break a;
              }
              case 15: {
                f = ((c[d >> 2] | 0) + (4 - 1)) & ~(4 - 1);
                b = c[f >> 2] | 0;
                c[d >> 2] = f + 4;
                b = ((b & 255) << 24) >> 24;
                f = a;
                c[f >> 2] = b;
                c[(f + 4) >> 2] = (((b | 0) < 0) << 31) >> 31;
                break a;
              }
              case 16: {
                f = ((c[d >> 2] | 0) + (4 - 1)) & ~(4 - 1);
                b = c[f >> 2] | 0;
                c[d >> 2] = f + 4;
                f = a;
                c[f >> 2] = b & 255;
                c[(f + 4) >> 2] = 0;
                break a;
              }
              case 17: {
                f = ((c[d >> 2] | 0) + (8 - 1)) & ~(8 - 1);
                h = +g[f >> 3];
                c[d >> 2] = f + 8;
                g[a >> 3] = h;
                break a;
              }
              case 18: {
                P[e & 1](a, d);
                break a;
              }
              default:
                break a;
            }
          while (0);
      while (0);
      return;
    }
    function Pa(b, c, e, f) {
      b = b | 0;
      c = c | 0;
      e = e | 0;
      f = f | 0;
      if (!(((b | 0) == 0) & ((c | 0) == 0)))
        do {
          e = (e + -1) | 0;
          a[e >> 0] = d[(480 + (b & 15)) >> 0] | 0 | f;
          b = kb(b | 0, c | 0, 4) | 0;
          c = v() | 0;
        } while (!(((b | 0) == 0) & ((c | 0) == 0)));
      return e | 0;
    }
    function Qa(b, c, d) {
      b = b | 0;
      c = c | 0;
      d = d | 0;
      if (!(((b | 0) == 0) & ((c | 0) == 0)))
        do {
          d = (d + -1) | 0;
          a[d >> 0] = (b & 7) | 48;
          b = kb(b | 0, c | 0, 3) | 0;
          c = v() | 0;
        } while (!(((b | 0) == 0) & ((c | 0) == 0)));
      return d | 0;
    }
    function Ra(b, c, d) {
      b = b | 0;
      c = c | 0;
      d = d | 0;
      var e = 0,
        f = 0,
        g = 0;
      if ((c >>> 0 > 0) | (((c | 0) == 0) & (b >>> 0 > 4294967295)))
        do {
          e = b;
          b = jb(b | 0, c | 0, 10, 0) | 0;
          f = c;
          c = v() | 0;
          g = eb(b | 0, c | 0, 10, 0) | 0;
          g = gb(e | 0, f | 0, g | 0, v() | 0) | 0;
          v() | 0;
          d = (d + -1) | 0;
          a[d >> 0] = (g & 255) | 48;
        } while ((f >>> 0 > 9) | (((f | 0) == 9) & (e >>> 0 > 4294967295)));
      if (b)
        do {
          g = b;
          b = ((b >>> 0) / 10) | 0;
          d = (d + -1) | 0;
          a[d >> 0] = (g - ((b * 10) | 0)) | 48;
        } while (g >>> 0 >= 10);
      return d | 0;
    }
    function Sa(b, d, e) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0,
        g = 0,
        h = 0,
        i = 0;
      h = d & 255;
      f = (e | 0) != 0;
      a: do
        if (f & (((b & 3) | 0) != 0)) {
          g = d & 255;
          while (1) {
            if ((a[b >> 0] | 0) == (g << 24) >> 24) {
              i = 6;
              break a;
            }
            b = (b + 1) | 0;
            e = (e + -1) | 0;
            f = (e | 0) != 0;
            if (!(f & (((b & 3) | 0) != 0))) {
              i = 5;
              break;
            }
          }
        } else i = 5;
      while (0);
      if ((i | 0) == 5)
        if (f) i = 6;
        else i = 16;
      b: do
        if ((i | 0) == 6) {
          g = d & 255;
          if ((a[b >> 0] | 0) == (g << 24) >> 24)
            if (!e) {
              i = 16;
              break;
            } else break;
          f = r(h, 16843009) | 0;
          c: do
            if (e >>> 0 > 3)
              while (1) {
                h = c[b >> 2] ^ f;
                if ((((h & -2139062144) ^ -2139062144) & (h + -16843009)) | 0)
                  break c;
                b = (b + 4) | 0;
                e = (e + -4) | 0;
                if (e >>> 0 <= 3) {
                  i = 11;
                  break;
                }
              }
            else i = 11;
          while (0);
          if ((i | 0) == 11)
            if (!e) {
              i = 16;
              break;
            }
          while (1) {
            if ((a[b >> 0] | 0) == (g << 24) >> 24) break b;
            e = (e + -1) | 0;
            if (!e) {
              i = 16;
              break;
            } else b = (b + 1) | 0;
          }
        }
      while (0);
      if ((i | 0) == 16) b = 0;
      return b | 0;
    }
    function Ta(a, b, c, d, e) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      d = d | 0;
      e = e | 0;
      var f = 0,
        g = 0;
      g = I;
      I = (I + 256) | 0;
      f = g;
      if (((c | 0) > (d | 0)) & (((e & 73728) | 0) == 0)) {
        e = (c - d) | 0;
        ob(f | 0, ((b << 24) >> 24) | 0, (e >>> 0 < 256 ? e : 256) | 0) | 0;
        if (e >>> 0 > 255) {
          b = (c - d) | 0;
          do {
            La(a, f, 256);
            e = (e + -256) | 0;
          } while (e >>> 0 > 255);
          e = b & 255;
        }
        La(a, f, e);
      }
      I = g;
      return;
    }
    function Ua(a, b) {
      a = a | 0;
      b = b | 0;
      if (!a) a = 0;
      else a = Va(a, b, 0) | 0;
      return a | 0;
    }
    function Va(b, d, e) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      do
        if (b) {
          if (d >>> 0 < 128) {
            a[b >> 0] = d;
            b = 1;
            break;
          }
          if (!(c[c[((Wa() | 0) + 188) >> 2] >> 2] | 0))
            if (((d & -128) | 0) == 57216) {
              a[b >> 0] = d;
              b = 1;
              break;
            } else {
              c[(Da() | 0) >> 2] = 84;
              b = -1;
              break;
            }
          if (d >>> 0 < 2048) {
            a[b >> 0] = (d >>> 6) | 192;
            a[(b + 1) >> 0] = (d & 63) | 128;
            b = 2;
            break;
          }
          if ((d >>> 0 < 55296) | (((d & -8192) | 0) == 57344)) {
            a[b >> 0] = (d >>> 12) | 224;
            a[(b + 1) >> 0] = ((d >>> 6) & 63) | 128;
            a[(b + 2) >> 0] = (d & 63) | 128;
            b = 3;
            break;
          }
          if (((d + -65536) | 0) >>> 0 < 1048576) {
            a[b >> 0] = (d >>> 18) | 240;
            a[(b + 1) >> 0] = ((d >>> 12) & 63) | 128;
            a[(b + 2) >> 0] = ((d >>> 6) & 63) | 128;
            a[(b + 3) >> 0] = (d & 63) | 128;
            b = 4;
            break;
          } else {
            c[(Da() | 0) >> 2] = 84;
            b = -1;
            break;
          }
        } else b = 1;
      while (0);
      return b | 0;
    }
    function Wa() {
      return Xa() | 0;
    }
    function Xa() {
      return 644;
    }
    function Ya(b, d, e) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0;
      g = (e + 16) | 0;
      f = c[g >> 2] | 0;
      if (!f)
        if (!(Za(e) | 0)) {
          f = c[g >> 2] | 0;
          h = 5;
        } else f = 0;
      else h = 5;
      a: do
        if ((h | 0) == 5) {
          j = (e + 20) | 0;
          i = c[j >> 2] | 0;
          g = i;
          if (((f - i) | 0) >>> 0 < d >>> 0) {
            f = N[c[(e + 36) >> 2] & 1](e, b, d) | 0;
            break;
          }
          b: do
            if (((a[(e + 75) >> 0] | 0) < 0) | ((d | 0) == 0)) {
              h = g;
              e = 0;
              g = d;
              f = b;
            } else {
              i = d;
              while (1) {
                f = (i + -1) | 0;
                if ((a[(b + f) >> 0] | 0) == 10) break;
                if (!f) {
                  h = g;
                  e = 0;
                  g = d;
                  f = b;
                  break b;
                } else i = f;
              }
              f = N[c[(e + 36) >> 2] & 1](e, b, i) | 0;
              if (f >>> 0 < i >>> 0) break a;
              h = c[j >> 2] | 0;
              e = i;
              g = (d - i) | 0;
              f = (b + i) | 0;
            }
          while (0);
          mb(h | 0, f | 0, g | 0) | 0;
          c[j >> 2] = (c[j >> 2] | 0) + g;
          f = (e + g) | 0;
        }
      while (0);
      return f | 0;
    }
    function Za(b) {
      b = b | 0;
      var d = 0,
        e = 0;
      d = (b + 74) | 0;
      e = a[d >> 0] | 0;
      a[d >> 0] = (e + 255) | e;
      d = c[b >> 2] | 0;
      if (!(d & 8)) {
        c[(b + 8) >> 2] = 0;
        c[(b + 4) >> 2] = 0;
        d = c[(b + 44) >> 2] | 0;
        c[(b + 28) >> 2] = d;
        c[(b + 20) >> 2] = d;
        c[(b + 16) >> 2] = d + (c[(b + 48) >> 2] | 0);
        d = 0;
      } else {
        c[b >> 2] = d | 32;
        d = -1;
      }
      return d | 0;
    }
    function _a(a) {
      a = +a;
      var b = 0;
      g[h >> 3] = a;
      b = c[h >> 2] | 0;
      u(c[(h + 4) >> 2] | 0);
      return b | 0;
    }
    function $a(a, b) {
      a = +a;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0;
      g[h >> 3] = a;
      d = c[h >> 2] | 0;
      e = c[(h + 4) >> 2] | 0;
      f = kb(d | 0, e | 0, 52) | 0;
      v() | 0;
      switch (f & 2047) {
        case 0: {
          if (a != 0.0) {
            a = +$a(a * 18446744073709551616.0, b);
            d = ((c[b >> 2] | 0) + -64) | 0;
          } else d = 0;
          c[b >> 2] = d;
          break;
        }
        case 2047:
          break;
        default: {
          c[b >> 2] = (f & 2047) + -1022;
          c[h >> 2] = d;
          c[(h + 4) >> 2] = (e & -2146435073) | 1071644672;
          a = +g[h >> 3];
        }
      }
      return +a;
    }
    function ab(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0;
      d = I;
      I = (I + 16) | 0;
      e = d;
      c[e >> 2] = b;
      b = Ea(c[160] | 0, a, e) | 0;
      I = d;
      return b | 0;
    }
    function bb(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0,
        t = 0,
        u = 0,
        v = 0,
        w = 0;
      w = I;
      I = (I + 16) | 0;
      n = w;
      do
        if (a >>> 0 < 245) {
          k = a >>> 0 < 11 ? 16 : (a + 11) & -8;
          a = k >>> 3;
          m = c[549] | 0;
          d = m >>> a;
          if ((d & 3) | 0) {
            e = (((d & 1) ^ 1) + a) | 0;
            f = (2236 + ((e << 1) << 2)) | 0;
            b = (f + 8) | 0;
            a = c[b >> 2] | 0;
            g = (a + 8) | 0;
            d = c[g >> 2] | 0;
            if ((d | 0) == (f | 0)) c[549] = m & ~(1 << e);
            else {
              c[(d + 12) >> 2] = f;
              c[b >> 2] = d;
            }
            v = e << 3;
            c[(a + 4) >> 2] = v | 3;
            v = (a + v + 4) | 0;
            c[v >> 2] = c[v >> 2] | 1;
            v = g;
            I = w;
            return v | 0;
          }
          l = c[551] | 0;
          if (k >>> 0 > l >>> 0) {
            if (d | 0) {
              i = 2 << a;
              d = (d << a) & (i | (0 - i));
              d = ((d & (0 - d)) + -1) | 0;
              i = (d >>> 12) & 16;
              d = d >>> i;
              a = (d >>> 5) & 8;
              d = d >>> a;
              g = (d >>> 2) & 4;
              d = d >>> g;
              b = (d >>> 1) & 2;
              d = d >>> b;
              e = (d >>> 1) & 1;
              e = ((a | i | g | b | e) + (d >>> e)) | 0;
              d = (2236 + ((e << 1) << 2)) | 0;
              b = (d + 8) | 0;
              g = c[b >> 2] | 0;
              i = (g + 8) | 0;
              a = c[i >> 2] | 0;
              if ((a | 0) == (d | 0)) {
                a = m & ~(1 << e);
                c[549] = a;
              } else {
                c[(a + 12) >> 2] = d;
                c[b >> 2] = a;
                a = m;
              }
              v = e << 3;
              h = (v - k) | 0;
              c[(g + 4) >> 2] = k | 3;
              f = (g + k) | 0;
              c[(f + 4) >> 2] = h | 1;
              c[(g + v) >> 2] = h;
              if (l | 0) {
                e = c[554] | 0;
                b = l >>> 3;
                d = (2236 + ((b << 1) << 2)) | 0;
                b = 1 << b;
                if (!(a & b)) {
                  c[549] = a | b;
                  b = (d + 8) | 0;
                  a = d;
                } else {
                  a = (d + 8) | 0;
                  b = a;
                  a = c[a >> 2] | 0;
                }
                c[b >> 2] = e;
                c[(a + 12) >> 2] = e;
                c[(e + 8) >> 2] = a;
                c[(e + 12) >> 2] = d;
              }
              c[551] = h;
              c[554] = f;
              v = i;
              I = w;
              return v | 0;
            }
            g = c[550] | 0;
            if (g) {
              i = ((g & (0 - g)) + -1) | 0;
              f = (i >>> 12) & 16;
              i = i >>> f;
              e = (i >>> 5) & 8;
              i = i >>> e;
              h = (i >>> 2) & 4;
              i = i >>> h;
              d = (i >>> 1) & 2;
              i = i >>> d;
              j = (i >>> 1) & 1;
              j = c[(2500 + (((e | f | h | d | j) + (i >>> j)) << 2)) >> 2] | 0;
              i = ((c[(j + 4) >> 2] & -8) - k) | 0;
              d = j;
              while (1) {
                a = c[(d + 16) >> 2] | 0;
                if (!a) {
                  a = c[(d + 20) >> 2] | 0;
                  if (!a) break;
                }
                d = ((c[(a + 4) >> 2] & -8) - k) | 0;
                h = d >>> 0 < i >>> 0;
                i = h ? d : i;
                d = a;
                j = h ? a : j;
              }
              h = (j + k) | 0;
              if (h >>> 0 > j >>> 0) {
                f = c[(j + 24) >> 2] | 0;
                b = c[(j + 12) >> 2] | 0;
                do
                  if ((b | 0) == (j | 0)) {
                    a = (j + 20) | 0;
                    b = c[a >> 2] | 0;
                    if (!b) {
                      a = (j + 16) | 0;
                      b = c[a >> 2] | 0;
                      if (!b) {
                        d = 0;
                        break;
                      }
                    }
                    while (1) {
                      e = (b + 20) | 0;
                      d = c[e >> 2] | 0;
                      if (!d) {
                        e = (b + 16) | 0;
                        d = c[e >> 2] | 0;
                        if (!d) break;
                        else {
                          b = d;
                          a = e;
                        }
                      } else {
                        b = d;
                        a = e;
                      }
                    }
                    c[a >> 2] = 0;
                    d = b;
                  } else {
                    d = c[(j + 8) >> 2] | 0;
                    c[(d + 12) >> 2] = b;
                    c[(b + 8) >> 2] = d;
                    d = b;
                  }
                while (0);
                do
                  if (f | 0) {
                    b = c[(j + 28) >> 2] | 0;
                    a = (2500 + (b << 2)) | 0;
                    if ((j | 0) == (c[a >> 2] | 0)) {
                      c[a >> 2] = d;
                      if (!d) {
                        c[550] = g & ~(1 << b);
                        break;
                      }
                    } else {
                      v = (f + 16) | 0;
                      c[((c[v >> 2] | 0) == (j | 0) ? v : (f + 20) | 0) >> 2] =
                        d;
                      if (!d) break;
                    }
                    c[(d + 24) >> 2] = f;
                    b = c[(j + 16) >> 2] | 0;
                    if (b | 0) {
                      c[(d + 16) >> 2] = b;
                      c[(b + 24) >> 2] = d;
                    }
                    b = c[(j + 20) >> 2] | 0;
                    if (b | 0) {
                      c[(d + 20) >> 2] = b;
                      c[(b + 24) >> 2] = d;
                    }
                  }
                while (0);
                if (i >>> 0 < 16) {
                  v = (i + k) | 0;
                  c[(j + 4) >> 2] = v | 3;
                  v = (j + v + 4) | 0;
                  c[v >> 2] = c[v >> 2] | 1;
                } else {
                  c[(j + 4) >> 2] = k | 3;
                  c[(h + 4) >> 2] = i | 1;
                  c[(h + i) >> 2] = i;
                  if (l | 0) {
                    e = c[554] | 0;
                    b = l >>> 3;
                    d = (2236 + ((b << 1) << 2)) | 0;
                    b = 1 << b;
                    if (!(b & m)) {
                      c[549] = b | m;
                      b = (d + 8) | 0;
                      a = d;
                    } else {
                      a = (d + 8) | 0;
                      b = a;
                      a = c[a >> 2] | 0;
                    }
                    c[b >> 2] = e;
                    c[(a + 12) >> 2] = e;
                    c[(e + 8) >> 2] = a;
                    c[(e + 12) >> 2] = d;
                  }
                  c[551] = i;
                  c[554] = h;
                }
                v = (j + 8) | 0;
                I = w;
                return v | 0;
              } else m = k;
            } else m = k;
          } else m = k;
        } else if (a >>> 0 <= 4294967231) {
          a = (a + 11) | 0;
          k = a & -8;
          e = c[550] | 0;
          if (e) {
            d = (0 - k) | 0;
            a = a >>> 8;
            if (a)
              if (k >>> 0 > 16777215) j = 31;
              else {
                m = (((a + 1048320) | 0) >>> 16) & 8;
                q = a << m;
                i = (((q + 520192) | 0) >>> 16) & 4;
                q = q << i;
                j = (((q + 245760) | 0) >>> 16) & 2;
                j = (14 - (i | m | j) + ((q << j) >>> 15)) | 0;
                j = ((k >>> ((j + 7) | 0)) & 1) | (j << 1);
              }
            else j = 0;
            a = c[(2500 + (j << 2)) >> 2] | 0;
            a: do
              if (!a) {
                f = 0;
                a = 0;
                q = 61;
              } else {
                f = 0;
                h = k << ((j | 0) == 31 ? 0 : (25 - (j >>> 1)) | 0);
                i = a;
                a = 0;
                while (1) {
                  g = ((c[(i + 4) >> 2] & -8) - k) | 0;
                  if (g >>> 0 < d >>> 0)
                    if (!g) {
                      d = 0;
                      f = i;
                      a = i;
                      q = 65;
                      break a;
                    } else {
                      d = g;
                      a = i;
                    }
                  q = c[(i + 20) >> 2] | 0;
                  i = c[(i + 16 + ((h >>> 31) << 2)) >> 2] | 0;
                  f = ((q | 0) == 0) | ((q | 0) == (i | 0)) ? f : q;
                  if (!i) {
                    q = 61;
                    break;
                  } else h = h << 1;
                }
              }
            while (0);
            if ((q | 0) == 61) {
              if (((f | 0) == 0) & ((a | 0) == 0)) {
                a = 2 << j;
                a = (a | (0 - a)) & e;
                if (!a) {
                  m = k;
                  break;
                }
                a = ((a & (0 - a)) + -1) | 0;
                i = (a >>> 12) & 16;
                a = a >>> i;
                h = (a >>> 5) & 8;
                a = a >>> h;
                j = (a >>> 2) & 4;
                a = a >>> j;
                m = (a >>> 1) & 2;
                a = a >>> m;
                f = (a >>> 1) & 1;
                f =
                  c[(2500 + (((h | i | j | m | f) + (a >>> f)) << 2)) >> 2] | 0;
                a = 0;
              }
              if (!f) {
                i = d;
                g = a;
              } else q = 65;
            }
            if ((q | 0) == 65)
              while (1) {
                m = ((c[(f + 4) >> 2] & -8) - k) | 0;
                g = m >>> 0 < d >>> 0;
                d = g ? m : d;
                g = g ? f : a;
                a = c[(f + 16) >> 2] | 0;
                if (!a) a = c[(f + 20) >> 2] | 0;
                if (!a) {
                  i = d;
                  break;
                } else {
                  f = a;
                  a = g;
                }
              }
            if (
              ((g | 0) != 0 ? i >>> 0 < (((c[551] | 0) - k) | 0) >>> 0 : 0)
                ? ((l = (g + k) | 0), l >>> 0 > g >>> 0)
                : 0
            ) {
              h = c[(g + 24) >> 2] | 0;
              b = c[(g + 12) >> 2] | 0;
              do
                if ((b | 0) == (g | 0)) {
                  a = (g + 20) | 0;
                  b = c[a >> 2] | 0;
                  if (!b) {
                    a = (g + 16) | 0;
                    b = c[a >> 2] | 0;
                    if (!b) {
                      b = 0;
                      break;
                    }
                  }
                  while (1) {
                    f = (b + 20) | 0;
                    d = c[f >> 2] | 0;
                    if (!d) {
                      f = (b + 16) | 0;
                      d = c[f >> 2] | 0;
                      if (!d) break;
                      else {
                        b = d;
                        a = f;
                      }
                    } else {
                      b = d;
                      a = f;
                    }
                  }
                  c[a >> 2] = 0;
                } else {
                  v = c[(g + 8) >> 2] | 0;
                  c[(v + 12) >> 2] = b;
                  c[(b + 8) >> 2] = v;
                }
              while (0);
              do
                if (h) {
                  a = c[(g + 28) >> 2] | 0;
                  d = (2500 + (a << 2)) | 0;
                  if ((g | 0) == (c[d >> 2] | 0)) {
                    c[d >> 2] = b;
                    if (!b) {
                      e = e & ~(1 << a);
                      c[550] = e;
                      break;
                    }
                  } else {
                    v = (h + 16) | 0;
                    c[((c[v >> 2] | 0) == (g | 0) ? v : (h + 20) | 0) >> 2] = b;
                    if (!b) break;
                  }
                  c[(b + 24) >> 2] = h;
                  a = c[(g + 16) >> 2] | 0;
                  if (a | 0) {
                    c[(b + 16) >> 2] = a;
                    c[(a + 24) >> 2] = b;
                  }
                  a = c[(g + 20) >> 2] | 0;
                  if (a) {
                    c[(b + 20) >> 2] = a;
                    c[(a + 24) >> 2] = b;
                  }
                }
              while (0);
              b: do
                if (i >>> 0 < 16) {
                  v = (i + k) | 0;
                  c[(g + 4) >> 2] = v | 3;
                  v = (g + v + 4) | 0;
                  c[v >> 2] = c[v >> 2] | 1;
                } else {
                  c[(g + 4) >> 2] = k | 3;
                  c[(l + 4) >> 2] = i | 1;
                  c[(l + i) >> 2] = i;
                  b = i >>> 3;
                  if (i >>> 0 < 256) {
                    d = (2236 + ((b << 1) << 2)) | 0;
                    a = c[549] | 0;
                    b = 1 << b;
                    if (!(a & b)) {
                      c[549] = a | b;
                      b = (d + 8) | 0;
                      a = d;
                    } else {
                      a = (d + 8) | 0;
                      b = a;
                      a = c[a >> 2] | 0;
                    }
                    c[b >> 2] = l;
                    c[(a + 12) >> 2] = l;
                    c[(l + 8) >> 2] = a;
                    c[(l + 12) >> 2] = d;
                    break;
                  }
                  b = i >>> 8;
                  if (b)
                    if (i >>> 0 > 16777215) d = 31;
                    else {
                      u = (((b + 1048320) | 0) >>> 16) & 8;
                      v = b << u;
                      t = (((v + 520192) | 0) >>> 16) & 4;
                      v = v << t;
                      d = (((v + 245760) | 0) >>> 16) & 2;
                      d = (14 - (t | u | d) + ((v << d) >>> 15)) | 0;
                      d = ((i >>> ((d + 7) | 0)) & 1) | (d << 1);
                    }
                  else d = 0;
                  b = (2500 + (d << 2)) | 0;
                  c[(l + 28) >> 2] = d;
                  a = (l + 16) | 0;
                  c[(a + 4) >> 2] = 0;
                  c[a >> 2] = 0;
                  a = 1 << d;
                  if (!(e & a)) {
                    c[550] = e | a;
                    c[b >> 2] = l;
                    c[(l + 24) >> 2] = b;
                    c[(l + 12) >> 2] = l;
                    c[(l + 8) >> 2] = l;
                    break;
                  }
                  b = c[b >> 2] | 0;
                  c: do
                    if (((c[(b + 4) >> 2] & -8) | 0) != (i | 0)) {
                      e = i << ((d | 0) == 31 ? 0 : (25 - (d >>> 1)) | 0);
                      while (1) {
                        d = (b + 16 + ((e >>> 31) << 2)) | 0;
                        a = c[d >> 2] | 0;
                        if (!a) break;
                        if (((c[(a + 4) >> 2] & -8) | 0) == (i | 0)) {
                          b = a;
                          break c;
                        } else {
                          e = e << 1;
                          b = a;
                        }
                      }
                      c[d >> 2] = l;
                      c[(l + 24) >> 2] = b;
                      c[(l + 12) >> 2] = l;
                      c[(l + 8) >> 2] = l;
                      break b;
                    }
                  while (0);
                  u = (b + 8) | 0;
                  v = c[u >> 2] | 0;
                  c[(v + 12) >> 2] = l;
                  c[u >> 2] = l;
                  c[(l + 8) >> 2] = v;
                  c[(l + 12) >> 2] = b;
                  c[(l + 24) >> 2] = 0;
                }
              while (0);
              v = (g + 8) | 0;
              I = w;
              return v | 0;
            } else m = k;
          } else m = k;
        } else m = -1;
      while (0);
      d = c[551] | 0;
      if (d >>> 0 >= m >>> 0) {
        a = (d - m) | 0;
        b = c[554] | 0;
        if (a >>> 0 > 15) {
          v = (b + m) | 0;
          c[554] = v;
          c[551] = a;
          c[(v + 4) >> 2] = a | 1;
          c[(b + d) >> 2] = a;
          c[(b + 4) >> 2] = m | 3;
        } else {
          c[551] = 0;
          c[554] = 0;
          c[(b + 4) >> 2] = d | 3;
          v = (b + d + 4) | 0;
          c[v >> 2] = c[v >> 2] | 1;
        }
        v = (b + 8) | 0;
        I = w;
        return v | 0;
      }
      h = c[552] | 0;
      if (h >>> 0 > m >>> 0) {
        t = (h - m) | 0;
        c[552] = t;
        v = c[555] | 0;
        u = (v + m) | 0;
        c[555] = u;
        c[(u + 4) >> 2] = t | 1;
        c[(v + 4) >> 2] = m | 3;
        v = (v + 8) | 0;
        I = w;
        return v | 0;
      }
      if (!(c[667] | 0)) {
        c[669] = 4096;
        c[668] = 4096;
        c[670] = -1;
        c[671] = -1;
        c[672] = 0;
        c[660] = 0;
        c[667] = (n & -16) ^ 1431655768;
        a = 4096;
      } else a = c[669] | 0;
      i = (m + 48) | 0;
      j = (m + 47) | 0;
      g = (a + j) | 0;
      e = (0 - a) | 0;
      k = g & e;
      if (k >>> 0 <= m >>> 0) {
        v = 0;
        I = w;
        return v | 0;
      }
      a = c[659] | 0;
      if (
        a | 0
          ? ((l = c[657] | 0),
            (n = (l + k) | 0),
            (n >>> 0 <= l >>> 0) | (n >>> 0 > a >>> 0))
          : 0
      ) {
        v = 0;
        I = w;
        return v | 0;
      }
      d: do
        if (!(c[660] & 4)) {
          d = c[555] | 0;
          e: do
            if (d) {
              f = 2644;
              while (1) {
                n = c[f >> 2] | 0;
                if (
                  n >>> 0 <= d >>> 0
                    ? ((n + (c[(f + 4) >> 2] | 0)) | 0) >>> 0 > d >>> 0
                    : 0
                )
                  break;
                a = c[(f + 8) >> 2] | 0;
                if (!a) {
                  q = 128;
                  break e;
                } else f = a;
              }
              b = (g - h) & e;
              if (b >>> 0 < 2147483647) {
                a = pb(b | 0) | 0;
                if (
                  (a | 0) ==
                  (((c[f >> 2] | 0) + (c[(f + 4) >> 2] | 0)) | 0)
                ) {
                  if ((a | 0) != (-1 | 0)) {
                    h = a;
                    g = b;
                    q = 145;
                    break d;
                  }
                } else {
                  e = a;
                  q = 136;
                }
              } else b = 0;
            } else q = 128;
          while (0);
          do
            if ((q | 0) == 128) {
              d = pb(0) | 0;
              if (
                (d | 0) != (-1 | 0)
                  ? ((b = d),
                    (o = c[668] | 0),
                    (p = (o + -1) | 0),
                    (b =
                      ((((p & b) | 0) == 0
                        ? 0
                        : (((p + b) & (0 - o)) - b) | 0) +
                        k) |
                      0),
                    (o = c[657] | 0),
                    (p = (b + o) | 0),
                    (b >>> 0 > m >>> 0) & (b >>> 0 < 2147483647))
                  : 0
              ) {
                n = c[659] | 0;
                if (n | 0 ? (p >>> 0 <= o >>> 0) | (p >>> 0 > n >>> 0) : 0) {
                  b = 0;
                  break;
                }
                a = pb(b | 0) | 0;
                if ((a | 0) == (d | 0)) {
                  h = d;
                  g = b;
                  q = 145;
                  break d;
                } else {
                  e = a;
                  q = 136;
                }
              } else b = 0;
            }
          while (0);
          do
            if ((q | 0) == 136) {
              d = (0 - b) | 0;
              if (
                !(
                  (i >>> 0 > b >>> 0) &
                  ((b >>> 0 < 2147483647) & ((e | 0) != (-1 | 0)))
                )
              )
                if ((e | 0) == (-1 | 0)) {
                  b = 0;
                  break;
                } else {
                  h = e;
                  g = b;
                  q = 145;
                  break d;
                }
              a = c[669] | 0;
              a = (j - b + a) & (0 - a);
              if (a >>> 0 >= 2147483647) {
                h = e;
                g = b;
                q = 145;
                break d;
              }
              if ((pb(a | 0) | 0) == (-1 | 0)) {
                pb(d | 0) | 0;
                b = 0;
                break;
              } else {
                h = e;
                g = (a + b) | 0;
                q = 145;
                break d;
              }
            }
          while (0);
          c[660] = c[660] | 4;
          q = 143;
        } else {
          b = 0;
          q = 143;
        }
      while (0);
      if (
        ((q | 0) == 143 ? k >>> 0 < 2147483647 : 0)
          ? ((r = pb(k | 0) | 0),
            (p = pb(0) | 0),
            (t = (p - r) | 0),
            (s = t >>> 0 > ((m + 40) | 0) >>> 0),
            !(
              ((r | 0) == (-1 | 0)) |
              (s ^ 1) |
              (((r >>> 0 < p >>> 0) &
                (((r | 0) != (-1 | 0)) & ((p | 0) != (-1 | 0)))) ^
                1)
            ))
          : 0
      ) {
        h = r;
        g = s ? t : b;
        q = 145;
      }
      if ((q | 0) == 145) {
        b = ((c[657] | 0) + g) | 0;
        c[657] = b;
        if (b >>> 0 > (c[658] | 0) >>> 0) c[658] = b;
        j = c[555] | 0;
        f: do
          if (j) {
            e = 2644;
            while (1) {
              b = c[e >> 2] | 0;
              a = c[(e + 4) >> 2] | 0;
              if ((h | 0) == ((b + a) | 0)) {
                q = 154;
                break;
              }
              d = c[(e + 8) >> 2] | 0;
              if (!d) break;
              else e = d;
            }
            if (
              (
                (q | 0) == 154
                  ? ((u = (e + 4) | 0), ((c[(e + 12) >> 2] & 8) | 0) == 0)
                  : 0
              )
                ? (h >>> 0 > j >>> 0) & (b >>> 0 <= j >>> 0)
                : 0
            ) {
              c[u >> 2] = a + g;
              v = ((c[552] | 0) + g) | 0;
              t = (j + 8) | 0;
              t = ((t & 7) | 0) == 0 ? 0 : (0 - t) & 7;
              u = (j + t) | 0;
              t = (v - t) | 0;
              c[555] = u;
              c[552] = t;
              c[(u + 4) >> 2] = t | 1;
              c[(j + v + 4) >> 2] = 40;
              c[556] = c[671];
              break;
            }
            if (h >>> 0 < (c[553] | 0) >>> 0) c[553] = h;
            d = (h + g) | 0;
            a = 2644;
            while (1) {
              if ((c[a >> 2] | 0) == (d | 0)) {
                q = 162;
                break;
              }
              b = c[(a + 8) >> 2] | 0;
              if (!b) break;
              else a = b;
            }
            if ((q | 0) == 162 ? ((c[(a + 12) >> 2] & 8) | 0) == 0 : 0) {
              c[a >> 2] = h;
              l = (a + 4) | 0;
              c[l >> 2] = (c[l >> 2] | 0) + g;
              l = (h + 8) | 0;
              l = (h + (((l & 7) | 0) == 0 ? 0 : (0 - l) & 7)) | 0;
              b = (d + 8) | 0;
              b = (d + (((b & 7) | 0) == 0 ? 0 : (0 - b) & 7)) | 0;
              k = (l + m) | 0;
              i = (b - l - m) | 0;
              c[(l + 4) >> 2] = m | 3;
              g: do
                if ((j | 0) == (b | 0)) {
                  v = ((c[552] | 0) + i) | 0;
                  c[552] = v;
                  c[555] = k;
                  c[(k + 4) >> 2] = v | 1;
                } else {
                  if ((c[554] | 0) == (b | 0)) {
                    v = ((c[551] | 0) + i) | 0;
                    c[551] = v;
                    c[554] = k;
                    c[(k + 4) >> 2] = v | 1;
                    c[(k + v) >> 2] = v;
                    break;
                  }
                  a = c[(b + 4) >> 2] | 0;
                  if (((a & 3) | 0) == 1) {
                    h = a & -8;
                    e = a >>> 3;
                    h: do
                      if (a >>> 0 < 256) {
                        a = c[(b + 8) >> 2] | 0;
                        d = c[(b + 12) >> 2] | 0;
                        if ((d | 0) == (a | 0)) {
                          c[549] = c[549] & ~(1 << e);
                          break;
                        } else {
                          c[(a + 12) >> 2] = d;
                          c[(d + 8) >> 2] = a;
                          break;
                        }
                      } else {
                        g = c[(b + 24) >> 2] | 0;
                        a = c[(b + 12) >> 2] | 0;
                        do
                          if ((a | 0) == (b | 0)) {
                            e = (b + 16) | 0;
                            d = (e + 4) | 0;
                            a = c[d >> 2] | 0;
                            if (!a) {
                              a = c[e >> 2] | 0;
                              if (!a) {
                                a = 0;
                                break;
                              } else d = e;
                            }
                            while (1) {
                              f = (a + 20) | 0;
                              e = c[f >> 2] | 0;
                              if (!e) {
                                f = (a + 16) | 0;
                                e = c[f >> 2] | 0;
                                if (!e) break;
                                else {
                                  a = e;
                                  d = f;
                                }
                              } else {
                                a = e;
                                d = f;
                              }
                            }
                            c[d >> 2] = 0;
                          } else {
                            v = c[(b + 8) >> 2] | 0;
                            c[(v + 12) >> 2] = a;
                            c[(a + 8) >> 2] = v;
                          }
                        while (0);
                        if (!g) break;
                        d = c[(b + 28) >> 2] | 0;
                        e = (2500 + (d << 2)) | 0;
                        do
                          if ((c[e >> 2] | 0) != (b | 0)) {
                            v = (g + 16) | 0;
                            c[
                              ((c[v >> 2] | 0) == (b | 0) ? v : (g + 20) | 0) >>
                                2
                            ] = a;
                            if (!a) break h;
                          } else {
                            c[e >> 2] = a;
                            if (a | 0) break;
                            c[550] = c[550] & ~(1 << d);
                            break h;
                          }
                        while (0);
                        c[(a + 24) >> 2] = g;
                        e = (b + 16) | 0;
                        d = c[e >> 2] | 0;
                        if (d | 0) {
                          c[(a + 16) >> 2] = d;
                          c[(d + 24) >> 2] = a;
                        }
                        d = c[(e + 4) >> 2] | 0;
                        if (!d) break;
                        c[(a + 20) >> 2] = d;
                        c[(d + 24) >> 2] = a;
                      }
                    while (0);
                    b = (b + h) | 0;
                    f = (h + i) | 0;
                  } else f = i;
                  b = (b + 4) | 0;
                  c[b >> 2] = c[b >> 2] & -2;
                  c[(k + 4) >> 2] = f | 1;
                  c[(k + f) >> 2] = f;
                  b = f >>> 3;
                  if (f >>> 0 < 256) {
                    d = (2236 + ((b << 1) << 2)) | 0;
                    a = c[549] | 0;
                    b = 1 << b;
                    if (!(a & b)) {
                      c[549] = a | b;
                      b = (d + 8) | 0;
                      a = d;
                    } else {
                      a = (d + 8) | 0;
                      b = a;
                      a = c[a >> 2] | 0;
                    }
                    c[b >> 2] = k;
                    c[(a + 12) >> 2] = k;
                    c[(k + 8) >> 2] = a;
                    c[(k + 12) >> 2] = d;
                    break;
                  }
                  b = f >>> 8;
                  do
                    if (!b) e = 0;
                    else {
                      if (f >>> 0 > 16777215) {
                        e = 31;
                        break;
                      }
                      u = (((b + 1048320) | 0) >>> 16) & 8;
                      v = b << u;
                      t = (((v + 520192) | 0) >>> 16) & 4;
                      v = v << t;
                      e = (((v + 245760) | 0) >>> 16) & 2;
                      e = (14 - (t | u | e) + ((v << e) >>> 15)) | 0;
                      e = ((f >>> ((e + 7) | 0)) & 1) | (e << 1);
                    }
                  while (0);
                  a = (2500 + (e << 2)) | 0;
                  c[(k + 28) >> 2] = e;
                  b = (k + 16) | 0;
                  c[(b + 4) >> 2] = 0;
                  c[b >> 2] = 0;
                  b = c[550] | 0;
                  d = 1 << e;
                  if (!(b & d)) {
                    c[550] = b | d;
                    c[a >> 2] = k;
                    c[(k + 24) >> 2] = a;
                    c[(k + 12) >> 2] = k;
                    c[(k + 8) >> 2] = k;
                    break;
                  }
                  b = c[a >> 2] | 0;
                  i: do
                    if (((c[(b + 4) >> 2] & -8) | 0) != (f | 0)) {
                      e = f << ((e | 0) == 31 ? 0 : (25 - (e >>> 1)) | 0);
                      while (1) {
                        d = (b + 16 + ((e >>> 31) << 2)) | 0;
                        a = c[d >> 2] | 0;
                        if (!a) break;
                        if (((c[(a + 4) >> 2] & -8) | 0) == (f | 0)) {
                          b = a;
                          break i;
                        } else {
                          e = e << 1;
                          b = a;
                        }
                      }
                      c[d >> 2] = k;
                      c[(k + 24) >> 2] = b;
                      c[(k + 12) >> 2] = k;
                      c[(k + 8) >> 2] = k;
                      break g;
                    }
                  while (0);
                  u = (b + 8) | 0;
                  v = c[u >> 2] | 0;
                  c[(v + 12) >> 2] = k;
                  c[u >> 2] = k;
                  c[(k + 8) >> 2] = v;
                  c[(k + 12) >> 2] = b;
                  c[(k + 24) >> 2] = 0;
                }
              while (0);
              v = (l + 8) | 0;
              I = w;
              return v | 0;
            }
            a = 2644;
            while (1) {
              b = c[a >> 2] | 0;
              if (
                b >>> 0 <= j >>> 0
                  ? ((v = (b + (c[(a + 4) >> 2] | 0)) | 0), v >>> 0 > j >>> 0)
                  : 0
              )
                break;
              a = c[(a + 8) >> 2] | 0;
            }
            f = (v + -47) | 0;
            a = (f + 8) | 0;
            a = (f + (((a & 7) | 0) == 0 ? 0 : (0 - a) & 7)) | 0;
            f = (j + 16) | 0;
            a = a >>> 0 < f >>> 0 ? j : a;
            b = (a + 8) | 0;
            d = (g + -40) | 0;
            t = (h + 8) | 0;
            t = ((t & 7) | 0) == 0 ? 0 : (0 - t) & 7;
            u = (h + t) | 0;
            t = (d - t) | 0;
            c[555] = u;
            c[552] = t;
            c[(u + 4) >> 2] = t | 1;
            c[(h + d + 4) >> 2] = 40;
            c[556] = c[671];
            d = (a + 4) | 0;
            c[d >> 2] = 27;
            c[b >> 2] = c[661];
            c[(b + 4) >> 2] = c[662];
            c[(b + 8) >> 2] = c[663];
            c[(b + 12) >> 2] = c[664];
            c[661] = h;
            c[662] = g;
            c[664] = 0;
            c[663] = b;
            b = (a + 24) | 0;
            do {
              u = b;
              b = (b + 4) | 0;
              c[b >> 2] = 7;
            } while (((u + 8) | 0) >>> 0 < v >>> 0);
            if ((a | 0) != (j | 0)) {
              g = (a - j) | 0;
              c[d >> 2] = c[d >> 2] & -2;
              c[(j + 4) >> 2] = g | 1;
              c[a >> 2] = g;
              b = g >>> 3;
              if (g >>> 0 < 256) {
                d = (2236 + ((b << 1) << 2)) | 0;
                a = c[549] | 0;
                b = 1 << b;
                if (!(a & b)) {
                  c[549] = a | b;
                  b = (d + 8) | 0;
                  a = d;
                } else {
                  a = (d + 8) | 0;
                  b = a;
                  a = c[a >> 2] | 0;
                }
                c[b >> 2] = j;
                c[(a + 12) >> 2] = j;
                c[(j + 8) >> 2] = a;
                c[(j + 12) >> 2] = d;
                break;
              }
              b = g >>> 8;
              if (b)
                if (g >>> 0 > 16777215) e = 31;
                else {
                  u = (((b + 1048320) | 0) >>> 16) & 8;
                  v = b << u;
                  t = (((v + 520192) | 0) >>> 16) & 4;
                  v = v << t;
                  e = (((v + 245760) | 0) >>> 16) & 2;
                  e = (14 - (t | u | e) + ((v << e) >>> 15)) | 0;
                  e = ((g >>> ((e + 7) | 0)) & 1) | (e << 1);
                }
              else e = 0;
              d = (2500 + (e << 2)) | 0;
              c[(j + 28) >> 2] = e;
              c[(j + 20) >> 2] = 0;
              c[f >> 2] = 0;
              b = c[550] | 0;
              a = 1 << e;
              if (!(b & a)) {
                c[550] = b | a;
                c[d >> 2] = j;
                c[(j + 24) >> 2] = d;
                c[(j + 12) >> 2] = j;
                c[(j + 8) >> 2] = j;
                break;
              }
              b = c[d >> 2] | 0;
              j: do
                if (((c[(b + 4) >> 2] & -8) | 0) != (g | 0)) {
                  e = g << ((e | 0) == 31 ? 0 : (25 - (e >>> 1)) | 0);
                  while (1) {
                    d = (b + 16 + ((e >>> 31) << 2)) | 0;
                    a = c[d >> 2] | 0;
                    if (!a) break;
                    if (((c[(a + 4) >> 2] & -8) | 0) == (g | 0)) {
                      b = a;
                      break j;
                    } else {
                      e = e << 1;
                      b = a;
                    }
                  }
                  c[d >> 2] = j;
                  c[(j + 24) >> 2] = b;
                  c[(j + 12) >> 2] = j;
                  c[(j + 8) >> 2] = j;
                  break f;
                }
              while (0);
              u = (b + 8) | 0;
              v = c[u >> 2] | 0;
              c[(v + 12) >> 2] = j;
              c[u >> 2] = j;
              c[(j + 8) >> 2] = v;
              c[(j + 12) >> 2] = b;
              c[(j + 24) >> 2] = 0;
            }
          } else {
            v = c[553] | 0;
            if (((v | 0) == 0) | (h >>> 0 < v >>> 0)) c[553] = h;
            c[661] = h;
            c[662] = g;
            c[664] = 0;
            c[558] = c[667];
            c[557] = -1;
            c[562] = 2236;
            c[561] = 2236;
            c[564] = 2244;
            c[563] = 2244;
            c[566] = 2252;
            c[565] = 2252;
            c[568] = 2260;
            c[567] = 2260;
            c[570] = 2268;
            c[569] = 2268;
            c[572] = 2276;
            c[571] = 2276;
            c[574] = 2284;
            c[573] = 2284;
            c[576] = 2292;
            c[575] = 2292;
            c[578] = 2300;
            c[577] = 2300;
            c[580] = 2308;
            c[579] = 2308;
            c[582] = 2316;
            c[581] = 2316;
            c[584] = 2324;
            c[583] = 2324;
            c[586] = 2332;
            c[585] = 2332;
            c[588] = 2340;
            c[587] = 2340;
            c[590] = 2348;
            c[589] = 2348;
            c[592] = 2356;
            c[591] = 2356;
            c[594] = 2364;
            c[593] = 2364;
            c[596] = 2372;
            c[595] = 2372;
            c[598] = 2380;
            c[597] = 2380;
            c[600] = 2388;
            c[599] = 2388;
            c[602] = 2396;
            c[601] = 2396;
            c[604] = 2404;
            c[603] = 2404;
            c[606] = 2412;
            c[605] = 2412;
            c[608] = 2420;
            c[607] = 2420;
            c[610] = 2428;
            c[609] = 2428;
            c[612] = 2436;
            c[611] = 2436;
            c[614] = 2444;
            c[613] = 2444;
            c[616] = 2452;
            c[615] = 2452;
            c[618] = 2460;
            c[617] = 2460;
            c[620] = 2468;
            c[619] = 2468;
            c[622] = 2476;
            c[621] = 2476;
            c[624] = 2484;
            c[623] = 2484;
            v = (g + -40) | 0;
            t = (h + 8) | 0;
            t = ((t & 7) | 0) == 0 ? 0 : (0 - t) & 7;
            u = (h + t) | 0;
            t = (v - t) | 0;
            c[555] = u;
            c[552] = t;
            c[(u + 4) >> 2] = t | 1;
            c[(h + v + 4) >> 2] = 40;
            c[556] = c[671];
          }
        while (0);
        b = c[552] | 0;
        if (b >>> 0 > m >>> 0) {
          t = (b - m) | 0;
          c[552] = t;
          v = c[555] | 0;
          u = (v + m) | 0;
          c[555] = u;
          c[(u + 4) >> 2] = t | 1;
          c[(v + 4) >> 2] = m | 3;
          v = (v + 8) | 0;
          I = w;
          return v | 0;
        }
      }
      c[(Da() | 0) >> 2] = 12;
      v = 0;
      I = w;
      return v | 0;
    }
    function cb(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0;
      if (!a) return;
      d = (a + -8) | 0;
      e = c[553] | 0;
      a = c[(a + -4) >> 2] | 0;
      b = a & -8;
      k = (d + b) | 0;
      do
        if (!(a & 1)) {
          f = c[d >> 2] | 0;
          if (!(a & 3)) return;
          g = (d + (0 - f)) | 0;
          h = (f + b) | 0;
          if (g >>> 0 < e >>> 0) return;
          if ((c[554] | 0) == (g | 0)) {
            b = (k + 4) | 0;
            a = c[b >> 2] | 0;
            if (((a & 3) | 0) != 3) {
              i = g;
              j = g;
              b = h;
              break;
            }
            c[551] = h;
            c[b >> 2] = a & -2;
            c[(g + 4) >> 2] = h | 1;
            c[(g + h) >> 2] = h;
            return;
          }
          d = f >>> 3;
          if (f >>> 0 < 256) {
            a = c[(g + 8) >> 2] | 0;
            b = c[(g + 12) >> 2] | 0;
            if ((b | 0) == (a | 0)) {
              c[549] = c[549] & ~(1 << d);
              i = g;
              j = g;
              b = h;
              break;
            } else {
              c[(a + 12) >> 2] = b;
              c[(b + 8) >> 2] = a;
              i = g;
              j = g;
              b = h;
              break;
            }
          }
          f = c[(g + 24) >> 2] | 0;
          a = c[(g + 12) >> 2] | 0;
          do
            if ((a | 0) == (g | 0)) {
              d = (g + 16) | 0;
              b = (d + 4) | 0;
              a = c[b >> 2] | 0;
              if (!a) {
                a = c[d >> 2] | 0;
                if (!a) {
                  d = 0;
                  break;
                } else b = d;
              }
              while (1) {
                e = (a + 20) | 0;
                d = c[e >> 2] | 0;
                if (!d) {
                  e = (a + 16) | 0;
                  d = c[e >> 2] | 0;
                  if (!d) break;
                  else {
                    a = d;
                    b = e;
                  }
                } else {
                  a = d;
                  b = e;
                }
              }
              c[b >> 2] = 0;
              d = a;
            } else {
              d = c[(g + 8) >> 2] | 0;
              c[(d + 12) >> 2] = a;
              c[(a + 8) >> 2] = d;
              d = a;
            }
          while (0);
          if (f) {
            a = c[(g + 28) >> 2] | 0;
            b = (2500 + (a << 2)) | 0;
            if ((c[b >> 2] | 0) == (g | 0)) {
              c[b >> 2] = d;
              if (!d) {
                c[550] = c[550] & ~(1 << a);
                i = g;
                j = g;
                b = h;
                break;
              }
            } else {
              j = (f + 16) | 0;
              c[((c[j >> 2] | 0) == (g | 0) ? j : (f + 20) | 0) >> 2] = d;
              if (!d) {
                i = g;
                j = g;
                b = h;
                break;
              }
            }
            c[(d + 24) >> 2] = f;
            b = (g + 16) | 0;
            a = c[b >> 2] | 0;
            if (a | 0) {
              c[(d + 16) >> 2] = a;
              c[(a + 24) >> 2] = d;
            }
            a = c[(b + 4) >> 2] | 0;
            if (a) {
              c[(d + 20) >> 2] = a;
              c[(a + 24) >> 2] = d;
              i = g;
              j = g;
              b = h;
            } else {
              i = g;
              j = g;
              b = h;
            }
          } else {
            i = g;
            j = g;
            b = h;
          }
        } else {
          i = d;
          j = d;
        }
      while (0);
      if (i >>> 0 >= k >>> 0) return;
      a = (k + 4) | 0;
      d = c[a >> 2] | 0;
      if (!(d & 1)) return;
      if (!(d & 2)) {
        if ((c[555] | 0) == (k | 0)) {
          k = ((c[552] | 0) + b) | 0;
          c[552] = k;
          c[555] = j;
          c[(j + 4) >> 2] = k | 1;
          if ((j | 0) != (c[554] | 0)) return;
          c[554] = 0;
          c[551] = 0;
          return;
        }
        if ((c[554] | 0) == (k | 0)) {
          k = ((c[551] | 0) + b) | 0;
          c[551] = k;
          c[554] = i;
          c[(j + 4) >> 2] = k | 1;
          c[(i + k) >> 2] = k;
          return;
        }
        f = ((d & -8) + b) | 0;
        e = d >>> 3;
        do
          if (d >>> 0 < 256) {
            b = c[(k + 8) >> 2] | 0;
            a = c[(k + 12) >> 2] | 0;
            if ((a | 0) == (b | 0)) {
              c[549] = c[549] & ~(1 << e);
              break;
            } else {
              c[(b + 12) >> 2] = a;
              c[(a + 8) >> 2] = b;
              break;
            }
          } else {
            g = c[(k + 24) >> 2] | 0;
            a = c[(k + 12) >> 2] | 0;
            do
              if ((a | 0) == (k | 0)) {
                d = (k + 16) | 0;
                b = (d + 4) | 0;
                a = c[b >> 2] | 0;
                if (!a) {
                  a = c[d >> 2] | 0;
                  if (!a) {
                    d = 0;
                    break;
                  } else b = d;
                }
                while (1) {
                  e = (a + 20) | 0;
                  d = c[e >> 2] | 0;
                  if (!d) {
                    e = (a + 16) | 0;
                    d = c[e >> 2] | 0;
                    if (!d) break;
                    else {
                      a = d;
                      b = e;
                    }
                  } else {
                    a = d;
                    b = e;
                  }
                }
                c[b >> 2] = 0;
                d = a;
              } else {
                d = c[(k + 8) >> 2] | 0;
                c[(d + 12) >> 2] = a;
                c[(a + 8) >> 2] = d;
                d = a;
              }
            while (0);
            if (g | 0) {
              a = c[(k + 28) >> 2] | 0;
              b = (2500 + (a << 2)) | 0;
              if ((c[b >> 2] | 0) == (k | 0)) {
                c[b >> 2] = d;
                if (!d) {
                  c[550] = c[550] & ~(1 << a);
                  break;
                }
              } else {
                h = (g + 16) | 0;
                c[((c[h >> 2] | 0) == (k | 0) ? h : (g + 20) | 0) >> 2] = d;
                if (!d) break;
              }
              c[(d + 24) >> 2] = g;
              b = (k + 16) | 0;
              a = c[b >> 2] | 0;
              if (a | 0) {
                c[(d + 16) >> 2] = a;
                c[(a + 24) >> 2] = d;
              }
              a = c[(b + 4) >> 2] | 0;
              if (a | 0) {
                c[(d + 20) >> 2] = a;
                c[(a + 24) >> 2] = d;
              }
            }
          }
        while (0);
        c[(j + 4) >> 2] = f | 1;
        c[(i + f) >> 2] = f;
        if ((j | 0) == (c[554] | 0)) {
          c[551] = f;
          return;
        }
      } else {
        c[a >> 2] = d & -2;
        c[(j + 4) >> 2] = b | 1;
        c[(i + b) >> 2] = b;
        f = b;
      }
      a = f >>> 3;
      if (f >>> 0 < 256) {
        d = (2236 + ((a << 1) << 2)) | 0;
        b = c[549] | 0;
        a = 1 << a;
        if (!(b & a)) {
          c[549] = b | a;
          a = (d + 8) | 0;
          b = d;
        } else {
          b = (d + 8) | 0;
          a = b;
          b = c[b >> 2] | 0;
        }
        c[a >> 2] = j;
        c[(b + 12) >> 2] = j;
        c[(j + 8) >> 2] = b;
        c[(j + 12) >> 2] = d;
        return;
      }
      a = f >>> 8;
      if (a)
        if (f >>> 0 > 16777215) e = 31;
        else {
          i = (((a + 1048320) | 0) >>> 16) & 8;
          k = a << i;
          h = (((k + 520192) | 0) >>> 16) & 4;
          k = k << h;
          e = (((k + 245760) | 0) >>> 16) & 2;
          e = (14 - (h | i | e) + ((k << e) >>> 15)) | 0;
          e = ((f >>> ((e + 7) | 0)) & 1) | (e << 1);
        }
      else e = 0;
      b = (2500 + (e << 2)) | 0;
      c[(j + 28) >> 2] = e;
      c[(j + 20) >> 2] = 0;
      c[(j + 16) >> 2] = 0;
      a = c[550] | 0;
      d = 1 << e;
      a: do
        if (!(a & d)) {
          c[550] = a | d;
          c[b >> 2] = j;
          c[(j + 24) >> 2] = b;
          c[(j + 12) >> 2] = j;
          c[(j + 8) >> 2] = j;
        } else {
          a = c[b >> 2] | 0;
          b: do
            if (((c[(a + 4) >> 2] & -8) | 0) != (f | 0)) {
              e = f << ((e | 0) == 31 ? 0 : (25 - (e >>> 1)) | 0);
              while (1) {
                d = (a + 16 + ((e >>> 31) << 2)) | 0;
                b = c[d >> 2] | 0;
                if (!b) break;
                if (((c[(b + 4) >> 2] & -8) | 0) == (f | 0)) {
                  a = b;
                  break b;
                } else {
                  e = e << 1;
                  a = b;
                }
              }
              c[d >> 2] = j;
              c[(j + 24) >> 2] = a;
              c[(j + 12) >> 2] = j;
              c[(j + 8) >> 2] = j;
              break a;
            }
          while (0);
          i = (a + 8) | 0;
          k = c[i >> 2] | 0;
          c[(k + 12) >> 2] = j;
          c[i >> 2] = j;
          c[(j + 8) >> 2] = k;
          c[(j + 12) >> 2] = a;
          c[(j + 24) >> 2] = 0;
        }
      while (0);
      k = ((c[557] | 0) + -1) | 0;
      c[557] = k;
      if (k | 0) return;
      a = 2652;
      while (1) {
        a = c[a >> 2] | 0;
        if (!a) break;
        else a = (a + 8) | 0;
      }
      c[557] = -1;
      return;
    }
    function db(a, b) {
      a = a | 0;
      b = b | 0;
      var c = 0,
        d = 0,
        e = 0,
        f = 0;
      f = a & 65535;
      e = b & 65535;
      c = r(e, f) | 0;
      d = a >>> 16;
      a = ((c >>> 16) + (r(e, d) | 0)) | 0;
      e = b >>> 16;
      b = r(e, f) | 0;
      return (
        (u(((a >>> 16) + (r(e, d) | 0) + ((((a & 65535) + b) | 0) >>> 16)) | 0),
        ((a + b) << 16) | (c & 65535) | 0) | 0
      );
    }
    function eb(a, b, c, d) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      e = a;
      f = c;
      c = db(e, f) | 0;
      a = v() | 0;
      return (
        (u(((r(b, f) | 0) + (r(d, e) | 0) + a) | (a & 0) | 0), c | 0 | 0) | 0
      );
    }
    function fb(a, b, c, d) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      d = d | 0;
      c = (a + c) >>> 0;
      return (u(((b + d + ((c >>> 0 < a >>> 0) | 0)) >>> 0) | 0), c | 0) | 0;
    }
    function gb(a, b, c, d) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      d = d | 0;
      d = (b - d - ((c >>> 0 > a >>> 0) | 0)) >>> 0;
      return (u(d | 0), ((a - c) >>> 0) | 0) | 0;
    }
    function hb(a) {
      a = a | 0;
      return (a ? (31 - (s(a ^ (a - 1)) | 0)) | 0 : 32) | 0;
    }
    function ib(a, b, d, e, f) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      var g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0;
      l = a;
      j = b;
      k = j;
      h = d;
      n = e;
      i = n;
      if (!k) {
        g = (f | 0) != 0;
        if (!i) {
          if (g) {
            c[f >> 2] = (l >>> 0) % (h >>> 0);
            c[(f + 4) >> 2] = 0;
          }
          n = 0;
          f = ((l >>> 0) / (h >>> 0)) >>> 0;
          return (u(n | 0), f) | 0;
        } else {
          if (!g) {
            n = 0;
            f = 0;
            return (u(n | 0), f) | 0;
          }
          c[f >> 2] = a | 0;
          c[(f + 4) >> 2] = b & 0;
          n = 0;
          f = 0;
          return (u(n | 0), f) | 0;
        }
      }
      g = (i | 0) == 0;
      do
        if (h) {
          if (!g) {
            g = ((s(i | 0) | 0) - (s(k | 0) | 0)) | 0;
            if (g >>> 0 <= 31) {
              m = (g + 1) | 0;
              i = (31 - g) | 0;
              b = (g - 31) >> 31;
              h = m;
              a = ((l >>> (m >>> 0)) & b) | (k << i);
              b = (k >>> (m >>> 0)) & b;
              g = 0;
              i = l << i;
              break;
            }
            if (!f) {
              n = 0;
              f = 0;
              return (u(n | 0), f) | 0;
            }
            c[f >> 2] = a | 0;
            c[(f + 4) >> 2] = j | (b & 0);
            n = 0;
            f = 0;
            return (u(n | 0), f) | 0;
          }
          g = (h - 1) | 0;
          if ((g & h) | 0) {
            i = ((s(h | 0) | 0) + 33 - (s(k | 0) | 0)) | 0;
            p = (64 - i) | 0;
            m = (32 - i) | 0;
            j = m >> 31;
            o = (i - 32) | 0;
            b = o >> 31;
            h = i;
            a =
              (((m - 1) >> 31) & (k >>> (o >>> 0))) |
              (((k << m) | (l >>> (i >>> 0))) & b);
            b = b & (k >>> (i >>> 0));
            g = (l << p) & j;
            i =
              (((k << p) | (l >>> (o >>> 0))) & j) |
              ((l << m) & ((i - 33) >> 31));
            break;
          }
          if (f | 0) {
            c[f >> 2] = g & l;
            c[(f + 4) >> 2] = 0;
          }
          if ((h | 0) == 1) {
            o = j | (b & 0);
            p = a | 0 | 0;
            return (u(o | 0), p) | 0;
          } else {
            p = hb(h | 0) | 0;
            o = (k >>> (p >>> 0)) | 0;
            p = (k << (32 - p)) | (l >>> (p >>> 0)) | 0;
            return (u(o | 0), p) | 0;
          }
        } else {
          if (g) {
            if (f | 0) {
              c[f >> 2] = (k >>> 0) % (h >>> 0);
              c[(f + 4) >> 2] = 0;
            }
            o = 0;
            p = ((k >>> 0) / (h >>> 0)) >>> 0;
            return (u(o | 0), p) | 0;
          }
          if (!l) {
            if (f | 0) {
              c[f >> 2] = 0;
              c[(f + 4) >> 2] = (k >>> 0) % (i >>> 0);
            }
            o = 0;
            p = ((k >>> 0) / (i >>> 0)) >>> 0;
            return (u(o | 0), p) | 0;
          }
          g = (i - 1) | 0;
          if (!(g & i)) {
            if (f | 0) {
              c[f >> 2] = a | 0;
              c[(f + 4) >> 2] = (g & k) | (b & 0);
            }
            o = 0;
            p = k >>> ((hb(i | 0) | 0) >>> 0);
            return (u(o | 0), p) | 0;
          }
          g = ((s(i | 0) | 0) - (s(k | 0) | 0)) | 0;
          if (g >>> 0 <= 30) {
            b = (g + 1) | 0;
            i = (31 - g) | 0;
            h = b;
            a = (k << i) | (l >>> (b >>> 0));
            b = k >>> (b >>> 0);
            g = 0;
            i = l << i;
            break;
          }
          if (!f) {
            o = 0;
            p = 0;
            return (u(o | 0), p) | 0;
          }
          c[f >> 2] = a | 0;
          c[(f + 4) >> 2] = j | (b & 0);
          o = 0;
          p = 0;
          return (u(o | 0), p) | 0;
        }
      while (0);
      if (!h) {
        k = i;
        j = 0;
        i = 0;
      } else {
        m = d | 0 | 0;
        l = n | (e & 0);
        k = fb(m | 0, l | 0, -1, -1) | 0;
        d = v() | 0;
        j = i;
        i = 0;
        do {
          e = j;
          j = (g >>> 31) | (j << 1);
          g = i | (g << 1);
          e = (a << 1) | (e >>> 31) | 0;
          n = (a >>> 31) | (b << 1) | 0;
          gb(k | 0, d | 0, e | 0, n | 0) | 0;
          p = v() | 0;
          o = (p >> 31) | (((p | 0) < 0 ? -1 : 0) << 1);
          i = o & 1;
          a =
            gb(
              e | 0,
              n | 0,
              (o & m) | 0,
              (((((p | 0) < 0 ? -1 : 0) >> 31) |
                (((p | 0) < 0 ? -1 : 0) << 1)) &
                l) |
                0
            ) | 0;
          b = v() | 0;
          h = (h - 1) | 0;
        } while ((h | 0) != 0);
        k = j;
        j = 0;
      }
      h = 0;
      if (f | 0) {
        c[f >> 2] = a;
        c[(f + 4) >> 2] = b;
      }
      o = ((g | 0) >>> 31) | ((k | h) << 1) | (((h << 1) | (g >>> 31)) & 0) | j;
      p = (((g << 1) | (0 >>> 31)) & -2) | i;
      return (u(o | 0), p) | 0;
    }
    function jb(a, b, c, d) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      d = d | 0;
      return ib(a, b, c, d, 0) | 0;
    }
    function kb(a, b, c) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      if ((c | 0) < 32) {
        u((b >>> c) | 0);
        return (a >>> c) | ((b & ((1 << c) - 1)) << (32 - c));
      }
      u(0);
      return (b >>> (c - 32)) | 0;
    }
    function lb(a, b, c) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      if ((c | 0) < 32) {
        u((b << c) | ((a & (((1 << c) - 1) << (32 - c))) >>> (32 - c)) | 0);
        return a << c;
      }
      u((a << (c - 32)) | 0);
      return 0;
    }
    function mb(b, d, e) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0,
        g = 0,
        h = 0;
      if ((e | 0) >= 8192) {
        z(b | 0, d | 0, e | 0) | 0;
        return b | 0;
      }
      h = b | 0;
      g = (b + e) | 0;
      if ((b & 3) == (d & 3)) {
        while (b & 3) {
          if (!e) return h | 0;
          a[b >> 0] = a[d >> 0] | 0;
          b = (b + 1) | 0;
          d = (d + 1) | 0;
          e = (e - 1) | 0;
        }
        e = (g & -4) | 0;
        f = (e - 64) | 0;
        while ((b | 0) <= (f | 0)) {
          c[b >> 2] = c[d >> 2];
          c[(b + 4) >> 2] = c[(d + 4) >> 2];
          c[(b + 8) >> 2] = c[(d + 8) >> 2];
          c[(b + 12) >> 2] = c[(d + 12) >> 2];
          c[(b + 16) >> 2] = c[(d + 16) >> 2];
          c[(b + 20) >> 2] = c[(d + 20) >> 2];
          c[(b + 24) >> 2] = c[(d + 24) >> 2];
          c[(b + 28) >> 2] = c[(d + 28) >> 2];
          c[(b + 32) >> 2] = c[(d + 32) >> 2];
          c[(b + 36) >> 2] = c[(d + 36) >> 2];
          c[(b + 40) >> 2] = c[(d + 40) >> 2];
          c[(b + 44) >> 2] = c[(d + 44) >> 2];
          c[(b + 48) >> 2] = c[(d + 48) >> 2];
          c[(b + 52) >> 2] = c[(d + 52) >> 2];
          c[(b + 56) >> 2] = c[(d + 56) >> 2];
          c[(b + 60) >> 2] = c[(d + 60) >> 2];
          b = (b + 64) | 0;
          d = (d + 64) | 0;
        }
        while ((b | 0) < (e | 0)) {
          c[b >> 2] = c[d >> 2];
          b = (b + 4) | 0;
          d = (d + 4) | 0;
        }
      } else {
        e = (g - 4) | 0;
        while ((b | 0) < (e | 0)) {
          a[b >> 0] = a[d >> 0] | 0;
          a[(b + 1) >> 0] = a[(d + 1) >> 0] | 0;
          a[(b + 2) >> 0] = a[(d + 2) >> 0] | 0;
          a[(b + 3) >> 0] = a[(d + 3) >> 0] | 0;
          b = (b + 4) | 0;
          d = (d + 4) | 0;
        }
      }
      while ((b | 0) < (g | 0)) {
        a[b >> 0] = a[d >> 0] | 0;
        b = (b + 1) | 0;
        d = (d + 1) | 0;
      }
      return h | 0;
    }
    function nb(b, c, d) {
      b = b | 0;
      c = c | 0;
      d = d | 0;
      var e = 0;
      if (((c | 0) < (b | 0)) & ((b | 0) < ((c + d) | 0))) {
        e = b;
        c = (c + d) | 0;
        b = (b + d) | 0;
        while ((d | 0) > 0) {
          b = (b - 1) | 0;
          c = (c - 1) | 0;
          d = (d - 1) | 0;
          a[b >> 0] = a[c >> 0] | 0;
        }
        b = e;
      } else mb(b, c, d) | 0;
      return b | 0;
    }
    function ob(b, d, e) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0,
        g = 0,
        h = 0,
        i = 0;
      h = (b + e) | 0;
      d = d & 255;
      if ((e | 0) >= 67) {
        while (b & 3) {
          a[b >> 0] = d;
          b = (b + 1) | 0;
        }
        f = (h & -4) | 0;
        i = d | (d << 8) | (d << 16) | (d << 24);
        g = (f - 64) | 0;
        while ((b | 0) <= (g | 0)) {
          c[b >> 2] = i;
          c[(b + 4) >> 2] = i;
          c[(b + 8) >> 2] = i;
          c[(b + 12) >> 2] = i;
          c[(b + 16) >> 2] = i;
          c[(b + 20) >> 2] = i;
          c[(b + 24) >> 2] = i;
          c[(b + 28) >> 2] = i;
          c[(b + 32) >> 2] = i;
          c[(b + 36) >> 2] = i;
          c[(b + 40) >> 2] = i;
          c[(b + 44) >> 2] = i;
          c[(b + 48) >> 2] = i;
          c[(b + 52) >> 2] = i;
          c[(b + 56) >> 2] = i;
          c[(b + 60) >> 2] = i;
          b = (b + 64) | 0;
        }
        while ((b | 0) < (f | 0)) {
          c[b >> 2] = i;
          b = (b + 4) | 0;
        }
      }
      while ((b | 0) < (h | 0)) {
        a[b >> 0] = d;
        b = (b + 1) | 0;
      }
      return (h - e) | 0;
    }
    function pb(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0;
      e = y() | 0;
      d = c[i >> 2] | 0;
      b = (d + a) | 0;
      if ((((a | 0) > 0) & ((b | 0) < (d | 0))) | ((b | 0) < 0)) {
        C(b | 0) | 0;
        w(12);
        return -1;
      }
      if ((b | 0) > (e | 0))
        if (!(A(b | 0) | 0)) {
          w(12);
          return -1;
        }
      c[i >> 2] = b;
      return d | 0;
    }
    function qb(a, b) {
      a = a | 0;
      b = b | 0;
      return L[a & 1](b | 0) | 0;
    }
    function rb(a, b, c, d, e, f, g) {
      a = a | 0;
      b = b | 0;
      c = +c;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      g = g | 0;
      return M[a & 1](b | 0, +c, d | 0, e | 0, f | 0, g | 0) | 0;
    }
    function sb(a, b, c, d) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      d = d | 0;
      return N[a & 1](b | 0, c | 0, d | 0) | 0;
    }
    function tb(a, b, c, d, e) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      d = d | 0;
      e = e | 0;
      return O[a & 1](b | 0, c | 0, d | 0, e | 0) | 0;
    }
    function ub(a, b, c) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      P[a & 1](b | 0, c | 0);
    }
    function vb(a) {
      a = a | 0;
      t(0);
      return 0;
    }
    function wb(a, b, c, d, e, f) {
      a = a | 0;
      b = +b;
      c = c | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      t(1);
      return 0;
    }
    function xb(a, b, c) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      t(2);
      return 0;
    }
    function yb(a, b, c, d) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      d = d | 0;
      t(3);
      return 0;
    }
    function zb(a, b) {
      a = a | 0;
      b = b | 0;
      t(4);
    }

    // EMSCRIPTEN_END_FUNCS
    var L = [vb, Aa];
    var M = [wb, Fa];
    var N = [xb, Ba];
    var O = [yb, Ca];
    var P = [zb, Ga];
    return {
      ___errno_location: Da,
      ___muldi3: eb,
      ___udivdi3: jb,
      _bitshift64Lshr: kb,
      _bitshift64Shl: lb,
      _compress: U,
      _decompress: V,
      _free: cb,
      _i64Add: fb,
      _i64Subtract: gb,
      _malloc: bb,
      _memcpy: mb,
      _memmove: nb,
      _memset: ob,
      _sbrk: pb,
      dynCall_ii: qb,
      dynCall_iidiiii: rb,
      dynCall_iiii: sb,
      dynCall_iiiii: tb,
      dynCall_vii: ub,
      establishStackSpace: T,
      stackAlloc: Q,
      stackRestore: S,
      stackSave: R,
    };
  })(
    // EMSCRIPTEN_END_ASM
    asmGlobalArg,
    asmLibraryArg,
    buffer
  );
  var ___errno_location = (Module["___errno_location"] =
    asm["___errno_location"]);
  var ___muldi3 = (Module["___muldi3"] = asm["___muldi3"]);
  var ___udivdi3 = (Module["___udivdi3"] = asm["___udivdi3"]);
  var _bitshift64Lshr = (Module["_bitshift64Lshr"] = asm["_bitshift64Lshr"]);
  var _bitshift64Shl = (Module["_bitshift64Shl"] = asm["_bitshift64Shl"]);
  var _compress = (Module["_compress"] = asm["_compress"]);
  var _decompress = (Module["_decompress"] = asm["_decompress"]);
  var _free = (Module["_free"] = asm["_free"]);
  var _i64Add = (Module["_i64Add"] = asm["_i64Add"]);
  var _i64Subtract = (Module["_i64Subtract"] = asm["_i64Subtract"]);
  var _malloc = (Module["_malloc"] = asm["_malloc"]);
  var _memcpy = (Module["_memcpy"] = asm["_memcpy"]);
  var _memmove = (Module["_memmove"] = asm["_memmove"]);
  var _memset = (Module["_memset"] = asm["_memset"]);
  var _sbrk = (Module["_sbrk"] = asm["_sbrk"]);
  var establishStackSpace = (Module["establishStackSpace"] =
    asm["establishStackSpace"]);
  var stackAlloc = (Module["stackAlloc"] = asm["stackAlloc"]);
  var stackRestore = (Module["stackRestore"] = asm["stackRestore"]);
  var stackSave = (Module["stackSave"] = asm["stackSave"]);
  var dynCall_ii = (Module["dynCall_ii"] = asm["dynCall_ii"]);
  var dynCall_iidiiii = (Module["dynCall_iidiiii"] = asm["dynCall_iidiiii"]);
  var dynCall_iiii = (Module["dynCall_iiii"] = asm["dynCall_iiii"]);
  var dynCall_iiiii = (Module["dynCall_iiiii"] = asm["dynCall_iiiii"]);
  var dynCall_vii = (Module["dynCall_vii"] = asm["dynCall_vii"]);
  Module["asm"] = asm;
  Module["ccall"] = ccall;
  if (memoryInitializer) {
    if (!isDataURI(memoryInitializer)) {
      memoryInitializer = locateFile(memoryInitializer);
    }
    if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
      var data = readBinary(memoryInitializer);
      HEAPU8.set(data, GLOBAL_BASE);
    } else {
      addRunDependency("memory initializer");
      var applyMemoryInitializer = function (data) {
        if (data.byteLength) data = new Uint8Array(data);
        HEAPU8.set(data, GLOBAL_BASE);
        if (Module["memoryInitializerRequest"])
          delete Module["memoryInitializerRequest"].response;
        removeRunDependency("memory initializer");
      };
      var doBrowserLoad = function () {
        readAsync(memoryInitializer, applyMemoryInitializer, function () {
          throw "could not load memory initializer " + memoryInitializer;
        });
      };
      var memoryInitializerBytes = tryParseAsDataURI(memoryInitializer);
      if (memoryInitializerBytes) {
        applyMemoryInitializer(memoryInitializerBytes.buffer);
      } else if (Module["memoryInitializerRequest"]) {
        var useRequest = function () {
          var request = Module["memoryInitializerRequest"];
          var response = request.response;
          if (request.status !== 200 && request.status !== 0) {
            var data = tryParseAsDataURI(Module["memoryInitializerRequestURL"]);
            if (data) {
              response = data.buffer;
            } else {
              console.warn(
                "a problem seems to have happened with Module.memoryInitializerRequest, status: " +
                  request.status +
                  ", retrying " +
                  memoryInitializer
              );
              doBrowserLoad();
              return;
            }
          }
          applyMemoryInitializer(response);
        };
        if (Module["memoryInitializerRequest"].response) {
          setTimeout(useRequest, 0);
        } else {
          Module["memoryInitializerRequest"].addEventListener(
            "load",
            useRequest
          );
        }
      } else {
        doBrowserLoad();
      }
    }
  }
  var calledRun;
  function ExitStatus(status) {
    this.name = "ExitStatus";
    this.message = "Program terminated with exit(" + status + ")";
    this.status = status;
  }
  dependenciesFulfilled = function runCaller() {
    if (!calledRun) run();
    if (!calledRun) dependenciesFulfilled = runCaller;
  };
  function run(args) {
    args = args || arguments_;
    if (runDependencies > 0) {
      return;
    }
    preRun();
    if (runDependencies > 0) return;
    function doRun() {
      if (calledRun) return;
      calledRun = true;
      if (ABORT) return;
      initRuntime();
      preMain();
      if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
      postRun();
    }
    if (Module["setStatus"]) {
      Module["setStatus"]("Running...");
      setTimeout(function () {
        setTimeout(function () {
          Module["setStatus"]("");
        }, 1);
        doRun();
      }, 1);
    } else {
      doRun();
    }
  }
  Module["run"] = run;
  function abort(what) {
    if (Module["onAbort"]) {
      Module["onAbort"](what);
    }
    what += "";
    out(what);
    err(what);
    ABORT = true;
    EXITSTATUS = 1;
    throw "abort(" + what + "). Build with -s ASSERTIONS=1 for more info.";
  }
  Module["abort"] = abort;
  if (Module["preInit"]) {
    if (typeof Module["preInit"] == "function")
      Module["preInit"] = [Module["preInit"]];
    while (Module["preInit"].length > 0) {
      Module["preInit"].pop()();
    }
  }
  noExitRuntime = true;
  run();

  var HS_LOG_LEVEL = 0;

  function heatshrink_compress(inputBuffer) {
    if (inputBuffer.BYTES_PER_ELEMENT != 1)
      throw new Error("Expecting Byte Array");
    var input_size = inputBuffer.length;
    var output_size = input_size + input_size / 2 + 4;

    var bufIn = Module._malloc(input_size);
    Module.HEAPU8.set(inputBuffer, bufIn);
    // int compress(uint8_t *input, uint32_t input_size, uint8_t *output, uint32_t output_size, int log_lvl)
    output_size =
      Module.ccall(
        "compress",
        "number",
        ["number", "number", "number", "number", "number"],
        [bufIn, input_size, 0, 0, HS_LOG_LEVEL /*log level*/]
      ) + 1;
    var bufOut = Module._malloc(output_size);
    output_size = Module.ccall(
      "compress",
      "number",
      ["number", "number", "number", "number", "number"],
      [bufIn, input_size, bufOut, output_size, HS_LOG_LEVEL /*log level*/]
    );
    // console.log("Compressed to "+output_size);

    var outputBuffer = new Uint8Array(output_size);
    for (var i = 0; i < output_size; i++)
      outputBuffer[i] = Module.HEAPU8[bufOut + i];

    Module._free(bufIn);
    Module._free(bufOut);

    return outputBuffer;
  }

  function heatshrink_decompress(inputBuffer) {
    if (inputBuffer.BYTES_PER_ELEMENT != 1)
      throw new Error("Expecting Byte Array");
    var input_size = inputBuffer.length;
    var output_size = input_size + input_size / 2 + 4;

    var bufIn = Module._malloc(input_size);
    Module.HEAPU8.set(inputBuffer, bufIn);
    // int compress(uint8_t *input, uint32_t input_size, uint8_t *output, uint32_t output_size, int log_lvl)
    output_size =
      Module.ccall(
        "decompress",
        "number",
        ["number", "number", "number", "number", "number"],
        [bufIn, input_size, 0, 0, HS_LOG_LEVEL /*log level*/]
      ) + 1;
    var bufOut = Module._malloc(output_size);
    output_size = Module.ccall(
      "decompress",
      "number",
      ["number", "number", "number", "number", "number"],
      [bufIn, input_size, bufOut, output_size, HS_LOG_LEVEL /*log level*/]
    );
    // console.log("Compressed to "+output_size);

    var outputBuffer = new Uint8Array(output_size);
    for (var i = 0; i < output_size; i++)
      outputBuffer[i] = Module.HEAPU8[bufOut + i];

    Module._free(bufIn);
    Module._free(bufOut);

    return outputBuffer;
  }

  return {
    compress: heatshrink_compress,
    decompress: heatshrink_decompress,
  };
});
