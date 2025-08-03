/* empty css                       */
import { r as requireAos, g as getDefaultExportFromCjs, a as gsapWithCSS } from "../chunks/chunk-BODwLEOT.js";
(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  return Constructor;
}
/*!
 * Observer 3.13.0
 * https://gsap.com
 *
 * @license Copyright 2008-2025, GreenSock. All rights reserved.
 * Subject to the terms at https://gsap.com/standard-license
 * @author: Jack Doyle, jack@greensock.com
*/
var gsap$1, _coreInitted$1, _win$1, _doc$1, _docEl$1, _body$1, _isTouch, _pointerType, ScrollTrigger$1, _root$1, _normalizer$1, _eventTypes, _context$1, _getGSAP$1 = function _getGSAP2() {
  return gsap$1 || typeof window !== "undefined" && (gsap$1 = window.gsap) && gsap$1.registerPlugin && gsap$1;
}, _startup$1 = 1, _observers = [], _scrollers = [], _proxies = [], _getTime$1 = Date.now, _bridge = function _bridge2(name, value) {
  return value;
}, _integrate = function _integrate2() {
  var core = ScrollTrigger$1.core, data = core.bridge || {}, scrollers = core._scrollers, proxies = core._proxies;
  scrollers.push.apply(scrollers, _scrollers);
  proxies.push.apply(proxies, _proxies);
  _scrollers = scrollers;
  _proxies = proxies;
  _bridge = function _bridge3(name, value) {
    return data[name](value);
  };
}, _getProxyProp = function _getProxyProp2(element, property) {
  return ~_proxies.indexOf(element) && _proxies[_proxies.indexOf(element) + 1][property];
}, _isViewport$1 = function _isViewport2(el) {
  return !!~_root$1.indexOf(el);
}, _addListener$1 = function _addListener2(element, type, func, passive, capture) {
  return element.addEventListener(type, func, {
    passive: passive !== false,
    capture: !!capture
  });
}, _removeListener$1 = function _removeListener2(element, type, func, capture) {
  return element.removeEventListener(type, func, !!capture);
}, _scrollLeft = "scrollLeft", _scrollTop = "scrollTop", _onScroll$1 = function _onScroll2() {
  return _normalizer$1 && _normalizer$1.isPressed || _scrollers.cache++;
}, _scrollCacheFunc = function _scrollCacheFunc2(f, doNotCache) {
  var cachingFunc = function cachingFunc2(value) {
    if (value || value === 0) {
      _startup$1 && (_win$1.history.scrollRestoration = "manual");
      var isNormalizing = _normalizer$1 && _normalizer$1.isPressed;
      value = cachingFunc2.v = Math.round(value) || (_normalizer$1 && _normalizer$1.iOS ? 1 : 0);
      f(value);
      cachingFunc2.cacheID = _scrollers.cache;
      isNormalizing && _bridge("ss", value);
    } else if (doNotCache || _scrollers.cache !== cachingFunc2.cacheID || _bridge("ref")) {
      cachingFunc2.cacheID = _scrollers.cache;
      cachingFunc2.v = f();
    }
    return cachingFunc2.v + cachingFunc2.offset;
  };
  cachingFunc.offset = 0;
  return f && cachingFunc;
}, _horizontal = {
  s: _scrollLeft,
  p: "left",
  p2: "Left",
  os: "right",
  os2: "Right",
  d: "width",
  d2: "Width",
  a: "x",
  sc: _scrollCacheFunc(function(value) {
    return arguments.length ? _win$1.scrollTo(value, _vertical.sc()) : _win$1.pageXOffset || _doc$1[_scrollLeft] || _docEl$1[_scrollLeft] || _body$1[_scrollLeft] || 0;
  })
}, _vertical = {
  s: _scrollTop,
  p: "top",
  p2: "Top",
  os: "bottom",
  os2: "Bottom",
  d: "height",
  d2: "Height",
  a: "y",
  op: _horizontal,
  sc: _scrollCacheFunc(function(value) {
    return arguments.length ? _win$1.scrollTo(_horizontal.sc(), value) : _win$1.pageYOffset || _doc$1[_scrollTop] || _docEl$1[_scrollTop] || _body$1[_scrollTop] || 0;
  })
}, _getTarget = function _getTarget2(t, self) {
  return (self && self._ctx && self._ctx.selector || gsap$1.utils.toArray)(t)[0] || (typeof t === "string" && gsap$1.config().nullTargetWarn !== false ? console.warn("Element not found:", t) : null);
}, _isWithin = function _isWithin2(element, list) {
  var i = list.length;
  while (i--) {
    if (list[i] === element || list[i].contains(element)) {
      return true;
    }
  }
  return false;
}, _getScrollFunc = function _getScrollFunc2(element, _ref) {
  var s = _ref.s, sc = _ref.sc;
  _isViewport$1(element) && (element = _doc$1.scrollingElement || _docEl$1);
  var i = _scrollers.indexOf(element), offset = sc === _vertical.sc ? 1 : 2;
  !~i && (i = _scrollers.push(element) - 1);
  _scrollers[i + offset] || _addListener$1(element, "scroll", _onScroll$1);
  var prev = _scrollers[i + offset], func = prev || (_scrollers[i + offset] = _scrollCacheFunc(_getProxyProp(element, s), true) || (_isViewport$1(element) ? sc : _scrollCacheFunc(function(value) {
    return arguments.length ? element[s] = value : element[s];
  })));
  func.target = element;
  prev || (func.smooth = gsap$1.getProperty(element, "scrollBehavior") === "smooth");
  return func;
}, _getVelocityProp = function _getVelocityProp2(value, minTimeRefresh, useDelta) {
  var v1 = value, v2 = value, t1 = _getTime$1(), t2 = t1, min = minTimeRefresh || 50, dropToZeroTime = Math.max(500, min * 3), update = function update2(value2, force) {
    var t = _getTime$1();
    if (force || t - t1 > min) {
      v2 = v1;
      v1 = value2;
      t2 = t1;
      t1 = t;
    } else if (useDelta) {
      v1 += value2;
    } else {
      v1 = v2 + (value2 - v2) / (t - t2) * (t1 - t2);
    }
  }, reset = function reset2() {
    v2 = v1 = useDelta ? 0 : v1;
    t2 = t1 = 0;
  }, getVelocity = function getVelocity2(latestValue) {
    var tOld = t2, vOld = v2, t = _getTime$1();
    (latestValue || latestValue === 0) && latestValue !== v1 && update(latestValue);
    return t1 === t2 || t - t2 > dropToZeroTime ? 0 : (v1 + (useDelta ? vOld : -vOld)) / ((useDelta ? t : t1) - tOld) * 1e3;
  };
  return {
    update,
    reset,
    getVelocity
  };
}, _getEvent = function _getEvent2(e, preventDefault) {
  preventDefault && !e._gsapAllow && e.preventDefault();
  return e.changedTouches ? e.changedTouches[0] : e;
}, _getAbsoluteMax = function _getAbsoluteMax2(a) {
  var max = Math.max.apply(Math, a), min = Math.min.apply(Math, a);
  return Math.abs(max) >= Math.abs(min) ? max : min;
}, _setScrollTrigger = function _setScrollTrigger2() {
  ScrollTrigger$1 = gsap$1.core.globals().ScrollTrigger;
  ScrollTrigger$1 && ScrollTrigger$1.core && _integrate();
}, _initCore = function _initCore2(core) {
  gsap$1 = core || _getGSAP$1();
  if (!_coreInitted$1 && gsap$1 && typeof document !== "undefined" && document.body) {
    _win$1 = window;
    _doc$1 = document;
    _docEl$1 = _doc$1.documentElement;
    _body$1 = _doc$1.body;
    _root$1 = [_win$1, _doc$1, _docEl$1, _body$1];
    gsap$1.utils.clamp;
    _context$1 = gsap$1.core.context || function() {
    };
    _pointerType = "onpointerenter" in _body$1 ? "pointer" : "mouse";
    _isTouch = Observer.isTouch = _win$1.matchMedia && _win$1.matchMedia("(hover: none), (pointer: coarse)").matches ? 1 : "ontouchstart" in _win$1 || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0 ? 2 : 0;
    _eventTypes = Observer.eventTypes = ("ontouchstart" in _docEl$1 ? "touchstart,touchmove,touchcancel,touchend" : !("onpointerdown" in _docEl$1) ? "mousedown,mousemove,mouseup,mouseup" : "pointerdown,pointermove,pointercancel,pointerup").split(",");
    setTimeout(function() {
      return _startup$1 = 0;
    }, 500);
    _setScrollTrigger();
    _coreInitted$1 = 1;
  }
  return _coreInitted$1;
};
_horizontal.op = _vertical;
_scrollers.cache = 0;
var Observer = /* @__PURE__ */ function() {
  function Observer2(vars) {
    this.init(vars);
  }
  var _proto = Observer2.prototype;
  _proto.init = function init(vars) {
    _coreInitted$1 || _initCore(gsap$1) || console.warn("Please gsap.registerPlugin(Observer)");
    ScrollTrigger$1 || _setScrollTrigger();
    var tolerance = vars.tolerance, dragMinimum = vars.dragMinimum, type = vars.type, target = vars.target, lineHeight = vars.lineHeight, debounce = vars.debounce, preventDefault = vars.preventDefault, onStop = vars.onStop, onStopDelay = vars.onStopDelay, ignore = vars.ignore, wheelSpeed = vars.wheelSpeed, event = vars.event, onDragStart = vars.onDragStart, onDragEnd = vars.onDragEnd, onDrag = vars.onDrag, onPress = vars.onPress, onRelease = vars.onRelease, onRight = vars.onRight, onLeft = vars.onLeft, onUp = vars.onUp, onDown = vars.onDown, onChangeX = vars.onChangeX, onChangeY = vars.onChangeY, onChange = vars.onChange, onToggleX = vars.onToggleX, onToggleY = vars.onToggleY, onHover = vars.onHover, onHoverEnd = vars.onHoverEnd, onMove = vars.onMove, ignoreCheck = vars.ignoreCheck, isNormalizer = vars.isNormalizer, onGestureStart = vars.onGestureStart, onGestureEnd = vars.onGestureEnd, onWheel = vars.onWheel, onEnable = vars.onEnable, onDisable = vars.onDisable, onClick = vars.onClick, scrollSpeed = vars.scrollSpeed, capture = vars.capture, allowClicks = vars.allowClicks, lockAxis = vars.lockAxis, onLockAxis = vars.onLockAxis;
    this.target = target = _getTarget(target) || _docEl$1;
    this.vars = vars;
    ignore && (ignore = gsap$1.utils.toArray(ignore));
    tolerance = tolerance || 1e-9;
    dragMinimum = dragMinimum || 0;
    wheelSpeed = wheelSpeed || 1;
    scrollSpeed = scrollSpeed || 1;
    type = type || "wheel,touch,pointer";
    debounce = debounce !== false;
    lineHeight || (lineHeight = parseFloat(_win$1.getComputedStyle(_body$1).lineHeight) || 22);
    var id, onStopDelayedCall, dragged, moved, wheeled, locked, axis, self = this, prevDeltaX = 0, prevDeltaY = 0, passive = vars.passive || !preventDefault && vars.passive !== false, scrollFuncX = _getScrollFunc(target, _horizontal), scrollFuncY = _getScrollFunc(target, _vertical), scrollX = scrollFuncX(), scrollY = scrollFuncY(), limitToTouch = ~type.indexOf("touch") && !~type.indexOf("pointer") && _eventTypes[0] === "pointerdown", isViewport = _isViewport$1(target), ownerDoc = target.ownerDocument || _doc$1, deltaX = [0, 0, 0], deltaY = [0, 0, 0], onClickTime = 0, clickCapture = function clickCapture2() {
      return onClickTime = _getTime$1();
    }, _ignoreCheck = function _ignoreCheck2(e, isPointerOrTouch) {
      return (self.event = e) && ignore && _isWithin(e.target, ignore) || isPointerOrTouch && limitToTouch && e.pointerType !== "touch" || ignoreCheck && ignoreCheck(e, isPointerOrTouch);
    }, onStopFunc = function onStopFunc2() {
      self._vx.reset();
      self._vy.reset();
      onStopDelayedCall.pause();
      onStop && onStop(self);
    }, update = function update2() {
      var dx = self.deltaX = _getAbsoluteMax(deltaX), dy = self.deltaY = _getAbsoluteMax(deltaY), changedX = Math.abs(dx) >= tolerance, changedY = Math.abs(dy) >= tolerance;
      onChange && (changedX || changedY) && onChange(self, dx, dy, deltaX, deltaY);
      if (changedX) {
        onRight && self.deltaX > 0 && onRight(self);
        onLeft && self.deltaX < 0 && onLeft(self);
        onChangeX && onChangeX(self);
        onToggleX && self.deltaX < 0 !== prevDeltaX < 0 && onToggleX(self);
        prevDeltaX = self.deltaX;
        deltaX[0] = deltaX[1] = deltaX[2] = 0;
      }
      if (changedY) {
        onDown && self.deltaY > 0 && onDown(self);
        onUp && self.deltaY < 0 && onUp(self);
        onChangeY && onChangeY(self);
        onToggleY && self.deltaY < 0 !== prevDeltaY < 0 && onToggleY(self);
        prevDeltaY = self.deltaY;
        deltaY[0] = deltaY[1] = deltaY[2] = 0;
      }
      if (moved || dragged) {
        onMove && onMove(self);
        if (dragged) {
          onDragStart && dragged === 1 && onDragStart(self);
          onDrag && onDrag(self);
          dragged = 0;
        }
        moved = false;
      }
      locked && !(locked = false) && onLockAxis && onLockAxis(self);
      if (wheeled) {
        onWheel(self);
        wheeled = false;
      }
      id = 0;
    }, onDelta = function onDelta2(x, y, index) {
      deltaX[index] += x;
      deltaY[index] += y;
      self._vx.update(x);
      self._vy.update(y);
      debounce ? id || (id = requestAnimationFrame(update)) : update();
    }, onTouchOrPointerDelta = function onTouchOrPointerDelta2(x, y) {
      if (lockAxis && !axis) {
        self.axis = axis = Math.abs(x) > Math.abs(y) ? "x" : "y";
        locked = true;
      }
      if (axis !== "y") {
        deltaX[2] += x;
        self._vx.update(x, true);
      }
      if (axis !== "x") {
        deltaY[2] += y;
        self._vy.update(y, true);
      }
      debounce ? id || (id = requestAnimationFrame(update)) : update();
    }, _onDrag = function _onDrag2(e) {
      if (_ignoreCheck(e, 1)) {
        return;
      }
      e = _getEvent(e, preventDefault);
      var x = e.clientX, y = e.clientY, dx = x - self.x, dy = y - self.y, isDragging = self.isDragging;
      self.x = x;
      self.y = y;
      if (isDragging || (dx || dy) && (Math.abs(self.startX - x) >= dragMinimum || Math.abs(self.startY - y) >= dragMinimum)) {
        dragged = isDragging ? 2 : 1;
        isDragging || (self.isDragging = true);
        onTouchOrPointerDelta(dx, dy);
      }
    }, _onPress = self.onPress = function(e) {
      if (_ignoreCheck(e, 1) || e && e.button) {
        return;
      }
      self.axis = axis = null;
      onStopDelayedCall.pause();
      self.isPressed = true;
      e = _getEvent(e);
      prevDeltaX = prevDeltaY = 0;
      self.startX = self.x = e.clientX;
      self.startY = self.y = e.clientY;
      self._vx.reset();
      self._vy.reset();
      _addListener$1(isNormalizer ? target : ownerDoc, _eventTypes[1], _onDrag, passive, true);
      self.deltaX = self.deltaY = 0;
      onPress && onPress(self);
    }, _onRelease = self.onRelease = function(e) {
      if (_ignoreCheck(e, 1)) {
        return;
      }
      _removeListener$1(isNormalizer ? target : ownerDoc, _eventTypes[1], _onDrag, true);
      var isTrackingDrag = !isNaN(self.y - self.startY), wasDragging = self.isDragging, isDragNotClick = wasDragging && (Math.abs(self.x - self.startX) > 3 || Math.abs(self.y - self.startY) > 3), eventData = _getEvent(e);
      if (!isDragNotClick && isTrackingDrag) {
        self._vx.reset();
        self._vy.reset();
        if (preventDefault && allowClicks) {
          gsap$1.delayedCall(0.08, function() {
            if (_getTime$1() - onClickTime > 300 && !e.defaultPrevented) {
              if (e.target.click) {
                e.target.click();
              } else if (ownerDoc.createEvent) {
                var syntheticEvent = ownerDoc.createEvent("MouseEvents");
                syntheticEvent.initMouseEvent("click", true, true, _win$1, 1, eventData.screenX, eventData.screenY, eventData.clientX, eventData.clientY, false, false, false, false, 0, null);
                e.target.dispatchEvent(syntheticEvent);
              }
            }
          });
        }
      }
      self.isDragging = self.isGesturing = self.isPressed = false;
      onStop && wasDragging && !isNormalizer && onStopDelayedCall.restart(true);
      dragged && update();
      onDragEnd && wasDragging && onDragEnd(self);
      onRelease && onRelease(self, isDragNotClick);
    }, _onGestureStart = function _onGestureStart2(e) {
      return e.touches && e.touches.length > 1 && (self.isGesturing = true) && onGestureStart(e, self.isDragging);
    }, _onGestureEnd = function _onGestureEnd2() {
      return (self.isGesturing = false) || onGestureEnd(self);
    }, onScroll = function onScroll2(e) {
      if (_ignoreCheck(e)) {
        return;
      }
      var x = scrollFuncX(), y = scrollFuncY();
      onDelta((x - scrollX) * scrollSpeed, (y - scrollY) * scrollSpeed, 1);
      scrollX = x;
      scrollY = y;
      onStop && onStopDelayedCall.restart(true);
    }, _onWheel = function _onWheel2(e) {
      if (_ignoreCheck(e)) {
        return;
      }
      e = _getEvent(e, preventDefault);
      onWheel && (wheeled = true);
      var multiplier = (e.deltaMode === 1 ? lineHeight : e.deltaMode === 2 ? _win$1.innerHeight : 1) * wheelSpeed;
      onDelta(e.deltaX * multiplier, e.deltaY * multiplier, 0);
      onStop && !isNormalizer && onStopDelayedCall.restart(true);
    }, _onMove = function _onMove2(e) {
      if (_ignoreCheck(e)) {
        return;
      }
      var x = e.clientX, y = e.clientY, dx = x - self.x, dy = y - self.y;
      self.x = x;
      self.y = y;
      moved = true;
      onStop && onStopDelayedCall.restart(true);
      (dx || dy) && onTouchOrPointerDelta(dx, dy);
    }, _onHover = function _onHover2(e) {
      self.event = e;
      onHover(self);
    }, _onHoverEnd = function _onHoverEnd2(e) {
      self.event = e;
      onHoverEnd(self);
    }, _onClick = function _onClick2(e) {
      return _ignoreCheck(e) || _getEvent(e, preventDefault) && onClick(self);
    };
    onStopDelayedCall = self._dc = gsap$1.delayedCall(onStopDelay || 0.25, onStopFunc).pause();
    self.deltaX = self.deltaY = 0;
    self._vx = _getVelocityProp(0, 50, true);
    self._vy = _getVelocityProp(0, 50, true);
    self.scrollX = scrollFuncX;
    self.scrollY = scrollFuncY;
    self.isDragging = self.isGesturing = self.isPressed = false;
    _context$1(this);
    self.enable = function(e) {
      if (!self.isEnabled) {
        _addListener$1(isViewport ? ownerDoc : target, "scroll", _onScroll$1);
        type.indexOf("scroll") >= 0 && _addListener$1(isViewport ? ownerDoc : target, "scroll", onScroll, passive, capture);
        type.indexOf("wheel") >= 0 && _addListener$1(target, "wheel", _onWheel, passive, capture);
        if (type.indexOf("touch") >= 0 && _isTouch || type.indexOf("pointer") >= 0) {
          _addListener$1(target, _eventTypes[0], _onPress, passive, capture);
          _addListener$1(ownerDoc, _eventTypes[2], _onRelease);
          _addListener$1(ownerDoc, _eventTypes[3], _onRelease);
          allowClicks && _addListener$1(target, "click", clickCapture, true, true);
          onClick && _addListener$1(target, "click", _onClick);
          onGestureStart && _addListener$1(ownerDoc, "gesturestart", _onGestureStart);
          onGestureEnd && _addListener$1(ownerDoc, "gestureend", _onGestureEnd);
          onHover && _addListener$1(target, _pointerType + "enter", _onHover);
          onHoverEnd && _addListener$1(target, _pointerType + "leave", _onHoverEnd);
          onMove && _addListener$1(target, _pointerType + "move", _onMove);
        }
        self.isEnabled = true;
        self.isDragging = self.isGesturing = self.isPressed = moved = dragged = false;
        self._vx.reset();
        self._vy.reset();
        scrollX = scrollFuncX();
        scrollY = scrollFuncY();
        e && e.type && _onPress(e);
        onEnable && onEnable(self);
      }
      return self;
    };
    self.disable = function() {
      if (self.isEnabled) {
        _observers.filter(function(o) {
          return o !== self && _isViewport$1(o.target);
        }).length || _removeListener$1(isViewport ? ownerDoc : target, "scroll", _onScroll$1);
        if (self.isPressed) {
          self._vx.reset();
          self._vy.reset();
          _removeListener$1(isNormalizer ? target : ownerDoc, _eventTypes[1], _onDrag, true);
        }
        _removeListener$1(isViewport ? ownerDoc : target, "scroll", onScroll, capture);
        _removeListener$1(target, "wheel", _onWheel, capture);
        _removeListener$1(target, _eventTypes[0], _onPress, capture);
        _removeListener$1(ownerDoc, _eventTypes[2], _onRelease);
        _removeListener$1(ownerDoc, _eventTypes[3], _onRelease);
        _removeListener$1(target, "click", clickCapture, true);
        _removeListener$1(target, "click", _onClick);
        _removeListener$1(ownerDoc, "gesturestart", _onGestureStart);
        _removeListener$1(ownerDoc, "gestureend", _onGestureEnd);
        _removeListener$1(target, _pointerType + "enter", _onHover);
        _removeListener$1(target, _pointerType + "leave", _onHoverEnd);
        _removeListener$1(target, _pointerType + "move", _onMove);
        self.isEnabled = self.isPressed = self.isDragging = false;
        onDisable && onDisable(self);
      }
    };
    self.kill = self.revert = function() {
      self.disable();
      var i = _observers.indexOf(self);
      i >= 0 && _observers.splice(i, 1);
      _normalizer$1 === self && (_normalizer$1 = 0);
    };
    _observers.push(self);
    isNormalizer && _isViewport$1(target) && (_normalizer$1 = self);
    self.enable(event);
  };
  _createClass(Observer2, [{
    key: "velocityX",
    get: function get() {
      return this._vx.getVelocity();
    }
  }, {
    key: "velocityY",
    get: function get() {
      return this._vy.getVelocity();
    }
  }]);
  return Observer2;
}();
Observer.version = "3.13.0";
Observer.create = function(vars) {
  return new Observer(vars);
};
Observer.register = _initCore;
Observer.getAll = function() {
  return _observers.slice();
};
Observer.getById = function(id) {
  return _observers.filter(function(o) {
    return o.vars.id === id;
  })[0];
};
_getGSAP$1() && gsap$1.registerPlugin(Observer);
/*!
 * ScrollTrigger 3.13.0
 * https://gsap.com
 *
 * @license Copyright 2008-2025, GreenSock. All rights reserved.
 * Subject to the terms at https://gsap.com/standard-license
 * @author: Jack Doyle, jack@greensock.com
*/
var gsap, _coreInitted, _win, _doc, _docEl, _body, _root, _resizeDelay, _toArray, _clamp, _time2, _syncInterval, _refreshing, _pointerIsDown, _transformProp, _i, _prevWidth, _prevHeight, _autoRefresh, _sort, _suppressOverwrites, _ignoreResize, _normalizer, _ignoreMobileResize, _baseScreenHeight, _baseScreenWidth, _fixIOSBug, _context, _scrollRestoration, _div100vh, _100vh, _isReverted, _clampingMax, _limitCallbacks, _startup = 1, _getTime = Date.now, _time1 = _getTime(), _lastScrollTime = 0, _enabled = 0, _parseClamp = function _parseClamp2(value, type, self) {
  var clamp = _isString(value) && (value.substr(0, 6) === "clamp(" || value.indexOf("max") > -1);
  self["_" + type + "Clamp"] = clamp;
  return clamp ? value.substr(6, value.length - 7) : value;
}, _keepClamp = function _keepClamp2(value, clamp) {
  return clamp && (!_isString(value) || value.substr(0, 6) !== "clamp(") ? "clamp(" + value + ")" : value;
}, _rafBugFix = function _rafBugFix2() {
  return _enabled && requestAnimationFrame(_rafBugFix2);
}, _pointerDownHandler = function _pointerDownHandler2() {
  return _pointerIsDown = 1;
}, _pointerUpHandler = function _pointerUpHandler2() {
  return _pointerIsDown = 0;
}, _passThrough = function _passThrough2(v) {
  return v;
}, _round = function _round2(value) {
  return Math.round(value * 1e5) / 1e5 || 0;
}, _windowExists = function _windowExists2() {
  return typeof window !== "undefined";
}, _getGSAP = function _getGSAP22() {
  return gsap || _windowExists() && (gsap = window.gsap) && gsap.registerPlugin && gsap;
}, _isViewport = function _isViewport22(e) {
  return !!~_root.indexOf(e);
}, _getViewportDimension = function _getViewportDimension2(dimensionProperty) {
  return (dimensionProperty === "Height" ? _100vh : _win["inner" + dimensionProperty]) || _docEl["client" + dimensionProperty] || _body["client" + dimensionProperty];
}, _getBoundsFunc = function _getBoundsFunc2(element) {
  return _getProxyProp(element, "getBoundingClientRect") || (_isViewport(element) ? function() {
    _winOffsets.width = _win.innerWidth;
    _winOffsets.height = _100vh;
    return _winOffsets;
  } : function() {
    return _getBounds(element);
  });
}, _getSizeFunc = function _getSizeFunc2(scroller, isViewport, _ref) {
  var d = _ref.d, d2 = _ref.d2, a = _ref.a;
  return (a = _getProxyProp(scroller, "getBoundingClientRect")) ? function() {
    return a()[d];
  } : function() {
    return (isViewport ? _getViewportDimension(d2) : scroller["client" + d2]) || 0;
  };
}, _getOffsetsFunc = function _getOffsetsFunc2(element, isViewport) {
  return !isViewport || ~_proxies.indexOf(element) ? _getBoundsFunc(element) : function() {
    return _winOffsets;
  };
}, _maxScroll = function _maxScroll2(element, _ref2) {
  var s = _ref2.s, d2 = _ref2.d2, d = _ref2.d, a = _ref2.a;
  return Math.max(0, (s = "scroll" + d2) && (a = _getProxyProp(element, s)) ? a() - _getBoundsFunc(element)()[d] : _isViewport(element) ? (_docEl[s] || _body[s]) - _getViewportDimension(d2) : element[s] - element["offset" + d2]);
}, _iterateAutoRefresh = function _iterateAutoRefresh2(func, events) {
  for (var i = 0; i < _autoRefresh.length; i += 3) {
    (!events || ~events.indexOf(_autoRefresh[i + 1])) && func(_autoRefresh[i], _autoRefresh[i + 1], _autoRefresh[i + 2]);
  }
}, _isString = function _isString2(value) {
  return typeof value === "string";
}, _isFunction = function _isFunction2(value) {
  return typeof value === "function";
}, _isNumber = function _isNumber2(value) {
  return typeof value === "number";
}, _isObject = function _isObject2(value) {
  return typeof value === "object";
}, _endAnimation = function _endAnimation2(animation, reversed, pause) {
  return animation && animation.progress(reversed ? 0 : 1) && pause && animation.pause();
}, _callback = function _callback2(self, func) {
  if (self.enabled) {
    var result = self._ctx ? self._ctx.add(function() {
      return func(self);
    }) : func(self);
    result && result.totalTime && (self.callbackAnimation = result);
  }
}, _abs = Math.abs, _left = "left", _top = "top", _right = "right", _bottom = "bottom", _width = "width", _height = "height", _Right = "Right", _Left = "Left", _Top = "Top", _Bottom = "Bottom", _padding = "padding", _margin = "margin", _Width = "Width", _Height = "Height", _px = "px", _getComputedStyle = function _getComputedStyle2(element) {
  return _win.getComputedStyle(element);
}, _makePositionable = function _makePositionable2(element) {
  var position = _getComputedStyle(element).position;
  element.style.position = position === "absolute" || position === "fixed" ? position : "relative";
}, _setDefaults = function _setDefaults2(obj, defaults) {
  for (var p in defaults) {
    p in obj || (obj[p] = defaults[p]);
  }
  return obj;
}, _getBounds = function _getBounds2(element, withoutTransforms) {
  var tween = withoutTransforms && _getComputedStyle(element)[_transformProp] !== "matrix(1, 0, 0, 1, 0, 0)" && gsap.to(element, {
    x: 0,
    y: 0,
    xPercent: 0,
    yPercent: 0,
    rotation: 0,
    rotationX: 0,
    rotationY: 0,
    scale: 1,
    skewX: 0,
    skewY: 0
  }).progress(1), bounds = element.getBoundingClientRect();
  tween && tween.progress(0).kill();
  return bounds;
}, _getSize = function _getSize2(element, _ref3) {
  var d2 = _ref3.d2;
  return element["offset" + d2] || element["client" + d2] || 0;
}, _getLabelRatioArray = function _getLabelRatioArray2(timeline) {
  var a = [], labels = timeline.labels, duration = timeline.duration(), p;
  for (p in labels) {
    a.push(labels[p] / duration);
  }
  return a;
}, _getClosestLabel = function _getClosestLabel2(animation) {
  return function(value) {
    return gsap.utils.snap(_getLabelRatioArray(animation), value);
  };
}, _snapDirectional = function _snapDirectional2(snapIncrementOrArray) {
  var snap = gsap.utils.snap(snapIncrementOrArray), a = Array.isArray(snapIncrementOrArray) && snapIncrementOrArray.slice(0).sort(function(a2, b) {
    return a2 - b;
  });
  return a ? function(value, direction, threshold) {
    if (threshold === void 0) {
      threshold = 1e-3;
    }
    var i;
    if (!direction) {
      return snap(value);
    }
    if (direction > 0) {
      value -= threshold;
      for (i = 0; i < a.length; i++) {
        if (a[i] >= value) {
          return a[i];
        }
      }
      return a[i - 1];
    } else {
      i = a.length;
      value += threshold;
      while (i--) {
        if (a[i] <= value) {
          return a[i];
        }
      }
    }
    return a[0];
  } : function(value, direction, threshold) {
    if (threshold === void 0) {
      threshold = 1e-3;
    }
    var snapped = snap(value);
    return !direction || Math.abs(snapped - value) < threshold || snapped - value < 0 === direction < 0 ? snapped : snap(direction < 0 ? value - snapIncrementOrArray : value + snapIncrementOrArray);
  };
}, _getLabelAtDirection = function _getLabelAtDirection2(timeline) {
  return function(value, st) {
    return _snapDirectional(_getLabelRatioArray(timeline))(value, st.direction);
  };
}, _multiListener = function _multiListener2(func, element, types, callback) {
  return types.split(",").forEach(function(type) {
    return func(element, type, callback);
  });
}, _addListener = function _addListener22(element, type, func, nonPassive, capture) {
  return element.addEventListener(type, func, {
    passive: !nonPassive,
    capture: !!capture
  });
}, _removeListener = function _removeListener22(element, type, func, capture) {
  return element.removeEventListener(type, func, !!capture);
}, _wheelListener = function _wheelListener2(func, el, scrollFunc) {
  scrollFunc = scrollFunc && scrollFunc.wheelHandler;
  if (scrollFunc) {
    func(el, "wheel", scrollFunc);
    func(el, "touchmove", scrollFunc);
  }
}, _markerDefaults = {
  startColor: "green",
  endColor: "red",
  indent: 0,
  fontSize: "16px",
  fontWeight: "normal"
}, _defaults = {
  toggleActions: "play",
  anticipatePin: 0
}, _keywords = {
  top: 0,
  left: 0,
  center: 0.5,
  bottom: 1,
  right: 1
}, _offsetToPx = function _offsetToPx2(value, size) {
  if (_isString(value)) {
    var eqIndex = value.indexOf("="), relative = ~eqIndex ? +(value.charAt(eqIndex - 1) + 1) * parseFloat(value.substr(eqIndex + 1)) : 0;
    if (~eqIndex) {
      value.indexOf("%") > eqIndex && (relative *= size / 100);
      value = value.substr(0, eqIndex - 1);
    }
    value = relative + (value in _keywords ? _keywords[value] * size : ~value.indexOf("%") ? parseFloat(value) * size / 100 : parseFloat(value) || 0);
  }
  return value;
}, _createMarker = function _createMarker2(type, name, container, direction, _ref4, offset, matchWidthEl, containerAnimation) {
  var startColor = _ref4.startColor, endColor = _ref4.endColor, fontSize = _ref4.fontSize, indent = _ref4.indent, fontWeight = _ref4.fontWeight;
  var e = _doc.createElement("div"), useFixedPosition = _isViewport(container) || _getProxyProp(container, "pinType") === "fixed", isScroller = type.indexOf("scroller") !== -1, parent = useFixedPosition ? _body : container, isStart = type.indexOf("start") !== -1, color = isStart ? startColor : endColor, css = "border-color:" + color + ";font-size:" + fontSize + ";color:" + color + ";font-weight:" + fontWeight + ";pointer-events:none;white-space:nowrap;font-family:sans-serif,Arial;z-index:1000;padding:4px 8px;border-width:0;border-style:solid;";
  css += "position:" + ((isScroller || containerAnimation) && useFixedPosition ? "fixed;" : "absolute;");
  (isScroller || containerAnimation || !useFixedPosition) && (css += (direction === _vertical ? _right : _bottom) + ":" + (offset + parseFloat(indent)) + "px;");
  matchWidthEl && (css += "box-sizing:border-box;text-align:left;width:" + matchWidthEl.offsetWidth + "px;");
  e._isStart = isStart;
  e.setAttribute("class", "gsap-marker-" + type + (name ? " marker-" + name : ""));
  e.style.cssText = css;
  e.innerText = name || name === 0 ? type + "-" + name : type;
  parent.children[0] ? parent.insertBefore(e, parent.children[0]) : parent.appendChild(e);
  e._offset = e["offset" + direction.op.d2];
  _positionMarker(e, 0, direction, isStart);
  return e;
}, _positionMarker = function _positionMarker2(marker, start, direction, flipped) {
  var vars = {
    display: "block"
  }, side = direction[flipped ? "os2" : "p2"], oppositeSide = direction[flipped ? "p2" : "os2"];
  marker._isFlipped = flipped;
  vars[direction.a + "Percent"] = flipped ? -100 : 0;
  vars[direction.a] = flipped ? "1px" : 0;
  vars["border" + side + _Width] = 1;
  vars["border" + oppositeSide + _Width] = 0;
  vars[direction.p] = start + "px";
  gsap.set(marker, vars);
}, _triggers = [], _ids = {}, _rafID, _sync = function _sync2() {
  return _getTime() - _lastScrollTime > 34 && (_rafID || (_rafID = requestAnimationFrame(_updateAll)));
}, _onScroll = function _onScroll22() {
  if (!_normalizer || !_normalizer.isPressed || _normalizer.startX > _body.clientWidth) {
    _scrollers.cache++;
    if (_normalizer) {
      _rafID || (_rafID = requestAnimationFrame(_updateAll));
    } else {
      _updateAll();
    }
    _lastScrollTime || _dispatch("scrollStart");
    _lastScrollTime = _getTime();
  }
}, _setBaseDimensions = function _setBaseDimensions2() {
  _baseScreenWidth = _win.innerWidth;
  _baseScreenHeight = _win.innerHeight;
}, _onResize = function _onResize2(force) {
  _scrollers.cache++;
  (force === true || !_refreshing && !_ignoreResize && !_doc.fullscreenElement && !_doc.webkitFullscreenElement && (!_ignoreMobileResize || _baseScreenWidth !== _win.innerWidth || Math.abs(_win.innerHeight - _baseScreenHeight) > _win.innerHeight * 0.25)) && _resizeDelay.restart(true);
}, _listeners = {}, _emptyArray = [], _softRefresh = function _softRefresh2() {
  return _removeListener(ScrollTrigger, "scrollEnd", _softRefresh2) || _refreshAll(true);
}, _dispatch = function _dispatch2(type) {
  return _listeners[type] && _listeners[type].map(function(f) {
    return f();
  }) || _emptyArray;
}, _savedStyles = [], _revertRecorded = function _revertRecorded2(media) {
  for (var i = 0; i < _savedStyles.length; i += 5) {
    if (!media || _savedStyles[i + 4] && _savedStyles[i + 4].query === media) {
      _savedStyles[i].style.cssText = _savedStyles[i + 1];
      _savedStyles[i].getBBox && _savedStyles[i].setAttribute("transform", _savedStyles[i + 2] || "");
      _savedStyles[i + 3].uncache = 1;
    }
  }
}, _revertAll = function _revertAll2(kill, media) {
  var trigger;
  for (_i = 0; _i < _triggers.length; _i++) {
    trigger = _triggers[_i];
    if (trigger && (!media || trigger._ctx === media)) {
      if (kill) {
        trigger.kill(1);
      } else {
        trigger.revert(true, true);
      }
    }
  }
  _isReverted = true;
  media && _revertRecorded(media);
  media || _dispatch("revert");
}, _clearScrollMemory = function _clearScrollMemory2(scrollRestoration, force) {
  _scrollers.cache++;
  (force || !_refreshingAll) && _scrollers.forEach(function(obj) {
    return _isFunction(obj) && obj.cacheID++ && (obj.rec = 0);
  });
  _isString(scrollRestoration) && (_win.history.scrollRestoration = _scrollRestoration = scrollRestoration);
}, _refreshingAll, _refreshID = 0, _queueRefreshID, _queueRefreshAll = function _queueRefreshAll2() {
  if (_queueRefreshID !== _refreshID) {
    var id = _queueRefreshID = _refreshID;
    requestAnimationFrame(function() {
      return id === _refreshID && _refreshAll(true);
    });
  }
}, _refresh100vh = function _refresh100vh2() {
  _body.appendChild(_div100vh);
  _100vh = !_normalizer && _div100vh.offsetHeight || _win.innerHeight;
  _body.removeChild(_div100vh);
}, _hideAllMarkers = function _hideAllMarkers2(hide) {
  return _toArray(".gsap-marker-start, .gsap-marker-end, .gsap-marker-scroller-start, .gsap-marker-scroller-end").forEach(function(el) {
    return el.style.display = hide ? "none" : "block";
  });
}, _refreshAll = function _refreshAll2(force, skipRevert) {
  _docEl = _doc.documentElement;
  _body = _doc.body;
  _root = [_win, _doc, _docEl, _body];
  if (_lastScrollTime && !force && !_isReverted) {
    _addListener(ScrollTrigger, "scrollEnd", _softRefresh);
    return;
  }
  _refresh100vh();
  _refreshingAll = ScrollTrigger.isRefreshing = true;
  _scrollers.forEach(function(obj) {
    return _isFunction(obj) && ++obj.cacheID && (obj.rec = obj());
  });
  var refreshInits = _dispatch("refreshInit");
  _sort && ScrollTrigger.sort();
  skipRevert || _revertAll();
  _scrollers.forEach(function(obj) {
    if (_isFunction(obj)) {
      obj.smooth && (obj.target.style.scrollBehavior = "auto");
      obj(0);
    }
  });
  _triggers.slice(0).forEach(function(t) {
    return t.refresh();
  });
  _isReverted = false;
  _triggers.forEach(function(t) {
    if (t._subPinOffset && t.pin) {
      var prop = t.vars.horizontal ? "offsetWidth" : "offsetHeight", original = t.pin[prop];
      t.revert(true, 1);
      t.adjustPinSpacing(t.pin[prop] - original);
      t.refresh();
    }
  });
  _clampingMax = 1;
  _hideAllMarkers(true);
  _triggers.forEach(function(t) {
    var max = _maxScroll(t.scroller, t._dir), endClamp = t.vars.end === "max" || t._endClamp && t.end > max, startClamp = t._startClamp && t.start >= max;
    (endClamp || startClamp) && t.setPositions(startClamp ? max - 1 : t.start, endClamp ? Math.max(startClamp ? max : t.start + 1, max) : t.end, true);
  });
  _hideAllMarkers(false);
  _clampingMax = 0;
  refreshInits.forEach(function(result) {
    return result && result.render && result.render(-1);
  });
  _scrollers.forEach(function(obj) {
    if (_isFunction(obj)) {
      obj.smooth && requestAnimationFrame(function() {
        return obj.target.style.scrollBehavior = "smooth";
      });
      obj.rec && obj(obj.rec);
    }
  });
  _clearScrollMemory(_scrollRestoration, 1);
  _resizeDelay.pause();
  _refreshID++;
  _refreshingAll = 2;
  _updateAll(2);
  _triggers.forEach(function(t) {
    return _isFunction(t.vars.onRefresh) && t.vars.onRefresh(t);
  });
  _refreshingAll = ScrollTrigger.isRefreshing = false;
  _dispatch("refresh");
}, _lastScroll = 0, _direction = 1, _primary, _updateAll = function _updateAll2(force) {
  if (force === 2 || !_refreshingAll && !_isReverted) {
    ScrollTrigger.isUpdating = true;
    _primary && _primary.update(0);
    var l = _triggers.length, time = _getTime(), recordVelocity = time - _time1 >= 50, scroll = l && _triggers[0].scroll();
    _direction = _lastScroll > scroll ? -1 : 1;
    _refreshingAll || (_lastScroll = scroll);
    if (recordVelocity) {
      if (_lastScrollTime && !_pointerIsDown && time - _lastScrollTime > 200) {
        _lastScrollTime = 0;
        _dispatch("scrollEnd");
      }
      _time2 = _time1;
      _time1 = time;
    }
    if (_direction < 0) {
      _i = l;
      while (_i-- > 0) {
        _triggers[_i] && _triggers[_i].update(0, recordVelocity);
      }
      _direction = 1;
    } else {
      for (_i = 0; _i < l; _i++) {
        _triggers[_i] && _triggers[_i].update(0, recordVelocity);
      }
    }
    ScrollTrigger.isUpdating = false;
  }
  _rafID = 0;
}, _propNamesToCopy = [_left, _top, _bottom, _right, _margin + _Bottom, _margin + _Right, _margin + _Top, _margin + _Left, "display", "flexShrink", "float", "zIndex", "gridColumnStart", "gridColumnEnd", "gridRowStart", "gridRowEnd", "gridArea", "justifySelf", "alignSelf", "placeSelf", "order"], _stateProps = _propNamesToCopy.concat([_width, _height, "boxSizing", "max" + _Width, "max" + _Height, "position", _margin, _padding, _padding + _Top, _padding + _Right, _padding + _Bottom, _padding + _Left]), _swapPinOut = function _swapPinOut2(pin, spacer, state) {
  _setState(state);
  var cache = pin._gsap;
  if (cache.spacerIsNative) {
    _setState(cache.spacerState);
  } else if (pin._gsap.swappedIn) {
    var parent = spacer.parentNode;
    if (parent) {
      parent.insertBefore(pin, spacer);
      parent.removeChild(spacer);
    }
  }
  pin._gsap.swappedIn = false;
}, _swapPinIn = function _swapPinIn2(pin, spacer, cs, spacerState) {
  if (!pin._gsap.swappedIn) {
    var i = _propNamesToCopy.length, spacerStyle = spacer.style, pinStyle = pin.style, p;
    while (i--) {
      p = _propNamesToCopy[i];
      spacerStyle[p] = cs[p];
    }
    spacerStyle.position = cs.position === "absolute" ? "absolute" : "relative";
    cs.display === "inline" && (spacerStyle.display = "inline-block");
    pinStyle[_bottom] = pinStyle[_right] = "auto";
    spacerStyle.flexBasis = cs.flexBasis || "auto";
    spacerStyle.overflow = "visible";
    spacerStyle.boxSizing = "border-box";
    spacerStyle[_width] = _getSize(pin, _horizontal) + _px;
    spacerStyle[_height] = _getSize(pin, _vertical) + _px;
    spacerStyle[_padding] = pinStyle[_margin] = pinStyle[_top] = pinStyle[_left] = "0";
    _setState(spacerState);
    pinStyle[_width] = pinStyle["max" + _Width] = cs[_width];
    pinStyle[_height] = pinStyle["max" + _Height] = cs[_height];
    pinStyle[_padding] = cs[_padding];
    if (pin.parentNode !== spacer) {
      pin.parentNode.insertBefore(spacer, pin);
      spacer.appendChild(pin);
    }
    pin._gsap.swappedIn = true;
  }
}, _capsExp = /([A-Z])/g, _setState = function _setState2(state) {
  if (state) {
    var style = state.t.style, l = state.length, i = 0, p, value;
    (state.t._gsap || gsap.core.getCache(state.t)).uncache = 1;
    for (; i < l; i += 2) {
      value = state[i + 1];
      p = state[i];
      if (value) {
        style[p] = value;
      } else if (style[p]) {
        style.removeProperty(p.replace(_capsExp, "-$1").toLowerCase());
      }
    }
  }
}, _getState = function _getState2(element) {
  var l = _stateProps.length, style = element.style, state = [], i = 0;
  for (; i < l; i++) {
    state.push(_stateProps[i], style[_stateProps[i]]);
  }
  state.t = element;
  return state;
}, _copyState = function _copyState2(state, override, omitOffsets) {
  var result = [], l = state.length, i = omitOffsets ? 8 : 0, p;
  for (; i < l; i += 2) {
    p = state[i];
    result.push(p, p in override ? override[p] : state[i + 1]);
  }
  result.t = state.t;
  return result;
}, _winOffsets = {
  left: 0,
  top: 0
}, _parsePosition = function _parsePosition2(value, trigger, scrollerSize, direction, scroll, marker, markerScroller, self, scrollerBounds, borderWidth, useFixedPosition, scrollerMax, containerAnimation, clampZeroProp) {
  _isFunction(value) && (value = value(self));
  if (_isString(value) && value.substr(0, 3) === "max") {
    value = scrollerMax + (value.charAt(4) === "=" ? _offsetToPx("0" + value.substr(3), scrollerSize) : 0);
  }
  var time = containerAnimation ? containerAnimation.time() : 0, p1, p2, element;
  containerAnimation && containerAnimation.seek(0);
  isNaN(value) || (value = +value);
  if (!_isNumber(value)) {
    _isFunction(trigger) && (trigger = trigger(self));
    var offsets = (value || "0").split(" "), bounds, localOffset, globalOffset, display;
    element = _getTarget(trigger, self) || _body;
    bounds = _getBounds(element) || {};
    if ((!bounds || !bounds.left && !bounds.top) && _getComputedStyle(element).display === "none") {
      display = element.style.display;
      element.style.display = "block";
      bounds = _getBounds(element);
      display ? element.style.display = display : element.style.removeProperty("display");
    }
    localOffset = _offsetToPx(offsets[0], bounds[direction.d]);
    globalOffset = _offsetToPx(offsets[1] || "0", scrollerSize);
    value = bounds[direction.p] - scrollerBounds[direction.p] - borderWidth + localOffset + scroll - globalOffset;
    markerScroller && _positionMarker(markerScroller, globalOffset, direction, scrollerSize - globalOffset < 20 || markerScroller._isStart && globalOffset > 20);
    scrollerSize -= scrollerSize - globalOffset;
  } else {
    containerAnimation && (value = gsap.utils.mapRange(containerAnimation.scrollTrigger.start, containerAnimation.scrollTrigger.end, 0, scrollerMax, value));
    markerScroller && _positionMarker(markerScroller, scrollerSize, direction, true);
  }
  if (clampZeroProp) {
    self[clampZeroProp] = value || -1e-3;
    value < 0 && (value = 0);
  }
  if (marker) {
    var position = value + scrollerSize, isStart = marker._isStart;
    p1 = "scroll" + direction.d2;
    _positionMarker(marker, position, direction, isStart && position > 20 || !isStart && (useFixedPosition ? Math.max(_body[p1], _docEl[p1]) : marker.parentNode[p1]) <= position + 1);
    if (useFixedPosition) {
      scrollerBounds = _getBounds(markerScroller);
      useFixedPosition && (marker.style[direction.op.p] = scrollerBounds[direction.op.p] - direction.op.m - marker._offset + _px);
    }
  }
  if (containerAnimation && element) {
    p1 = _getBounds(element);
    containerAnimation.seek(scrollerMax);
    p2 = _getBounds(element);
    containerAnimation._caScrollDist = p1[direction.p] - p2[direction.p];
    value = value / containerAnimation._caScrollDist * scrollerMax;
  }
  containerAnimation && containerAnimation.seek(time);
  return containerAnimation ? value : Math.round(value);
}, _prefixExp = /(webkit|moz|length|cssText|inset)/i, _reparent = function _reparent2(element, parent, top, left) {
  if (element.parentNode !== parent) {
    var style = element.style, p, cs;
    if (parent === _body) {
      element._stOrig = style.cssText;
      cs = _getComputedStyle(element);
      for (p in cs) {
        if (!+p && !_prefixExp.test(p) && cs[p] && typeof style[p] === "string" && p !== "0") {
          style[p] = cs[p];
        }
      }
      style.top = top;
      style.left = left;
    } else {
      style.cssText = element._stOrig;
    }
    gsap.core.getCache(element).uncache = 1;
    parent.appendChild(element);
  }
}, _interruptionTracker = function _interruptionTracker2(getValueFunc, initialValue, onInterrupt) {
  var last1 = initialValue, last2 = last1;
  return function(value) {
    var current = Math.round(getValueFunc());
    if (current !== last1 && current !== last2 && Math.abs(current - last1) > 3 && Math.abs(current - last2) > 3) {
      value = current;
      onInterrupt && onInterrupt();
    }
    last2 = last1;
    last1 = Math.round(value);
    return last1;
  };
}, _shiftMarker = function _shiftMarker2(marker, direction, value) {
  var vars = {};
  vars[direction.p] = "+=" + value;
  gsap.set(marker, vars);
}, _getTweenCreator = function _getTweenCreator2(scroller, direction) {
  var getScroll = _getScrollFunc(scroller, direction), prop = "_scroll" + direction.p2, getTween = function getTween2(scrollTo, vars, initialValue, change1, change2) {
    var tween = getTween2.tween, onComplete = vars.onComplete, modifiers = {};
    initialValue = initialValue || getScroll();
    var checkForInterruption = _interruptionTracker(getScroll, initialValue, function() {
      tween.kill();
      getTween2.tween = 0;
    });
    change2 = change1 && change2 || 0;
    change1 = change1 || scrollTo - initialValue;
    tween && tween.kill();
    vars[prop] = scrollTo;
    vars.inherit = false;
    vars.modifiers = modifiers;
    modifiers[prop] = function() {
      return checkForInterruption(initialValue + change1 * tween.ratio + change2 * tween.ratio * tween.ratio);
    };
    vars.onUpdate = function() {
      _scrollers.cache++;
      getTween2.tween && _updateAll();
    };
    vars.onComplete = function() {
      getTween2.tween = 0;
      onComplete && onComplete.call(tween);
    };
    tween = getTween2.tween = gsap.to(scroller, vars);
    return tween;
  };
  scroller[prop] = getScroll;
  getScroll.wheelHandler = function() {
    return getTween.tween && getTween.tween.kill() && (getTween.tween = 0);
  };
  _addListener(scroller, "wheel", getScroll.wheelHandler);
  ScrollTrigger.isTouch && _addListener(scroller, "touchmove", getScroll.wheelHandler);
  return getTween;
};
var ScrollTrigger = /* @__PURE__ */ function() {
  function ScrollTrigger2(vars, animation) {
    _coreInitted || ScrollTrigger2.register(gsap) || console.warn("Please gsap.registerPlugin(ScrollTrigger)");
    _context(this);
    this.init(vars, animation);
  }
  var _proto = ScrollTrigger2.prototype;
  _proto.init = function init(vars, animation) {
    this.progress = this.start = 0;
    this.vars && this.kill(true, true);
    if (!_enabled) {
      this.update = this.refresh = this.kill = _passThrough;
      return;
    }
    vars = _setDefaults(_isString(vars) || _isNumber(vars) || vars.nodeType ? {
      trigger: vars
    } : vars, _defaults);
    var _vars = vars, onUpdate = _vars.onUpdate, toggleClass = _vars.toggleClass, id = _vars.id, onToggle = _vars.onToggle, onRefresh = _vars.onRefresh, scrub = _vars.scrub, trigger = _vars.trigger, pin = _vars.pin, pinSpacing = _vars.pinSpacing, invalidateOnRefresh = _vars.invalidateOnRefresh, anticipatePin = _vars.anticipatePin, onScrubComplete = _vars.onScrubComplete, onSnapComplete = _vars.onSnapComplete, once = _vars.once, snap = _vars.snap, pinReparent = _vars.pinReparent, pinSpacer = _vars.pinSpacer, containerAnimation = _vars.containerAnimation, fastScrollEnd = _vars.fastScrollEnd, preventOverlaps = _vars.preventOverlaps, direction = vars.horizontal || vars.containerAnimation && vars.horizontal !== false ? _horizontal : _vertical, isToggle = !scrub && scrub !== 0, scroller = _getTarget(vars.scroller || _win), scrollerCache = gsap.core.getCache(scroller), isViewport = _isViewport(scroller), useFixedPosition = ("pinType" in vars ? vars.pinType : _getProxyProp(scroller, "pinType") || isViewport && "fixed") === "fixed", callbacks = [vars.onEnter, vars.onLeave, vars.onEnterBack, vars.onLeaveBack], toggleActions = isToggle && vars.toggleActions.split(" "), markers = "markers" in vars ? vars.markers : _defaults.markers, borderWidth = isViewport ? 0 : parseFloat(_getComputedStyle(scroller)["border" + direction.p2 + _Width]) || 0, self = this, onRefreshInit = vars.onRefreshInit && function() {
      return vars.onRefreshInit(self);
    }, getScrollerSize = _getSizeFunc(scroller, isViewport, direction), getScrollerOffsets = _getOffsetsFunc(scroller, isViewport), lastSnap = 0, lastRefresh = 0, prevProgress = 0, scrollFunc = _getScrollFunc(scroller, direction), tweenTo, pinCache, snapFunc, scroll1, scroll2, start, end, markerStart, markerEnd, markerStartTrigger, markerEndTrigger, markerVars, executingOnRefresh, change, pinOriginalState, pinActiveState, pinState, spacer, offset, pinGetter, pinSetter, pinStart, pinChange, spacingStart, spacerState, markerStartSetter, pinMoves, markerEndSetter, cs, snap1, snap2, scrubTween, scrubSmooth, snapDurClamp, snapDelayedCall, prevScroll, prevAnimProgress, caMarkerSetter, customRevertReturn;
    self._startClamp = self._endClamp = false;
    self._dir = direction;
    anticipatePin *= 45;
    self.scroller = scroller;
    self.scroll = containerAnimation ? containerAnimation.time.bind(containerAnimation) : scrollFunc;
    scroll1 = scrollFunc();
    self.vars = vars;
    animation = animation || vars.animation;
    if ("refreshPriority" in vars) {
      _sort = 1;
      vars.refreshPriority === -9999 && (_primary = self);
    }
    scrollerCache.tweenScroll = scrollerCache.tweenScroll || {
      top: _getTweenCreator(scroller, _vertical),
      left: _getTweenCreator(scroller, _horizontal)
    };
    self.tweenTo = tweenTo = scrollerCache.tweenScroll[direction.p];
    self.scrubDuration = function(value) {
      scrubSmooth = _isNumber(value) && value;
      if (!scrubSmooth) {
        scrubTween && scrubTween.progress(1).kill();
        scrubTween = 0;
      } else {
        scrubTween ? scrubTween.duration(value) : scrubTween = gsap.to(animation, {
          ease: "expo",
          totalProgress: "+=0",
          inherit: false,
          duration: scrubSmooth,
          paused: true,
          onComplete: function onComplete() {
            return onScrubComplete && onScrubComplete(self);
          }
        });
      }
    };
    if (animation) {
      animation.vars.lazy = false;
      animation._initted && !self.isReverted || animation.vars.immediateRender !== false && vars.immediateRender !== false && animation.duration() && animation.render(0, true, true);
      self.animation = animation.pause();
      animation.scrollTrigger = self;
      self.scrubDuration(scrub);
      snap1 = 0;
      id || (id = animation.vars.id);
    }
    if (snap) {
      if (!_isObject(snap) || snap.push) {
        snap = {
          snapTo: snap
        };
      }
      "scrollBehavior" in _body.style && gsap.set(isViewport ? [_body, _docEl] : scroller, {
        scrollBehavior: "auto"
      });
      _scrollers.forEach(function(o) {
        return _isFunction(o) && o.target === (isViewport ? _doc.scrollingElement || _docEl : scroller) && (o.smooth = false);
      });
      snapFunc = _isFunction(snap.snapTo) ? snap.snapTo : snap.snapTo === "labels" ? _getClosestLabel(animation) : snap.snapTo === "labelsDirectional" ? _getLabelAtDirection(animation) : snap.directional !== false ? function(value, st) {
        return _snapDirectional(snap.snapTo)(value, _getTime() - lastRefresh < 500 ? 0 : st.direction);
      } : gsap.utils.snap(snap.snapTo);
      snapDurClamp = snap.duration || {
        min: 0.1,
        max: 2
      };
      snapDurClamp = _isObject(snapDurClamp) ? _clamp(snapDurClamp.min, snapDurClamp.max) : _clamp(snapDurClamp, snapDurClamp);
      snapDelayedCall = gsap.delayedCall(snap.delay || scrubSmooth / 2 || 0.1, function() {
        var scroll = scrollFunc(), refreshedRecently = _getTime() - lastRefresh < 500, tween = tweenTo.tween;
        if ((refreshedRecently || Math.abs(self.getVelocity()) < 10) && !tween && !_pointerIsDown && lastSnap !== scroll) {
          var progress = (scroll - start) / change, totalProgress = animation && !isToggle ? animation.totalProgress() : progress, velocity = refreshedRecently ? 0 : (totalProgress - snap2) / (_getTime() - _time2) * 1e3 || 0, change1 = gsap.utils.clamp(-progress, 1 - progress, _abs(velocity / 2) * velocity / 0.185), naturalEnd = progress + (snap.inertia === false ? 0 : change1), endValue, endScroll, _snap = snap, onStart = _snap.onStart, _onInterrupt = _snap.onInterrupt, _onComplete = _snap.onComplete;
          endValue = snapFunc(naturalEnd, self);
          _isNumber(endValue) || (endValue = naturalEnd);
          endScroll = Math.max(0, Math.round(start + endValue * change));
          if (scroll <= end && scroll >= start && endScroll !== scroll) {
            if (tween && !tween._initted && tween.data <= _abs(endScroll - scroll)) {
              return;
            }
            if (snap.inertia === false) {
              change1 = endValue - progress;
            }
            tweenTo(endScroll, {
              duration: snapDurClamp(_abs(Math.max(_abs(naturalEnd - totalProgress), _abs(endValue - totalProgress)) * 0.185 / velocity / 0.05 || 0)),
              ease: snap.ease || "power3",
              data: _abs(endScroll - scroll),
              // record the distance so that if another snap tween occurs (conflict) we can prioritize the closest snap.
              onInterrupt: function onInterrupt() {
                return snapDelayedCall.restart(true) && _onInterrupt && _onInterrupt(self);
              },
              onComplete: function onComplete() {
                self.update();
                lastSnap = scrollFunc();
                if (animation && !isToggle) {
                  scrubTween ? scrubTween.resetTo("totalProgress", endValue, animation._tTime / animation._tDur) : animation.progress(endValue);
                }
                snap1 = snap2 = animation && !isToggle ? animation.totalProgress() : self.progress;
                onSnapComplete && onSnapComplete(self);
                _onComplete && _onComplete(self);
              }
            }, scroll, change1 * change, endScroll - scroll - change1 * change);
            onStart && onStart(self, tweenTo.tween);
          }
        } else if (self.isActive && lastSnap !== scroll) {
          snapDelayedCall.restart(true);
        }
      }).pause();
    }
    id && (_ids[id] = self);
    trigger = self.trigger = _getTarget(trigger || pin !== true && pin);
    customRevertReturn = trigger && trigger._gsap && trigger._gsap.stRevert;
    customRevertReturn && (customRevertReturn = customRevertReturn(self));
    pin = pin === true ? trigger : _getTarget(pin);
    _isString(toggleClass) && (toggleClass = {
      targets: trigger,
      className: toggleClass
    });
    if (pin) {
      pinSpacing === false || pinSpacing === _margin || (pinSpacing = !pinSpacing && pin.parentNode && pin.parentNode.style && _getComputedStyle(pin.parentNode).display === "flex" ? false : _padding);
      self.pin = pin;
      pinCache = gsap.core.getCache(pin);
      if (!pinCache.spacer) {
        if (pinSpacer) {
          pinSpacer = _getTarget(pinSpacer);
          pinSpacer && !pinSpacer.nodeType && (pinSpacer = pinSpacer.current || pinSpacer.nativeElement);
          pinCache.spacerIsNative = !!pinSpacer;
          pinSpacer && (pinCache.spacerState = _getState(pinSpacer));
        }
        pinCache.spacer = spacer = pinSpacer || _doc.createElement("div");
        spacer.classList.add("pin-spacer");
        id && spacer.classList.add("pin-spacer-" + id);
        pinCache.pinState = pinOriginalState = _getState(pin);
      } else {
        pinOriginalState = pinCache.pinState;
      }
      vars.force3D !== false && gsap.set(pin, {
        force3D: true
      });
      self.spacer = spacer = pinCache.spacer;
      cs = _getComputedStyle(pin);
      spacingStart = cs[pinSpacing + direction.os2];
      pinGetter = gsap.getProperty(pin);
      pinSetter = gsap.quickSetter(pin, direction.a, _px);
      _swapPinIn(pin, spacer, cs);
      pinState = _getState(pin);
    }
    if (markers) {
      markerVars = _isObject(markers) ? _setDefaults(markers, _markerDefaults) : _markerDefaults;
      markerStartTrigger = _createMarker("scroller-start", id, scroller, direction, markerVars, 0);
      markerEndTrigger = _createMarker("scroller-end", id, scroller, direction, markerVars, 0, markerStartTrigger);
      offset = markerStartTrigger["offset" + direction.op.d2];
      var content = _getTarget(_getProxyProp(scroller, "content") || scroller);
      markerStart = this.markerStart = _createMarker("start", id, content, direction, markerVars, offset, 0, containerAnimation);
      markerEnd = this.markerEnd = _createMarker("end", id, content, direction, markerVars, offset, 0, containerAnimation);
      containerAnimation && (caMarkerSetter = gsap.quickSetter([markerStart, markerEnd], direction.a, _px));
      if (!useFixedPosition && !(_proxies.length && _getProxyProp(scroller, "fixedMarkers") === true)) {
        _makePositionable(isViewport ? _body : scroller);
        gsap.set([markerStartTrigger, markerEndTrigger], {
          force3D: true
        });
        markerStartSetter = gsap.quickSetter(markerStartTrigger, direction.a, _px);
        markerEndSetter = gsap.quickSetter(markerEndTrigger, direction.a, _px);
      }
    }
    if (containerAnimation) {
      var oldOnUpdate = containerAnimation.vars.onUpdate, oldParams = containerAnimation.vars.onUpdateParams;
      containerAnimation.eventCallback("onUpdate", function() {
        self.update(0, 0, 1);
        oldOnUpdate && oldOnUpdate.apply(containerAnimation, oldParams || []);
      });
    }
    self.previous = function() {
      return _triggers[_triggers.indexOf(self) - 1];
    };
    self.next = function() {
      return _triggers[_triggers.indexOf(self) + 1];
    };
    self.revert = function(revert, temp) {
      if (!temp) {
        return self.kill(true);
      }
      var r = revert !== false || !self.enabled, prevRefreshing = _refreshing;
      if (r !== self.isReverted) {
        if (r) {
          prevScroll = Math.max(scrollFunc(), self.scroll.rec || 0);
          prevProgress = self.progress;
          prevAnimProgress = animation && animation.progress();
        }
        markerStart && [markerStart, markerEnd, markerStartTrigger, markerEndTrigger].forEach(function(m) {
          return m.style.display = r ? "none" : "block";
        });
        if (r) {
          _refreshing = self;
          self.update(r);
        }
        if (pin && (!pinReparent || !self.isActive)) {
          if (r) {
            _swapPinOut(pin, spacer, pinOriginalState);
          } else {
            _swapPinIn(pin, spacer, _getComputedStyle(pin), spacerState);
          }
        }
        r || self.update(r);
        _refreshing = prevRefreshing;
        self.isReverted = r;
      }
    };
    self.refresh = function(soft, force, position, pinOffset) {
      if ((_refreshing || !self.enabled) && !force) {
        return;
      }
      if (pin && soft && _lastScrollTime) {
        _addListener(ScrollTrigger2, "scrollEnd", _softRefresh);
        return;
      }
      !_refreshingAll && onRefreshInit && onRefreshInit(self);
      _refreshing = self;
      if (tweenTo.tween && !position) {
        tweenTo.tween.kill();
        tweenTo.tween = 0;
      }
      scrubTween && scrubTween.pause();
      if (invalidateOnRefresh && animation) {
        animation.revert({
          kill: false
        }).invalidate();
        animation.getChildren && animation.getChildren(true, true, false).forEach(function(t) {
          return t.vars.immediateRender && t.render(0, true, true);
        });
      }
      self.isReverted || self.revert(true, true);
      self._subPinOffset = false;
      var size = getScrollerSize(), scrollerBounds = getScrollerOffsets(), max = containerAnimation ? containerAnimation.duration() : _maxScroll(scroller, direction), isFirstRefresh = change <= 0.01 || !change, offset2 = 0, otherPinOffset = pinOffset || 0, parsedEnd = _isObject(position) ? position.end : vars.end, parsedEndTrigger = vars.endTrigger || trigger, parsedStart = _isObject(position) ? position.start : vars.start || (vars.start === 0 || !trigger ? 0 : pin ? "0 0" : "0 100%"), pinnedContainer = self.pinnedContainer = vars.pinnedContainer && _getTarget(vars.pinnedContainer, self), triggerIndex = trigger && Math.max(0, _triggers.indexOf(self)) || 0, i = triggerIndex, cs2, bounds, scroll, isVertical, override, curTrigger, curPin, oppositeScroll, initted, revertedPins, forcedOverflow, markerStartOffset, markerEndOffset;
      if (markers && _isObject(position)) {
        markerStartOffset = gsap.getProperty(markerStartTrigger, direction.p);
        markerEndOffset = gsap.getProperty(markerEndTrigger, direction.p);
      }
      while (i-- > 0) {
        curTrigger = _triggers[i];
        curTrigger.end || curTrigger.refresh(0, 1) || (_refreshing = self);
        curPin = curTrigger.pin;
        if (curPin && (curPin === trigger || curPin === pin || curPin === pinnedContainer) && !curTrigger.isReverted) {
          revertedPins || (revertedPins = []);
          revertedPins.unshift(curTrigger);
          curTrigger.revert(true, true);
        }
        if (curTrigger !== _triggers[i]) {
          triggerIndex--;
          i--;
        }
      }
      _isFunction(parsedStart) && (parsedStart = parsedStart(self));
      parsedStart = _parseClamp(parsedStart, "start", self);
      start = _parsePosition(parsedStart, trigger, size, direction, scrollFunc(), markerStart, markerStartTrigger, self, scrollerBounds, borderWidth, useFixedPosition, max, containerAnimation, self._startClamp && "_startClamp") || (pin ? -1e-3 : 0);
      _isFunction(parsedEnd) && (parsedEnd = parsedEnd(self));
      if (_isString(parsedEnd) && !parsedEnd.indexOf("+=")) {
        if (~parsedEnd.indexOf(" ")) {
          parsedEnd = (_isString(parsedStart) ? parsedStart.split(" ")[0] : "") + parsedEnd;
        } else {
          offset2 = _offsetToPx(parsedEnd.substr(2), size);
          parsedEnd = _isString(parsedStart) ? parsedStart : (containerAnimation ? gsap.utils.mapRange(0, containerAnimation.duration(), containerAnimation.scrollTrigger.start, containerAnimation.scrollTrigger.end, start) : start) + offset2;
          parsedEndTrigger = trigger;
        }
      }
      parsedEnd = _parseClamp(parsedEnd, "end", self);
      end = Math.max(start, _parsePosition(parsedEnd || (parsedEndTrigger ? "100% 0" : max), parsedEndTrigger, size, direction, scrollFunc() + offset2, markerEnd, markerEndTrigger, self, scrollerBounds, borderWidth, useFixedPosition, max, containerAnimation, self._endClamp && "_endClamp")) || -1e-3;
      offset2 = 0;
      i = triggerIndex;
      while (i--) {
        curTrigger = _triggers[i];
        curPin = curTrigger.pin;
        if (curPin && curTrigger.start - curTrigger._pinPush <= start && !containerAnimation && curTrigger.end > 0) {
          cs2 = curTrigger.end - (self._startClamp ? Math.max(0, curTrigger.start) : curTrigger.start);
          if ((curPin === trigger && curTrigger.start - curTrigger._pinPush < start || curPin === pinnedContainer) && isNaN(parsedStart)) {
            offset2 += cs2 * (1 - curTrigger.progress);
          }
          curPin === pin && (otherPinOffset += cs2);
        }
      }
      start += offset2;
      end += offset2;
      self._startClamp && (self._startClamp += offset2);
      if (self._endClamp && !_refreshingAll) {
        self._endClamp = end || -1e-3;
        end = Math.min(end, _maxScroll(scroller, direction));
      }
      change = end - start || (start -= 0.01) && 1e-3;
      if (isFirstRefresh) {
        prevProgress = gsap.utils.clamp(0, 1, gsap.utils.normalize(start, end, prevScroll));
      }
      self._pinPush = otherPinOffset;
      if (markerStart && offset2) {
        cs2 = {};
        cs2[direction.a] = "+=" + offset2;
        pinnedContainer && (cs2[direction.p] = "-=" + scrollFunc());
        gsap.set([markerStart, markerEnd], cs2);
      }
      if (pin && !(_clampingMax && self.end >= _maxScroll(scroller, direction))) {
        cs2 = _getComputedStyle(pin);
        isVertical = direction === _vertical;
        scroll = scrollFunc();
        pinStart = parseFloat(pinGetter(direction.a)) + otherPinOffset;
        if (!max && end > 1) {
          forcedOverflow = (isViewport ? _doc.scrollingElement || _docEl : scroller).style;
          forcedOverflow = {
            style: forcedOverflow,
            value: forcedOverflow["overflow" + direction.a.toUpperCase()]
          };
          if (isViewport && _getComputedStyle(_body)["overflow" + direction.a.toUpperCase()] !== "scroll") {
            forcedOverflow.style["overflow" + direction.a.toUpperCase()] = "scroll";
          }
        }
        _swapPinIn(pin, spacer, cs2);
        pinState = _getState(pin);
        bounds = _getBounds(pin, true);
        oppositeScroll = useFixedPosition && _getScrollFunc(scroller, isVertical ? _horizontal : _vertical)();
        if (pinSpacing) {
          spacerState = [pinSpacing + direction.os2, change + otherPinOffset + _px];
          spacerState.t = spacer;
          i = pinSpacing === _padding ? _getSize(pin, direction) + change + otherPinOffset : 0;
          if (i) {
            spacerState.push(direction.d, i + _px);
            spacer.style.flexBasis !== "auto" && (spacer.style.flexBasis = i + _px);
          }
          _setState(spacerState);
          if (pinnedContainer) {
            _triggers.forEach(function(t) {
              if (t.pin === pinnedContainer && t.vars.pinSpacing !== false) {
                t._subPinOffset = true;
              }
            });
          }
          useFixedPosition && scrollFunc(prevScroll);
        } else {
          i = _getSize(pin, direction);
          i && spacer.style.flexBasis !== "auto" && (spacer.style.flexBasis = i + _px);
        }
        if (useFixedPosition) {
          override = {
            top: bounds.top + (isVertical ? scroll - start : oppositeScroll) + _px,
            left: bounds.left + (isVertical ? oppositeScroll : scroll - start) + _px,
            boxSizing: "border-box",
            position: "fixed"
          };
          override[_width] = override["max" + _Width] = Math.ceil(bounds.width) + _px;
          override[_height] = override["max" + _Height] = Math.ceil(bounds.height) + _px;
          override[_margin] = override[_margin + _Top] = override[_margin + _Right] = override[_margin + _Bottom] = override[_margin + _Left] = "0";
          override[_padding] = cs2[_padding];
          override[_padding + _Top] = cs2[_padding + _Top];
          override[_padding + _Right] = cs2[_padding + _Right];
          override[_padding + _Bottom] = cs2[_padding + _Bottom];
          override[_padding + _Left] = cs2[_padding + _Left];
          pinActiveState = _copyState(pinOriginalState, override, pinReparent);
          _refreshingAll && scrollFunc(0);
        }
        if (animation) {
          initted = animation._initted;
          _suppressOverwrites(1);
          animation.render(animation.duration(), true, true);
          pinChange = pinGetter(direction.a) - pinStart + change + otherPinOffset;
          pinMoves = Math.abs(change - pinChange) > 1;
          useFixedPosition && pinMoves && pinActiveState.splice(pinActiveState.length - 2, 2);
          animation.render(0, true, true);
          initted || animation.invalidate(true);
          animation.parent || animation.totalTime(animation.totalTime());
          _suppressOverwrites(0);
        } else {
          pinChange = change;
        }
        forcedOverflow && (forcedOverflow.value ? forcedOverflow.style["overflow" + direction.a.toUpperCase()] = forcedOverflow.value : forcedOverflow.style.removeProperty("overflow-" + direction.a));
      } else if (trigger && scrollFunc() && !containerAnimation) {
        bounds = trigger.parentNode;
        while (bounds && bounds !== _body) {
          if (bounds._pinOffset) {
            start -= bounds._pinOffset;
            end -= bounds._pinOffset;
          }
          bounds = bounds.parentNode;
        }
      }
      revertedPins && revertedPins.forEach(function(t) {
        return t.revert(false, true);
      });
      self.start = start;
      self.end = end;
      scroll1 = scroll2 = _refreshingAll ? prevScroll : scrollFunc();
      if (!containerAnimation && !_refreshingAll) {
        scroll1 < prevScroll && scrollFunc(prevScroll);
        self.scroll.rec = 0;
      }
      self.revert(false, true);
      lastRefresh = _getTime();
      if (snapDelayedCall) {
        lastSnap = -1;
        snapDelayedCall.restart(true);
      }
      _refreshing = 0;
      animation && isToggle && (animation._initted || prevAnimProgress) && animation.progress() !== prevAnimProgress && animation.progress(prevAnimProgress || 0, true).render(animation.time(), true, true);
      if (isFirstRefresh || prevProgress !== self.progress || containerAnimation || invalidateOnRefresh || animation && !animation._initted) {
        animation && !isToggle && (animation._initted || prevProgress || animation.vars.immediateRender !== false) && animation.totalProgress(containerAnimation && start < -1e-3 && !prevProgress ? gsap.utils.normalize(start, end, 0) : prevProgress, true);
        self.progress = isFirstRefresh || (scroll1 - start) / change === prevProgress ? 0 : prevProgress;
      }
      pin && pinSpacing && (spacer._pinOffset = Math.round(self.progress * pinChange));
      scrubTween && scrubTween.invalidate();
      if (!isNaN(markerStartOffset)) {
        markerStartOffset -= gsap.getProperty(markerStartTrigger, direction.p);
        markerEndOffset -= gsap.getProperty(markerEndTrigger, direction.p);
        _shiftMarker(markerStartTrigger, direction, markerStartOffset);
        _shiftMarker(markerStart, direction, markerStartOffset - (pinOffset || 0));
        _shiftMarker(markerEndTrigger, direction, markerEndOffset);
        _shiftMarker(markerEnd, direction, markerEndOffset - (pinOffset || 0));
      }
      isFirstRefresh && !_refreshingAll && self.update();
      if (onRefresh && !_refreshingAll && !executingOnRefresh) {
        executingOnRefresh = true;
        onRefresh(self);
        executingOnRefresh = false;
      }
    };
    self.getVelocity = function() {
      return (scrollFunc() - scroll2) / (_getTime() - _time2) * 1e3 || 0;
    };
    self.endAnimation = function() {
      _endAnimation(self.callbackAnimation);
      if (animation) {
        scrubTween ? scrubTween.progress(1) : !animation.paused() ? _endAnimation(animation, animation.reversed()) : isToggle || _endAnimation(animation, self.direction < 0, 1);
      }
    };
    self.labelToScroll = function(label) {
      return animation && animation.labels && (start || self.refresh() || start) + animation.labels[label] / animation.duration() * change || 0;
    };
    self.getTrailing = function(name) {
      var i = _triggers.indexOf(self), a = self.direction > 0 ? _triggers.slice(0, i).reverse() : _triggers.slice(i + 1);
      return (_isString(name) ? a.filter(function(t) {
        return t.vars.preventOverlaps === name;
      }) : a).filter(function(t) {
        return self.direction > 0 ? t.end <= start : t.start >= end;
      });
    };
    self.update = function(reset, recordVelocity, forceFake) {
      if (containerAnimation && !forceFake && !reset) {
        return;
      }
      var scroll = _refreshingAll === true ? prevScroll : self.scroll(), p = reset ? 0 : (scroll - start) / change, clipped = p < 0 ? 0 : p > 1 ? 1 : p || 0, prevProgress2 = self.progress, isActive, wasActive, toggleState, action, stateChanged, toggled, isAtMax, isTakingAction;
      if (recordVelocity) {
        scroll2 = scroll1;
        scroll1 = containerAnimation ? scrollFunc() : scroll;
        if (snap) {
          snap2 = snap1;
          snap1 = animation && !isToggle ? animation.totalProgress() : clipped;
        }
      }
      if (anticipatePin && pin && !_refreshing && !_startup && _lastScrollTime) {
        if (!clipped && start < scroll + (scroll - scroll2) / (_getTime() - _time2) * anticipatePin) {
          clipped = 1e-4;
        } else if (clipped === 1 && end > scroll + (scroll - scroll2) / (_getTime() - _time2) * anticipatePin) {
          clipped = 0.9999;
        }
      }
      if (clipped !== prevProgress2 && self.enabled) {
        isActive = self.isActive = !!clipped && clipped < 1;
        wasActive = !!prevProgress2 && prevProgress2 < 1;
        toggled = isActive !== wasActive;
        stateChanged = toggled || !!clipped !== !!prevProgress2;
        self.direction = clipped > prevProgress2 ? 1 : -1;
        self.progress = clipped;
        if (stateChanged && !_refreshing) {
          toggleState = clipped && !prevProgress2 ? 0 : clipped === 1 ? 1 : prevProgress2 === 1 ? 2 : 3;
          if (isToggle) {
            action = !toggled && toggleActions[toggleState + 1] !== "none" && toggleActions[toggleState + 1] || toggleActions[toggleState];
            isTakingAction = animation && (action === "complete" || action === "reset" || action in animation);
          }
        }
        preventOverlaps && (toggled || isTakingAction) && (isTakingAction || scrub || !animation) && (_isFunction(preventOverlaps) ? preventOverlaps(self) : self.getTrailing(preventOverlaps).forEach(function(t) {
          return t.endAnimation();
        }));
        if (!isToggle) {
          if (scrubTween && !_refreshing && !_startup) {
            scrubTween._dp._time - scrubTween._start !== scrubTween._time && scrubTween.render(scrubTween._dp._time - scrubTween._start);
            if (scrubTween.resetTo) {
              scrubTween.resetTo("totalProgress", clipped, animation._tTime / animation._tDur);
            } else {
              scrubTween.vars.totalProgress = clipped;
              scrubTween.invalidate().restart();
            }
          } else if (animation) {
            animation.totalProgress(clipped, !!(_refreshing && (lastRefresh || reset)));
          }
        }
        if (pin) {
          reset && pinSpacing && (spacer.style[pinSpacing + direction.os2] = spacingStart);
          if (!useFixedPosition) {
            pinSetter(_round(pinStart + pinChange * clipped));
          } else if (stateChanged) {
            isAtMax = !reset && clipped > prevProgress2 && end + 1 > scroll && scroll + 1 >= _maxScroll(scroller, direction);
            if (pinReparent) {
              if (!reset && (isActive || isAtMax)) {
                var bounds = _getBounds(pin, true), _offset = scroll - start;
                _reparent(pin, _body, bounds.top + (direction === _vertical ? _offset : 0) + _px, bounds.left + (direction === _vertical ? 0 : _offset) + _px);
              } else {
                _reparent(pin, spacer);
              }
            }
            _setState(isActive || isAtMax ? pinActiveState : pinState);
            pinMoves && clipped < 1 && isActive || pinSetter(pinStart + (clipped === 1 && !isAtMax ? pinChange : 0));
          }
        }
        snap && !tweenTo.tween && !_refreshing && !_startup && snapDelayedCall.restart(true);
        toggleClass && (toggled || once && clipped && (clipped < 1 || !_limitCallbacks)) && _toArray(toggleClass.targets).forEach(function(el) {
          return el.classList[isActive || once ? "add" : "remove"](toggleClass.className);
        });
        onUpdate && !isToggle && !reset && onUpdate(self);
        if (stateChanged && !_refreshing) {
          if (isToggle) {
            if (isTakingAction) {
              if (action === "complete") {
                animation.pause().totalProgress(1);
              } else if (action === "reset") {
                animation.restart(true).pause();
              } else if (action === "restart") {
                animation.restart(true);
              } else {
                animation[action]();
              }
            }
            onUpdate && onUpdate(self);
          }
          if (toggled || !_limitCallbacks) {
            onToggle && toggled && _callback(self, onToggle);
            callbacks[toggleState] && _callback(self, callbacks[toggleState]);
            once && (clipped === 1 ? self.kill(false, 1) : callbacks[toggleState] = 0);
            if (!toggled) {
              toggleState = clipped === 1 ? 1 : 3;
              callbacks[toggleState] && _callback(self, callbacks[toggleState]);
            }
          }
          if (fastScrollEnd && !isActive && Math.abs(self.getVelocity()) > (_isNumber(fastScrollEnd) ? fastScrollEnd : 2500)) {
            _endAnimation(self.callbackAnimation);
            scrubTween ? scrubTween.progress(1) : _endAnimation(animation, action === "reverse" ? 1 : !clipped, 1);
          }
        } else if (isToggle && onUpdate && !_refreshing) {
          onUpdate(self);
        }
      }
      if (markerEndSetter) {
        var n = containerAnimation ? scroll / containerAnimation.duration() * (containerAnimation._caScrollDist || 0) : scroll;
        markerStartSetter(n + (markerStartTrigger._isFlipped ? 1 : 0));
        markerEndSetter(n);
      }
      caMarkerSetter && caMarkerSetter(-scroll / containerAnimation.duration() * (containerAnimation._caScrollDist || 0));
    };
    self.enable = function(reset, refresh) {
      if (!self.enabled) {
        self.enabled = true;
        _addListener(scroller, "resize", _onResize);
        isViewport || _addListener(scroller, "scroll", _onScroll);
        onRefreshInit && _addListener(ScrollTrigger2, "refreshInit", onRefreshInit);
        if (reset !== false) {
          self.progress = prevProgress = 0;
          scroll1 = scroll2 = lastSnap = scrollFunc();
        }
        refresh !== false && self.refresh();
      }
    };
    self.getTween = function(snap3) {
      return snap3 && tweenTo ? tweenTo.tween : scrubTween;
    };
    self.setPositions = function(newStart, newEnd, keepClamp, pinOffset) {
      if (containerAnimation) {
        var st = containerAnimation.scrollTrigger, duration = containerAnimation.duration(), _change = st.end - st.start;
        newStart = st.start + _change * newStart / duration;
        newEnd = st.start + _change * newEnd / duration;
      }
      self.refresh(false, false, {
        start: _keepClamp(newStart, keepClamp && !!self._startClamp),
        end: _keepClamp(newEnd, keepClamp && !!self._endClamp)
      }, pinOffset);
      self.update();
    };
    self.adjustPinSpacing = function(amount) {
      if (spacerState && amount) {
        var i = spacerState.indexOf(direction.d) + 1;
        spacerState[i] = parseFloat(spacerState[i]) + amount + _px;
        spacerState[1] = parseFloat(spacerState[1]) + amount + _px;
        _setState(spacerState);
      }
    };
    self.disable = function(reset, allowAnimation) {
      if (self.enabled) {
        reset !== false && self.revert(true, true);
        self.enabled = self.isActive = false;
        allowAnimation || scrubTween && scrubTween.pause();
        prevScroll = 0;
        pinCache && (pinCache.uncache = 1);
        onRefreshInit && _removeListener(ScrollTrigger2, "refreshInit", onRefreshInit);
        if (snapDelayedCall) {
          snapDelayedCall.pause();
          tweenTo.tween && tweenTo.tween.kill() && (tweenTo.tween = 0);
        }
        if (!isViewport) {
          var i = _triggers.length;
          while (i--) {
            if (_triggers[i].scroller === scroller && _triggers[i] !== self) {
              return;
            }
          }
          _removeListener(scroller, "resize", _onResize);
          isViewport || _removeListener(scroller, "scroll", _onScroll);
        }
      }
    };
    self.kill = function(revert, allowAnimation) {
      self.disable(revert, allowAnimation);
      scrubTween && !allowAnimation && scrubTween.kill();
      id && delete _ids[id];
      var i = _triggers.indexOf(self);
      i >= 0 && _triggers.splice(i, 1);
      i === _i && _direction > 0 && _i--;
      i = 0;
      _triggers.forEach(function(t) {
        return t.scroller === self.scroller && (i = 1);
      });
      i || _refreshingAll || (self.scroll.rec = 0);
      if (animation) {
        animation.scrollTrigger = null;
        revert && animation.revert({
          kill: false
        });
        allowAnimation || animation.kill();
      }
      markerStart && [markerStart, markerEnd, markerStartTrigger, markerEndTrigger].forEach(function(m) {
        return m.parentNode && m.parentNode.removeChild(m);
      });
      _primary === self && (_primary = 0);
      if (pin) {
        pinCache && (pinCache.uncache = 1);
        i = 0;
        _triggers.forEach(function(t) {
          return t.pin === pin && i++;
        });
        i || (pinCache.spacer = 0);
      }
      vars.onKill && vars.onKill(self);
    };
    _triggers.push(self);
    self.enable(false, false);
    customRevertReturn && customRevertReturn(self);
    if (animation && animation.add && !change) {
      var updateFunc = self.update;
      self.update = function() {
        self.update = updateFunc;
        _scrollers.cache++;
        start || end || self.refresh();
      };
      gsap.delayedCall(0.01, self.update);
      change = 0.01;
      start = end = 0;
    } else {
      self.refresh();
    }
    pin && _queueRefreshAll();
  };
  ScrollTrigger2.register = function register(core) {
    if (!_coreInitted) {
      gsap = core || _getGSAP();
      _windowExists() && window.document && ScrollTrigger2.enable();
      _coreInitted = _enabled;
    }
    return _coreInitted;
  };
  ScrollTrigger2.defaults = function defaults(config) {
    if (config) {
      for (var p in config) {
        _defaults[p] = config[p];
      }
    }
    return _defaults;
  };
  ScrollTrigger2.disable = function disable(reset, kill) {
    _enabled = 0;
    _triggers.forEach(function(trigger) {
      return trigger[kill ? "kill" : "disable"](reset);
    });
    _removeListener(_win, "wheel", _onScroll);
    _removeListener(_doc, "scroll", _onScroll);
    clearInterval(_syncInterval);
    _removeListener(_doc, "touchcancel", _passThrough);
    _removeListener(_body, "touchstart", _passThrough);
    _multiListener(_removeListener, _doc, "pointerdown,touchstart,mousedown", _pointerDownHandler);
    _multiListener(_removeListener, _doc, "pointerup,touchend,mouseup", _pointerUpHandler);
    _resizeDelay.kill();
    _iterateAutoRefresh(_removeListener);
    for (var i = 0; i < _scrollers.length; i += 3) {
      _wheelListener(_removeListener, _scrollers[i], _scrollers[i + 1]);
      _wheelListener(_removeListener, _scrollers[i], _scrollers[i + 2]);
    }
  };
  ScrollTrigger2.enable = function enable() {
    _win = window;
    _doc = document;
    _docEl = _doc.documentElement;
    _body = _doc.body;
    if (gsap) {
      _toArray = gsap.utils.toArray;
      _clamp = gsap.utils.clamp;
      _context = gsap.core.context || _passThrough;
      _suppressOverwrites = gsap.core.suppressOverwrites || _passThrough;
      _scrollRestoration = _win.history.scrollRestoration || "auto";
      _lastScroll = _win.pageYOffset || 0;
      gsap.core.globals("ScrollTrigger", ScrollTrigger2);
      if (_body) {
        _enabled = 1;
        _div100vh = document.createElement("div");
        _div100vh.style.height = "100vh";
        _div100vh.style.position = "absolute";
        _refresh100vh();
        _rafBugFix();
        Observer.register(gsap);
        ScrollTrigger2.isTouch = Observer.isTouch;
        _fixIOSBug = Observer.isTouch && /(iPad|iPhone|iPod|Mac)/g.test(navigator.userAgent);
        _ignoreMobileResize = Observer.isTouch === 1;
        _addListener(_win, "wheel", _onScroll);
        _root = [_win, _doc, _docEl, _body];
        if (gsap.matchMedia) {
          ScrollTrigger2.matchMedia = function(vars) {
            var mm = gsap.matchMedia(), p;
            for (p in vars) {
              mm.add(p, vars[p]);
            }
            return mm;
          };
          gsap.addEventListener("matchMediaInit", function() {
            return _revertAll();
          });
          gsap.addEventListener("matchMediaRevert", function() {
            return _revertRecorded();
          });
          gsap.addEventListener("matchMedia", function() {
            _refreshAll(0, 1);
            _dispatch("matchMedia");
          });
          gsap.matchMedia().add("(orientation: portrait)", function() {
            _setBaseDimensions();
            return _setBaseDimensions;
          });
        } else {
          console.warn("Requires GSAP 3.11.0 or later");
        }
        _setBaseDimensions();
        _addListener(_doc, "scroll", _onScroll);
        var bodyHasStyle = _body.hasAttribute("style"), bodyStyle = _body.style, border = bodyStyle.borderTopStyle, AnimationProto = gsap.core.Animation.prototype, bounds, i;
        AnimationProto.revert || Object.defineProperty(AnimationProto, "revert", {
          value: function value() {
            return this.time(-0.01, true);
          }
        });
        bodyStyle.borderTopStyle = "solid";
        bounds = _getBounds(_body);
        _vertical.m = Math.round(bounds.top + _vertical.sc()) || 0;
        _horizontal.m = Math.round(bounds.left + _horizontal.sc()) || 0;
        border ? bodyStyle.borderTopStyle = border : bodyStyle.removeProperty("border-top-style");
        if (!bodyHasStyle) {
          _body.setAttribute("style", "");
          _body.removeAttribute("style");
        }
        _syncInterval = setInterval(_sync, 250);
        gsap.delayedCall(0.5, function() {
          return _startup = 0;
        });
        _addListener(_doc, "touchcancel", _passThrough);
        _addListener(_body, "touchstart", _passThrough);
        _multiListener(_addListener, _doc, "pointerdown,touchstart,mousedown", _pointerDownHandler);
        _multiListener(_addListener, _doc, "pointerup,touchend,mouseup", _pointerUpHandler);
        _transformProp = gsap.utils.checkPrefix("transform");
        _stateProps.push(_transformProp);
        _coreInitted = _getTime();
        _resizeDelay = gsap.delayedCall(0.2, _refreshAll).pause();
        _autoRefresh = [_doc, "visibilitychange", function() {
          var w = _win.innerWidth, h = _win.innerHeight;
          if (_doc.hidden) {
            _prevWidth = w;
            _prevHeight = h;
          } else if (_prevWidth !== w || _prevHeight !== h) {
            _onResize();
          }
        }, _doc, "DOMContentLoaded", _refreshAll, _win, "load", _refreshAll, _win, "resize", _onResize];
        _iterateAutoRefresh(_addListener);
        _triggers.forEach(function(trigger) {
          return trigger.enable(0, 1);
        });
        for (i = 0; i < _scrollers.length; i += 3) {
          _wheelListener(_removeListener, _scrollers[i], _scrollers[i + 1]);
          _wheelListener(_removeListener, _scrollers[i], _scrollers[i + 2]);
        }
      }
    }
  };
  ScrollTrigger2.config = function config(vars) {
    "limitCallbacks" in vars && (_limitCallbacks = !!vars.limitCallbacks);
    var ms = vars.syncInterval;
    ms && clearInterval(_syncInterval) || (_syncInterval = ms) && setInterval(_sync, ms);
    "ignoreMobileResize" in vars && (_ignoreMobileResize = ScrollTrigger2.isTouch === 1 && vars.ignoreMobileResize);
    if ("autoRefreshEvents" in vars) {
      _iterateAutoRefresh(_removeListener) || _iterateAutoRefresh(_addListener, vars.autoRefreshEvents || "none");
      _ignoreResize = (vars.autoRefreshEvents + "").indexOf("resize") === -1;
    }
  };
  ScrollTrigger2.scrollerProxy = function scrollerProxy(target, vars) {
    var t = _getTarget(target), i = _scrollers.indexOf(t), isViewport = _isViewport(t);
    if (~i) {
      _scrollers.splice(i, isViewport ? 6 : 2);
    }
    if (vars) {
      isViewport ? _proxies.unshift(_win, vars, _body, vars, _docEl, vars) : _proxies.unshift(t, vars);
    }
  };
  ScrollTrigger2.clearMatchMedia = function clearMatchMedia(query) {
    _triggers.forEach(function(t) {
      return t._ctx && t._ctx.query === query && t._ctx.kill(true, true);
    });
  };
  ScrollTrigger2.isInViewport = function isInViewport(element, ratio, horizontal) {
    var bounds = (_isString(element) ? _getTarget(element) : element).getBoundingClientRect(), offset = bounds[horizontal ? _width : _height] * ratio || 0;
    return horizontal ? bounds.right - offset > 0 && bounds.left + offset < _win.innerWidth : bounds.bottom - offset > 0 && bounds.top + offset < _win.innerHeight;
  };
  ScrollTrigger2.positionInViewport = function positionInViewport(element, referencePoint, horizontal) {
    _isString(element) && (element = _getTarget(element));
    var bounds = element.getBoundingClientRect(), size = bounds[horizontal ? _width : _height], offset = referencePoint == null ? size / 2 : referencePoint in _keywords ? _keywords[referencePoint] * size : ~referencePoint.indexOf("%") ? parseFloat(referencePoint) * size / 100 : parseFloat(referencePoint) || 0;
    return horizontal ? (bounds.left + offset) / _win.innerWidth : (bounds.top + offset) / _win.innerHeight;
  };
  ScrollTrigger2.killAll = function killAll(allowListeners) {
    _triggers.slice(0).forEach(function(t) {
      return t.vars.id !== "ScrollSmoother" && t.kill();
    });
    if (allowListeners !== true) {
      var listeners = _listeners.killAll || [];
      _listeners = {};
      listeners.forEach(function(f) {
        return f();
      });
    }
  };
  return ScrollTrigger2;
}();
ScrollTrigger.version = "3.13.0";
ScrollTrigger.saveStyles = function(targets) {
  return targets ? _toArray(targets).forEach(function(target) {
    if (target && target.style) {
      var i = _savedStyles.indexOf(target);
      i >= 0 && _savedStyles.splice(i, 5);
      _savedStyles.push(target, target.style.cssText, target.getBBox && target.getAttribute("transform"), gsap.core.getCache(target), _context());
    }
  }) : _savedStyles;
};
ScrollTrigger.revert = function(soft, media) {
  return _revertAll(!soft, media);
};
ScrollTrigger.create = function(vars, animation) {
  return new ScrollTrigger(vars, animation);
};
ScrollTrigger.refresh = function(safe) {
  return safe ? _onResize(true) : (_coreInitted || ScrollTrigger.register()) && _refreshAll(true);
};
ScrollTrigger.update = function(force) {
  return ++_scrollers.cache && _updateAll(force === true ? 2 : 0);
};
ScrollTrigger.clearScrollMemory = _clearScrollMemory;
ScrollTrigger.maxScroll = function(element, horizontal) {
  return _maxScroll(element, horizontal ? _horizontal : _vertical);
};
ScrollTrigger.getScrollFunc = function(element, horizontal) {
  return _getScrollFunc(_getTarget(element), horizontal ? _horizontal : _vertical);
};
ScrollTrigger.getById = function(id) {
  return _ids[id];
};
ScrollTrigger.getAll = function() {
  return _triggers.filter(function(t) {
    return t.vars.id !== "ScrollSmoother";
  });
};
ScrollTrigger.isScrolling = function() {
  return !!_lastScrollTime;
};
ScrollTrigger.snapDirectional = _snapDirectional;
ScrollTrigger.addEventListener = function(type, callback) {
  var a = _listeners[type] || (_listeners[type] = []);
  ~a.indexOf(callback) || a.push(callback);
};
ScrollTrigger.removeEventListener = function(type, callback) {
  var a = _listeners[type], i = a && a.indexOf(callback);
  i >= 0 && a.splice(i, 1);
};
ScrollTrigger.batch = function(targets, vars) {
  var result = [], varsCopy = {}, interval = vars.interval || 0.016, batchMax = vars.batchMax || 1e9, proxyCallback = function proxyCallback2(type, callback) {
    var elements = [], triggers = [], delay = gsap.delayedCall(interval, function() {
      callback(elements, triggers);
      elements = [];
      triggers = [];
    }).pause();
    return function(self) {
      elements.length || delay.restart(true);
      elements.push(self.trigger);
      triggers.push(self);
      batchMax <= elements.length && delay.progress(1);
    };
  }, p;
  for (p in vars) {
    varsCopy[p] = p.substr(0, 2) === "on" && _isFunction(vars[p]) && p !== "onRefreshInit" ? proxyCallback(p, vars[p]) : vars[p];
  }
  if (_isFunction(batchMax)) {
    batchMax = batchMax();
    _addListener(ScrollTrigger, "refresh", function() {
      return batchMax = vars.batchMax();
    });
  }
  _toArray(targets).forEach(function(target) {
    var config = {};
    for (p in varsCopy) {
      config[p] = varsCopy[p];
    }
    config.trigger = target;
    result.push(ScrollTrigger.create(config));
  });
  return result;
};
var _clampScrollAndGetDurationMultiplier = function _clampScrollAndGetDurationMultiplier2(scrollFunc, current, end, max) {
  current > max ? scrollFunc(max) : current < 0 && scrollFunc(0);
  return end > max ? (max - current) / (end - current) : end < 0 ? current / (current - end) : 1;
}, _allowNativePanning = function _allowNativePanning2(target, direction) {
  if (direction === true) {
    target.style.removeProperty("touch-action");
  } else {
    target.style.touchAction = direction === true ? "auto" : direction ? "pan-" + direction + (Observer.isTouch ? " pinch-zoom" : "") : "none";
  }
  target === _docEl && _allowNativePanning2(_body, direction);
}, _overflow = {
  auto: 1,
  scroll: 1
}, _nestedScroll = function _nestedScroll2(_ref5) {
  var event = _ref5.event, target = _ref5.target, axis = _ref5.axis;
  var node = (event.changedTouches ? event.changedTouches[0] : event).target, cache = node._gsap || gsap.core.getCache(node), time = _getTime(), cs;
  if (!cache._isScrollT || time - cache._isScrollT > 2e3) {
    while (node && node !== _body && (node.scrollHeight <= node.clientHeight && node.scrollWidth <= node.clientWidth || !(_overflow[(cs = _getComputedStyle(node)).overflowY] || _overflow[cs.overflowX]))) {
      node = node.parentNode;
    }
    cache._isScroll = node && node !== target && !_isViewport(node) && (_overflow[(cs = _getComputedStyle(node)).overflowY] || _overflow[cs.overflowX]);
    cache._isScrollT = time;
  }
  if (cache._isScroll || axis === "x") {
    event.stopPropagation();
    event._gsapAllow = true;
  }
}, _inputObserver = function _inputObserver2(target, type, inputs, nested) {
  return Observer.create({
    target,
    capture: true,
    debounce: false,
    lockAxis: true,
    type,
    onWheel: nested = nested && _nestedScroll,
    onPress: nested,
    onDrag: nested,
    onScroll: nested,
    onEnable: function onEnable() {
      return inputs && _addListener(_doc, Observer.eventTypes[0], _captureInputs, false, true);
    },
    onDisable: function onDisable() {
      return _removeListener(_doc, Observer.eventTypes[0], _captureInputs, true);
    }
  });
}, _inputExp = /(input|label|select|textarea)/i, _inputIsFocused, _captureInputs = function _captureInputs2(e) {
  var isInput = _inputExp.test(e.target.tagName);
  if (isInput || _inputIsFocused) {
    e._gsapAllow = true;
    _inputIsFocused = isInput;
  }
}, _getScrollNormalizer = function _getScrollNormalizer2(vars) {
  _isObject(vars) || (vars = {});
  vars.preventDefault = vars.isNormalizer = vars.allowClicks = true;
  vars.type || (vars.type = "wheel,touch");
  vars.debounce = !!vars.debounce;
  vars.id = vars.id || "normalizer";
  var _vars2 = vars, normalizeScrollX = _vars2.normalizeScrollX, momentum = _vars2.momentum, allowNestedScroll = _vars2.allowNestedScroll, onRelease = _vars2.onRelease, self, maxY, target = _getTarget(vars.target) || _docEl, smoother = gsap.core.globals().ScrollSmoother, smootherInstance = smoother && smoother.get(), content = _fixIOSBug && (vars.content && _getTarget(vars.content) || smootherInstance && vars.content !== false && !smootherInstance.smooth() && smootherInstance.content()), scrollFuncY = _getScrollFunc(target, _vertical), scrollFuncX = _getScrollFunc(target, _horizontal), scale = 1, initialScale = (Observer.isTouch && _win.visualViewport ? _win.visualViewport.scale * _win.visualViewport.width : _win.outerWidth) / _win.innerWidth, wheelRefresh = 0, resolveMomentumDuration = _isFunction(momentum) ? function() {
    return momentum(self);
  } : function() {
    return momentum || 2.8;
  }, lastRefreshID, skipTouchMove, inputObserver = _inputObserver(target, vars.type, true, allowNestedScroll), resumeTouchMove = function resumeTouchMove2() {
    return skipTouchMove = false;
  }, scrollClampX = _passThrough, scrollClampY = _passThrough, updateClamps = function updateClamps2() {
    maxY = _maxScroll(target, _vertical);
    scrollClampY = _clamp(_fixIOSBug ? 1 : 0, maxY);
    normalizeScrollX && (scrollClampX = _clamp(0, _maxScroll(target, _horizontal)));
    lastRefreshID = _refreshID;
  }, removeContentOffset = function removeContentOffset2() {
    content._gsap.y = _round(parseFloat(content._gsap.y) + scrollFuncY.offset) + "px";
    content.style.transform = "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, " + parseFloat(content._gsap.y) + ", 0, 1)";
    scrollFuncY.offset = scrollFuncY.cacheID = 0;
  }, ignoreDrag = function ignoreDrag2() {
    if (skipTouchMove) {
      requestAnimationFrame(resumeTouchMove);
      var offset = _round(self.deltaY / 2), scroll = scrollClampY(scrollFuncY.v - offset);
      if (content && scroll !== scrollFuncY.v + scrollFuncY.offset) {
        scrollFuncY.offset = scroll - scrollFuncY.v;
        var y = _round((parseFloat(content && content._gsap.y) || 0) - scrollFuncY.offset);
        content.style.transform = "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, " + y + ", 0, 1)";
        content._gsap.y = y + "px";
        scrollFuncY.cacheID = _scrollers.cache;
        _updateAll();
      }
      return true;
    }
    scrollFuncY.offset && removeContentOffset();
    skipTouchMove = true;
  }, tween, startScrollX, startScrollY, onStopDelayedCall, onResize = function onResize2() {
    updateClamps();
    if (tween.isActive() && tween.vars.scrollY > maxY) {
      scrollFuncY() > maxY ? tween.progress(1) && scrollFuncY(maxY) : tween.resetTo("scrollY", maxY);
    }
  };
  content && gsap.set(content, {
    y: "+=0"
  });
  vars.ignoreCheck = function(e) {
    return _fixIOSBug && e.type === "touchmove" && ignoreDrag() || scale > 1.05 && e.type !== "touchstart" || self.isGesturing || e.touches && e.touches.length > 1;
  };
  vars.onPress = function() {
    skipTouchMove = false;
    var prevScale = scale;
    scale = _round((_win.visualViewport && _win.visualViewport.scale || 1) / initialScale);
    tween.pause();
    prevScale !== scale && _allowNativePanning(target, scale > 1.01 ? true : normalizeScrollX ? false : "x");
    startScrollX = scrollFuncX();
    startScrollY = scrollFuncY();
    updateClamps();
    lastRefreshID = _refreshID;
  };
  vars.onRelease = vars.onGestureStart = function(self2, wasDragging) {
    scrollFuncY.offset && removeContentOffset();
    if (!wasDragging) {
      onStopDelayedCall.restart(true);
    } else {
      _scrollers.cache++;
      var dur = resolveMomentumDuration(), currentScroll, endScroll;
      if (normalizeScrollX) {
        currentScroll = scrollFuncX();
        endScroll = currentScroll + dur * 0.05 * -self2.velocityX / 0.227;
        dur *= _clampScrollAndGetDurationMultiplier(scrollFuncX, currentScroll, endScroll, _maxScroll(target, _horizontal));
        tween.vars.scrollX = scrollClampX(endScroll);
      }
      currentScroll = scrollFuncY();
      endScroll = currentScroll + dur * 0.05 * -self2.velocityY / 0.227;
      dur *= _clampScrollAndGetDurationMultiplier(scrollFuncY, currentScroll, endScroll, _maxScroll(target, _vertical));
      tween.vars.scrollY = scrollClampY(endScroll);
      tween.invalidate().duration(dur).play(0.01);
      if (_fixIOSBug && tween.vars.scrollY >= maxY || currentScroll >= maxY - 1) {
        gsap.to({}, {
          onUpdate: onResize,
          duration: dur
        });
      }
    }
    onRelease && onRelease(self2);
  };
  vars.onWheel = function() {
    tween._ts && tween.pause();
    if (_getTime() - wheelRefresh > 1e3) {
      lastRefreshID = 0;
      wheelRefresh = _getTime();
    }
  };
  vars.onChange = function(self2, dx, dy, xArray, yArray) {
    _refreshID !== lastRefreshID && updateClamps();
    dx && normalizeScrollX && scrollFuncX(scrollClampX(xArray[2] === dx ? startScrollX + (self2.startX - self2.x) : scrollFuncX() + dx - xArray[1]));
    if (dy) {
      scrollFuncY.offset && removeContentOffset();
      var isTouch = yArray[2] === dy, y = isTouch ? startScrollY + self2.startY - self2.y : scrollFuncY() + dy - yArray[1], yClamped = scrollClampY(y);
      isTouch && y !== yClamped && (startScrollY += yClamped - y);
      scrollFuncY(yClamped);
    }
    (dy || dx) && _updateAll();
  };
  vars.onEnable = function() {
    _allowNativePanning(target, normalizeScrollX ? false : "x");
    ScrollTrigger.addEventListener("refresh", onResize);
    _addListener(_win, "resize", onResize);
    if (scrollFuncY.smooth) {
      scrollFuncY.target.style.scrollBehavior = "auto";
      scrollFuncY.smooth = scrollFuncX.smooth = false;
    }
    inputObserver.enable();
  };
  vars.onDisable = function() {
    _allowNativePanning(target, true);
    _removeListener(_win, "resize", onResize);
    ScrollTrigger.removeEventListener("refresh", onResize);
    inputObserver.kill();
  };
  vars.lockAxis = vars.lockAxis !== false;
  self = new Observer(vars);
  self.iOS = _fixIOSBug;
  _fixIOSBug && !scrollFuncY() && scrollFuncY(1);
  _fixIOSBug && gsap.ticker.add(_passThrough);
  onStopDelayedCall = self._dc;
  tween = gsap.to(self, {
    ease: "power4",
    paused: true,
    inherit: false,
    scrollX: normalizeScrollX ? "+=0.1" : "+=0",
    scrollY: "+=0.1",
    modifiers: {
      scrollY: _interruptionTracker(scrollFuncY, scrollFuncY(), function() {
        return tween.pause();
      })
    },
    onUpdate: _updateAll,
    onComplete: onStopDelayedCall.vars.onComplete
  });
  return self;
};
ScrollTrigger.sort = function(func) {
  if (_isFunction(func)) {
    return _triggers.sort(func);
  }
  var scroll = _win.pageYOffset || 0;
  ScrollTrigger.getAll().forEach(function(t) {
    return t._sortY = t.trigger ? scroll + t.trigger.getBoundingClientRect().top : t.start + _win.innerHeight;
  });
  return _triggers.sort(func || function(a, b) {
    return (a.vars.refreshPriority || 0) * -1e6 + (a.vars.containerAnimation ? 1e6 : a._sortY) - ((b.vars.containerAnimation ? 1e6 : b._sortY) + (b.vars.refreshPriority || 0) * -1e6);
  });
};
ScrollTrigger.observe = function(vars) {
  return new Observer(vars);
};
ScrollTrigger.normalizeScroll = function(vars) {
  if (typeof vars === "undefined") {
    return _normalizer;
  }
  if (vars === true && _normalizer) {
    return _normalizer.enable();
  }
  if (vars === false) {
    _normalizer && _normalizer.kill();
    _normalizer = vars;
    return;
  }
  var normalizer = vars instanceof Observer ? vars : _getScrollNormalizer(vars);
  _normalizer && _normalizer.target === normalizer.target && _normalizer.kill();
  _isViewport(normalizer.target) && (_normalizer = normalizer);
  return normalizer;
};
ScrollTrigger.core = {
  // smaller file size way to leverage in ScrollSmoother and Observer
  _getVelocityProp,
  _inputObserver,
  _scrollers,
  _proxies,
  bridge: {
    // when normalizeScroll sets the scroll position (ss = setScroll)
    ss: function ss() {
      _lastScrollTime || _dispatch("scrollStart");
      _lastScrollTime = _getTime();
    },
    // a way to get the _refreshing value in Observer
    ref: function ref() {
      return _refreshing;
    }
  }
};
_getGSAP() && gsap.registerPlugin(ScrollTrigger);
var aosExports = requireAos();
const AOS = /* @__PURE__ */ getDefaultExportFromCjs(aosExports);
class Lightbox {
  constructor() {
    this.currentIndex = 0;
    this.images = [];
    this.isOpen = false;
    this.init();
  }
  init() {
    this.createLightbox();
    this.bindEvents();
  }
  createLightbox() {
    const lightboxHTML = `
            <div id="lightbox" class="lightbox" aria-hidden="true" role="dialog" aria-labelledby="lightbox-title" aria-describedby="lightbox-description">
                <div class="lightbox-overlay"></div>
                <div class="lightbox-content">
                    <div class="lightbox-header">
                        <h2 id="lightbox-title" class="lightbox-title"></h2>
                        <button class="lightbox-close" aria-label="Close lightbox" title="Close">&times;</button>
                    </div>
                    <div class="lightbox-main">
                        <button class="lightbox-nav lightbox-prev" aria-label="Previous image" title="Previous">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                            </svg>
                        </button>
                        <div class="lightbox-image-container">
                            <img class="lightbox-image" src="" alt="" loading="lazy">
                        </div>
                        <button class="lightbox-nav lightbox-next" aria-label="Next image" title="Next">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="lightbox-footer">
                        <p id="lightbox-description" class="lightbox-description"></p>
                        <div class="lightbox-counter">
                            <span class="current-index">1</span> / <span class="total-images">1</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    document.body.insertAdjacentHTML("beforeend", lightboxHTML);
    this.lightboxElement = document.getElementById("lightbox");
    this.lightboxImage = this.lightboxElement.querySelector(".lightbox-image");
    this.lightboxTitle = this.lightboxElement.querySelector(".lightbox-title");
    this.lightboxDescription = this.lightboxElement.querySelector(".lightbox-description");
    this.currentIndexElement = this.lightboxElement.querySelector(".current-index");
    this.totalImagesElement = this.lightboxElement.querySelector(".total-images");
  }
  bindEvents() {
    this.lightboxElement.querySelector(".lightbox-close").addEventListener("click", () => {
      this.close();
    });
    this.lightboxElement.querySelector(".lightbox-prev").addEventListener("click", () => {
      this.prev();
    });
    this.lightboxElement.querySelector(".lightbox-next").addEventListener("click", () => {
      this.next();
    });
    this.lightboxElement.querySelector(".lightbox-overlay").addEventListener("click", () => {
      this.close();
    });
    document.addEventListener("keydown", (e) => {
      if (!this.isOpen) return;
      switch (e.key) {
        case "Escape":
          this.close();
          break;
        case "ArrowLeft":
          this.prev();
          break;
        case "ArrowRight":
          this.next();
          break;
      }
    });
    this.lightboxImage.addEventListener("load", () => {
    });
    this.lightboxImage.addEventListener("error", () => {
      this.lightboxImage.alt = "Image failed to load";
    });
  }
  open(images, index = 0) {
    this.images = images;
    this.currentIndex = index;
    this.isOpen = true;
    this.totalImagesElement.textContent = this.images.length;
    this.lightboxElement.classList.add("active");
    this.lightboxElement.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    this.loadImage();
    this.lightboxElement.querySelector(".lightbox-close").focus();
  }
  close() {
    this.isOpen = false;
    this.lightboxElement.classList.remove("active");
    this.lightboxElement.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    setTimeout(() => {
      this.lightboxImage.src = "";
    }, 300);
  }
  prev() {
    if (this.images.length <= 1) return;
    this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.images.length - 1;
    this.loadImage();
  }
  next() {
    if (this.images.length <= 1) return;
    this.currentIndex = this.currentIndex < this.images.length - 1 ? this.currentIndex + 1 : 0;
    this.loadImage();
  }
  loadImage() {
    const imageData = this.images[this.currentIndex];
    this.lightboxTitle.textContent = imageData.title || "";
    this.lightboxDescription.textContent = imageData.category || "";
    this.currentIndexElement.textContent = this.currentIndex + 1;
    this.lightboxImage.src = imageData.src;
    this.lightboxImage.alt = imageData.alt || imageData.title || "";
    const prevBtn = this.lightboxElement.querySelector(".lightbox-prev");
    const nextBtn = this.lightboxElement.querySelector(".lightbox-next");
    if (this.images.length <= 1) {
      prevBtn.style.display = "none";
      nextBtn.style.display = "none";
    } else {
      prevBtn.style.display = "flex";
      nextBtn.style.display = "flex";
    }
  }
}
const galleryImages = {
  commercial: [
    { filename: "advance-auto-parking-lot-2.webp", title: "Advance Auto Parking Lot 2", alt: "Commercial parking lot paving for Advance Auto Parts" },
    { filename: "advance-auto-parking-lot-3.webp", title: "Advance Auto Parking Lot 3", alt: "Commercial parking lot paving for Advance Auto Parts" },
    { filename: "advance-auto-parking-lot.webp", title: "Advance Auto Parking Lot", alt: "Commercial parking lot paving for Advance Auto Parts" },
    { filename: "amg.webp", title: "AMG Commercial Project", alt: "Commercial paving project for AMG facility" },
    { filename: "apartment-complex-2.webp", title: "Apartment Complex 2", alt: "Apartment complex parking lot paving project" },
    { filename: "apartment-complex-3.webp", title: "Apartment Complex 3", alt: "Apartment complex parking lot paving project" },
    { filename: "apartment-complex-4.webp", title: "Apartment Complex 4", alt: "Apartment complex parking lot paving project" },
    { filename: "apartment-complex.webp", title: "Apartment Complex", alt: "Apartment complex parking lot paving project" },
    { filename: "apartments-garages-parking-lot-2.webp", title: "Apartments Garages Parking Lot 2", alt: "Parking lot paving for apartments with garages" },
    { filename: "apartments-garages-parking-lot-3-leeboy.webp", title: "Apartments Garages Parking Lot with Leeboy", alt: "Apartment parking lot paving with Leeboy equipment" },
    { filename: "apartments-garages-parking-lot.webp", title: "Apartments Garages Parking Lot", alt: "Parking lot paving for apartments with garages" },
    { filename: "asphalt-around-garage.webp", title: "Asphalt Around Garage", alt: "Asphalt paving work around commercial garage" },
    { filename: "before-after-riesebecks.webp", title: "Before After Riesbecks", alt: "Before and after comparison of Riesbecks parking lot" },
    { filename: "before-apartment-wreck.webp", title: "Before Apartment Reconstruction", alt: "Apartment parking lot before reconstruction work" },
    { filename: "behind-overhang-parking-lot.webp", title: "Behind Overhang Parking Lot", alt: "Parking lot paving behind building overhang" },
    { filename: "church-parking-lot-2.webp", title: "Church Parking Lot 2", alt: "Church parking lot paving project" },
    { filename: "church-parking-lot.webp", title: "Church Parking Lot", alt: "Church parking lot paving project" },
    { filename: "cinemark-colony-square.webp", title: "Cinemark Colony Square", alt: "Parking lot paving for Cinemark Colony Square theater" },
    { filename: "commercial-parking-lot-apartments-church.webp", title: "Commercial Parking Lot Apartments Church", alt: "Combined commercial parking lot for apartments and church" },
    { filename: "downtown-st-james-2.webp", title: "Downtown St James 2", alt: "Downtown St. James street paving project" },
    { filename: "downtown-st-james-stripped.webp", title: "Downtown St James Stripped", alt: "Downtown St. James with fresh line striping" },
    { filename: "downtown-st-james.webp", title: "Downtown St James", alt: "Downtown St. James street paving project" },
    { filename: "east-pike-shopping-center.webp", title: "East Pike Shopping Center", alt: "East Pike Shopping Center parking lot paving" },
    { filename: "five-below-2.webp", title: "Five Below 2", alt: "Five Below store parking lot paving project" },
    { filename: "five-below.webp", title: "Five Below", alt: "Five Below store parking lot paving project" },
    { filename: "florist.webp", title: "Florist", alt: "Florist shop parking lot paving project" },
    { filename: "formal-affairs.webp", title: "Formal Affairs", alt: "Formal Affairs business parking lot paving" },
    { filename: "garage-apartments-parking-lot.webp", title: "Garage Apartments Parking Lot", alt: "Parking lot for apartment garages" },
    { filename: "hamilton-waltman-melsheimer-2.webp", title: "Hamilton Waltman Melsheimer 2", alt: "Hamilton Waltman Melsheimer commercial paving project" },
    { filename: "hamilton-waltman-melsheimer-3.webp", title: "Hamilton Waltman Melsheimer 3", alt: "Hamilton Waltman Melsheimer commercial paving project" },
    { filename: "hamilton-waltman-melsheimer-4.webp", title: "Hamilton Waltman Melsheimer 4", alt: "Hamilton Waltman Melsheimer commercial paving project" },
    { filename: "hamilton-waltman-melsheimer-5.webp", title: "Hamilton Waltman Melsheimer 5", alt: "Hamilton Waltman Melsheimer commercial paving project" },
    { filename: "hamilton-waltman-melsheimer.webp", title: "Hamilton Waltman Melsheimer", alt: "Hamilton Waltman Melsheimer commercial paving project" },
    { filename: "holiday-inn-express-2.webp", title: "Holiday Inn Express 2", alt: "Holiday Inn Express parking lot paving project" },
    { filename: "holiday-inn-express.webp", title: "Holiday Inn Express", alt: "Holiday Inn Express parking lot paving project" },
    { filename: "large-open-parking-lot.webp", title: "Large Open Parking Lot", alt: "Large open commercial parking lot paving" },
    { filename: "leeboy-colony-square-mall.webp", title: "Leeboy Colony Square Mall", alt: "Colony Square Mall paving with Leeboy equipment" },
    { filename: "leeboy-condos.webp", title: "Leeboy Condos", alt: "Condominium parking lot paving with Leeboy equipment" },
    { filename: "leeboy-overhang.webp", title: "Leeboy Overhang", alt: "Paving work under overhang with Leeboy equipment" },
    { filename: "leeboy-riesbecks.webp", title: "Leeboy Riesbecks", alt: "Riesbecks parking lot paving with Leeboy equipment" },
    { filename: "leeboy-trailer-park.webp", title: "Leeboy Trailer Park", alt: "Trailer park paving with Leeboy equipment" },
    { filename: "lined-parking-lot.webp", title: "Lined Parking Lot", alt: "Commercial parking lot with fresh line striping" },
    { filename: "military-apartments-parking-lot.webp", title: "Military Apartments Parking Lot", alt: "Military apartments parking lot paving project" },
    { filename: "open-parking-area-behind-apartments.webp", title: "Open Parking Area Behind Apartments", alt: "Open parking area behind apartment complex" },
    { filename: "open-parking-lot-2.webp", title: "Open Parking Lot 2", alt: "Open commercial parking lot paving project" },
    { filename: "open-parking-lot-3.webp", title: "Open Parking Lot 3", alt: "Open commercial parking lot paving project" },
    { filename: "open-parking-lot-4.webp", title: "Open Parking Lot 4", alt: "Open commercial parking lot paving project" },
    { filename: "open-parking-lot.webp", title: "Open Parking Lot", alt: "Open commercial parking lot paving project" },
    { filename: "parking-lot-paved-wooded-area.webp", title: "Parking Lot Paved Wooded Area", alt: "Parking lot paving in wooded area" },
    { filename: "parking-lot.webp", title: "Parking Lot", alt: "Commercial parking lot paving project" },
    { filename: "paved-strip-mall.webp", title: "Paved Strip Mall", alt: "Strip mall parking lot paving project" },
    { filename: "paver-parking-lot.webp", title: "Paver Parking Lot", alt: "Commercial parking lot with paver work" },
    { filename: "private-road-apartments.webp", title: "Private Road Apartments", alt: "Private road paving for apartment complex" },
    { filename: "reisbecks-parking-lot-5.webp", title: "Riesbecks Parking Lot 5", alt: "Riesbecks store parking lot paving project" },
    { filename: "reisebecks-parking-lot-2.webp", title: "Riesbecks Parking Lot 2", alt: "Riesbecks store parking lot paving project" },
    { filename: "reisebecks-parking-lot-3.webp", title: "Riesbecks Parking Lot 3", alt: "Riesbecks store parking lot paving project" },
    { filename: "reisebecks-parking-lot-4.webp", title: "Riesbecks Parking Lot 4", alt: "Riesbecks store parking lot paving project" },
    { filename: "reisebecks-parking-lot.webp", title: "Riesbecks Parking Lot", alt: "Riesbecks store parking lot paving project" },
    { filename: "roller-dump-workers-working.webp", title: "Roller Dump Workers Working", alt: "Workers operating roller and dump equipment" },
    { filename: "roller-open-parking-lot.webp", title: "Roller Open Parking Lot", alt: "Open parking lot paving with roller equipment" },
    { filename: "roller-parking-lot.webp", title: "Roller Parking Lot", alt: "Parking lot paving with roller equipment" },
    { filename: "rolller-private-road.webp", title: "Roller Private Road", alt: "Private road paving with roller equipment" },
    { filename: "roseville-drive-thru-parking-lot-2.webp", title: "Roseville Drive Thru Parking Lot 2", alt: "Roseville drive-thru parking lot paving" },
    { filename: "roseville-drive-thru-parking-lot-e.webp", title: "Roseville Drive Thru Parking Lot E", alt: "Roseville drive-thru parking lot paving" },
    { filename: "roseville-drive-thru-parking-lot.webp", title: "Roseville Drive Thru Parking Lot", alt: "Roseville drive-thru parking lot paving" },
    { filename: "school-0-ring.webp", title: "School O Ring", alt: "School property paving with circular design" },
    { filename: "school-entryway.webp", title: "School Entryway", alt: "School entryway paving project" },
    { filename: "steamy-parking-lot.webp", title: "Steamy Parking Lot", alt: "Parking lot with steam from fresh asphalt" },
    { filename: "the-barn-after.webp", title: "The Barn After", alt: "The Barn parking lot after paving completion" },
    { filename: "the-barn-before.webp", title: "The Barn Before", alt: "The Barn parking lot before paving work" },
    { filename: "the-barn-parking-lot.webp", title: "The Barn Parking Lot", alt: "The Barn parking lot paving project" },
    { filename: "wilsons.webp", title: "Wilsons", alt: "Wilsons business parking lot paving project" },
    { filename: "workers-not-working-more.webp", title: "Workers Not Working More", alt: "Construction workers taking a break" },
    { filename: "workers-not-working.webp", title: "Workers Not Working", alt: "Construction workers taking a break" },
    { filename: "workers-working-overhang.webp", title: "Workers Working Overhang", alt: "Workers paving under building overhang" }
  ],
  residential: [
    { filename: "asphalt-driveway-barn.webp", title: "Asphalt Driveway Barn", alt: "Residential driveway leading to barn" },
    { filename: "asphalt-driveway-turnaround-2.webp", title: "Asphalt Driveway Turnaround 2", alt: "Residential driveway with turnaround area" },
    { filename: "asphalt-driveway-turnaround.webp", title: "Asphalt Driveway Turnaround", alt: "Residential driveway with turnaround area" },
    { filename: "austins-truck-college.webp", title: "Austins Truck College", alt: "Driveway for Austins Truck College" },
    { filename: "bungalow-driveway.webp", title: "Bungalow Driveway", alt: "Charming bungalow house driveway" },
    { filename: "cart-path-to-landing.webp", title: "Cart Path To Landing", alt: "Cart path leading to landing area" },
    { filename: "clearing-driveway.webp", title: "Clearing Driveway", alt: "Driveway through cleared wooded area" },
    { filename: "custom-mansion-driveway-2.webp", title: "Custom Mansion Driveway 2", alt: "Luxury mansion custom driveway design" },
    { filename: "custom-mansion-driveway-3.webp", title: "Custom Mansion Driveway 3", alt: "Luxury mansion custom driveway design" },
    { filename: "custom-mansion-driveway-4.webp", title: "Custom Mansion Driveway 4", alt: "Luxury mansion custom driveway design" },
    { filename: "custom-mansion-driveway.webp", title: "Custom Mansion Driveway", alt: "Luxury mansion custom driveway design" },
    { filename: "driveway-garage-door.webp", title: "Driveway Garage Door", alt: "Residential driveway leading to garage" },
    { filename: "driveway-turnaround-area-2.webp", title: "Driveway Turnaround Area 2", alt: "Residential driveway turnaround area" },
    { filename: "driveway-turnaround-area.webp", title: "Driveway Turnaround Area", alt: "Residential driveway turnaround area" },
    { filename: "flagpole-driveway-country-2.webp", title: "Flagpole Driveway Country 2", alt: "Country driveway with flagpole" },
    { filename: "flagpole-driveway-country.webp", title: "Flagpole Driveway Country", alt: "Country driveway with flagpole" },
    { filename: "long-driveway-bridge.webp", title: "Long Driveway Bridge", alt: "Long residential driveway with bridge" },
    { filename: "long-driveway-to-road.webp", title: "Long Driveway To Road", alt: "Long residential driveway connecting to road" },
    { filename: "open-basketball-court.webp", title: "Open Basketball Court", alt: "Residential basketball court paving" },
    { filename: "pond-asphalt-driveway.webp", title: "Pond Asphalt Driveway", alt: "Asphalt driveway near pond" },
    { filename: "roller-residential-driveway.webp", title: "Roller Residential Driveway", alt: "Residential driveway with roller equipment" },
    { filename: "stone-lined-paved-driveway-2.webp", title: "Stone Lined Paved Driveway 2", alt: "Paved driveway with decorative stone lining" },
    { filename: "stone-lined-paved-driveway.webp", title: "Stone Lined Paved Driveway", alt: "Paved driveway with decorative stone lining" }
  ],
  equipment: [
    { filename: "leeboy-closeup.webp", title: "Leeboy Closeup", alt: "Close-up view of Leeboy paving equipment" },
    { filename: "leeboy-dropping-tar.webp", title: "Leeboy Dropping Tar", alt: "Leeboy equipment applying tar/asphalt" },
    { filename: "leeboy-top-down.webp", title: "Leeboy Top Down", alt: "Top-down view of Leeboy paving equipment" },
    { filename: "loading-leeboy-2.webp", title: "Loading Leeboy 2", alt: "Loading Leeboy paving equipment" },
    { filename: "loading-leeboy.webp", title: "Loading Leeboy", alt: "Loading Leeboy paving equipment" }
  ],
  concrete: [
    { filename: "concrete-pad.webp", title: "Concrete Pad", alt: "Concrete pad installation project" },
    { filename: "convenience-store.webp", title: "Convenience Store", alt: "Concrete work at convenience store" },
    { filename: "manhole-cover.webp", title: "Manhole Cover", alt: "Concrete manhole cover installation" },
    { filename: "square-drain-cover.webp", title: "Square Drain Cover", alt: "Square concrete drain cover installation" }
  ]
};
var define_process_env_default = {};
function detectVercelEnvironment() {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname.endsWith(".vercel.app")) return true;
    if (hostname.includes("vercel.app")) return true;
    const vercelScript = document.querySelector('script[src*="vercel-scripts.com"]');
    if (vercelScript) return true;
  }
  if (typeof process !== "undefined" && define_process_env_default) {
    if (define_process_env_default.VERCEL || define_process_env_default.VERCEL_ENV || define_process_env_default.VERCEL_URL) return true;
    if (define_process_env_default.VITE_PLATFORM === "vercel" || define_process_env_default.DEPLOY_PLATFORM === "vercel") return true;
  }
  return false;
}
function detectGitHubPagesEnvironment() {
  return true;
}
const IS_VERCEL_DETECTED = detectVercelEnvironment();
const IS_GITHUB_PAGES_DETECTED = detectGitHubPagesEnvironment();
const BASE_URL = /* @__PURE__ */ (() => {
  return "/Neff-Paving/";
})();
const DEPLOY_MODE = /* @__PURE__ */ (() => {
  return "github";
})();
const BUILD_TIMESTAMP = "2025-08-03T01:19:13.116Z";
const DEPLOY_TIME = 1754183953116;
const IS_VERCEL = IS_VERCEL_DETECTED;
const IS_GITHUB_PAGES = IS_GITHUB_PAGES_DETECTED;
const shouldDebug = typeof window !== "undefined" && window.location.search.includes("debug=assets");
if (shouldDebug) {
  console.group("🛠️ Build-time Variables Check");
  console.log("BASE_URL:", BASE_URL);
  console.log("DEPLOY_MODE:", DEPLOY_MODE);
  console.log("IS_VERCEL:", IS_VERCEL);
  console.log("IS_GITHUB_PAGES:", IS_GITHUB_PAGES);
  console.log("BUILD_TIMESTAMP:", BUILD_TIMESTAMP);
  console.log("DEPLOY_TIME:", DEPLOY_TIME);
  console.groupEnd();
}
const ASSET_CONFIG = {
  vercel: {
    useRelativePaths: false,
    assetPrefix: "",
    cdnEnabled: true,
    cacheStrategy: "aggressive"
  },
  github: {
    useRelativePaths: true,
    assetPrefix: "/Neff-Paving",
    cdnEnabled: false,
    cacheStrategy: "moderate"
  },
  development: {
    useRelativePaths: false,
    assetPrefix: "",
    cdnEnabled: false,
    cacheStrategy: "none"
  }
};
function getEnvironmentConfig() {
  const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  const hasGitHubBasePath = typeof window !== "undefined" && window.location.pathname.startsWith("/Neff-Paving/");
  if (isLocalhost && hasGitHubBasePath) {
    return ASSET_CONFIG.github;
  }
  return ASSET_CONFIG[DEPLOY_MODE] || ASSET_CONFIG.github;
}
function getAssetPath(assetPath, options = {}) {
  var _a;
  const isDebug = typeof window !== "undefined" && window.location.search.includes("debug=assets") || typeof window !== "undefined" && ((_a = window.localStorage) == null ? void 0 : _a.getItem("debug-assets")) === "true";
  if (isDebug) {
    console.group("🔧 getAssetPath Debug Info");
    console.log("📥 Input:", { assetPath, options });
    console.log("🌍 Environment:", { DEPLOY_MODE, BASE_URL, IS_VERCEL, IS_GITHUB_PAGES });
    console.log("⚙️ Build Variables:", {
      __BASE_URL__: "/Neff-Paving/",
      __DEPLOY_MODE__: "github",
      __IS_VERCEL__: false,
      __IS_GITHUB_PAGES__: true
    });
  }
  const config = getEnvironmentConfig();
  if (isDebug) {
    console.log("🔧 Config:", config);
    console.log("🏠 Window location:", typeof window !== "undefined" ? {
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      href: window.location.href
    } : "Not in browser");
  }
  const {
    useRelative = config.useRelativePaths,
    addCacheBusting = true,
    forceAbsolute = false
  } = options;
  let resolvedPath = assetPath;
  if (assetPath.startsWith("http://") || assetPath.startsWith("https://")) {
    if (isDebug) {
      console.log("↩️  External URL detected, returning as-is:", assetPath);
      console.groupEnd();
    }
    return assetPath;
  }
  const cleanPath = assetPath.startsWith("/") ? assetPath.slice(1) : assetPath;
  if (isDebug) console.log("🧹 Clean path (no leading slash):", cleanPath);
  if (forceAbsolute || DEPLOY_MODE === "vercel" || IS_VERCEL) {
    resolvedPath = "/" + cleanPath;
    if (isDebug) console.log("🔵 Vercel absolute path logic applied:", resolvedPath);
  } else if (useRelative && (DEPLOY_MODE === "github" || IS_GITHUB_PAGES)) {
    const baseUrl = BASE_URL === "/" ? "" : BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
    resolvedPath = baseUrl + "/" + cleanPath;
    if (isDebug) {
      console.log("🟣 GitHub Pages relative path logic applied");
      console.log("  - Base URL processed:", baseUrl);
      console.log("  - Combined path:", resolvedPath);
    }
  } else {
    resolvedPath = "/" + cleanPath;
    if (isDebug) console.log("⚪ Default absolute path logic applied:", resolvedPath);
  }
  const beforeSlashFix = resolvedPath;
  resolvedPath = resolvedPath.replace(/([^:])\/{2,}/g, "$1/");
  if (isDebug && beforeSlashFix !== resolvedPath) {
    console.log("🔧 Fixed double slashes:");
    console.log("  - Before:", beforeSlashFix);
    console.log("  - After:", resolvedPath);
  }
  if (addCacheBusting && config.cacheStrategy !== "none") {
    const separator = resolvedPath.includes("?") ? "&" : "?";
    const timestamp = config.cacheStrategy === "aggressive" ? DEPLOY_TIME : BUILD_TIMESTAMP;
    const beforeCacheBusting = resolvedPath;
    resolvedPath += `${separator}v=${timestamp}`;
    if (isDebug) {
      console.log("⏰ Cache busting applied:");
      console.log("  - Strategy:", config.cacheStrategy);
      console.log("  - Timestamp:", timestamp);
      console.log("  - Before:", beforeCacheBusting);
      console.log("  - After:", resolvedPath);
    }
  } else if (isDebug) {
    console.log("⏰ Cache busting skipped:", {
      addCacheBusting,
      cacheStrategy: config.cacheStrategy
    });
  }
  if (isDebug) {
    console.log("✅ Final resolved path:", resolvedPath);
    const hasDoubleSlash = resolvedPath.includes("//") && !resolvedPath.startsWith("http");
    const hasIncorrectBase = resolvedPath.includes("/Neff-Paving//") || resolvedPath.includes("//Neff-Paving/");
    if (hasDoubleSlash || hasIncorrectBase) {
      console.warn("⚠️  Potential path issues detected:");
      if (hasDoubleSlash) console.warn("  - Contains double slashes");
      if (hasIncorrectBase) console.warn("  - Incorrect base URL format");
    }
    console.groupEnd();
  }
  return resolvedPath;
}
function preloadCriticalAssets(assets = []) {
  if (typeof document === "undefined") return;
  const defaultCriticalAssets = [
    { type: "style", href: "assets/main.css", as: "style" },
    { type: "script", href: "src/main.js", as: "script" },
    { type: "font", href: "https://fonts.gstatic.com/s/oswald/v49/TK3IWkUHHAIjg75cFRf3bXL8LICs1_Fw.woff2", as: "font", crossorigin: true },
    { type: "image", href: "assets/images/logo.png", as: "image" }
  ];
  const allAssets = [...defaultCriticalAssets, ...assets];
  allAssets.forEach((asset) => {
    const existingLink = document.querySelector(`link[href="${asset.href}"]`);
    if (existingLink) return;
    const link = document.createElement("link");
    link.rel = asset.type === "font" ? "preload" : "prefetch";
    link.href = getAssetPath(asset.href, { addCacheBusting: false });
    link.as = asset.as;
    if (asset.crossorigin) {
      link.crossOrigin = "anonymous";
    }
    if (asset.type === "font") {
      link.type = "font/woff2";
    }
    document.head.appendChild(link);
  });
}
function updateAssetPaths() {
  if (typeof document === "undefined") return;
  getEnvironmentConfig();
  const selectors = [
    'a[href^="/"]:not([href^="//"])',
    'img[src^="/"]:not([src^="//"])',
    'link[href^="/"]:not([href^="//"])',
    'script[src^="/"]:not([src^="//"])',
    'source[src^="/"]:not([src^="//"])',
    'video[src^="/"]:not([src^="//"])',
    'audio[src^="/"]:not([src^="//"])',
    '[style*="url(/"]'
  ];
  const elements = document.querySelectorAll(selectors.join(", "));
  elements.forEach((element) => {
    try {
      const tagName = element.tagName.toLowerCase();
      let attr, currentPath;
      if (tagName === "a" || tagName === "link") {
        attr = "href";
      } else if (["img", "script", "source", "video", "audio"].includes(tagName)) {
        attr = "src";
      } else if (element.hasAttribute("style")) {
        const style = element.getAttribute("style");
        const urlMatches = style.match(/url\(([^)]+)\)/g);
        if (urlMatches) {
          let updatedStyle = style;
          urlMatches.forEach((match) => {
            const url = match.replace(/url\(['"]?([^'"]+)['"]?\)/, "$1");
            if (url.startsWith("/") && !url.startsWith("//")) {
              const newUrl = getAssetPath(url);
              updatedStyle = updatedStyle.replace(match, `url(${newUrl})`);
            }
          });
          element.setAttribute("style", updatedStyle);
        }
        return;
      }
      if (attr) {
        currentPath = element.getAttribute(attr);
        if (currentPath && currentPath.startsWith("/") && !currentPath.startsWith("//") && !currentPath.startsWith(BASE_URL) && !currentPath.startsWith("http")) {
          const newPath = getAssetPath(currentPath, {
            addCacheBusting: !element.hasAttribute("data-no-cache-bust")
          });
          element.setAttribute(attr, newPath);
        }
      }
    } catch (error) {
      console.warn("Failed to update asset path for element:", element, error);
    }
  });
}
function initializeAssetOptimization() {
  if (typeof document === "undefined") return;
  preloadCriticalAssets();
  updateAssetPaths();
  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = getAssetPath(img.dataset.src);
            img.removeAttribute("data-src");
            observer.unobserve(img);
          }
        }
      });
    });
    document.querySelectorAll("img[data-src]").forEach((img) => {
      imageObserver.observe(img);
    });
  }
}
if (typeof document !== "undefined" && document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeAssetOptimization);
} else if (typeof document !== "undefined") {
  initializeAssetOptimization();
}
class GalleryFilter {
  constructor(galleryElement) {
    this.galleryElement = galleryElement;
    this.galleryContainer = galleryElement.querySelector(".gallery");
    this.filterButtons = document.querySelectorAll(".button-group .button");
    this.galleryItems = [];
    this.lightbox = new Lightbox();
    this.allImagesData = [];
    this.displayedImages = {};
    this.currentFilter = "all";
    this.init();
  }
  init() {
    this.loadGalleryImages();
    this.initFilters();
    this.initLightbox();
    if (this.filterButtons.length > 0) {
      this.filterButtons[0].classList.add("cs-active");
    }
  }
  loadGalleryImages() {
    this.galleryContainer.innerHTML = "";
    this.galleryItems = [];
    this.allImagesData = [];
    this.displayedImages = {};
    Object.entries(galleryImages).forEach(([category, images]) => {
      images.forEach((image) => {
        this.allImagesData.push({ ...image, category });
      });
    });
    const categories = Object.keys(galleryImages);
    categories.forEach((category) => {
      const categoryImages = galleryImages[category].map((img) => ({ ...img, category }));
      const shuffled = this.shuffleArray([...categoryImages]);
      this.displayedImages[category] = shuffled.slice(0, 8);
    });
    const allShuffled = this.shuffleArray([...this.allImagesData]);
    this.displayedImages["all"] = allShuffled.slice(0, 8);
    Object.entries(this.displayedImages).forEach(([category, images]) => {
      images.forEach((image) => {
        const galleryCard = this.createGalleryCard(image, image.category, category);
        this.galleryContainer.appendChild(galleryCard);
        this.galleryItems.push(galleryCard);
      });
    });
    this.filterItems("all");
  }
  // Fisher-Yates shuffle algorithm for truly random selection
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  createGalleryCard(image, category, displayCategory) {
    const card = document.createElement("div");
    card.className = "gallery-card";
    card.setAttribute("data-category", category);
    card.setAttribute("data-display-category", displayCategory);
    const originalPath = `/assets/gallery/${category}/${image.filename}`;
    const hardcodedPath = `/Neff-Paving/assets/gallery/${category}/${image.filename}`;
    const resolvedPath = getAssetPath(originalPath, { addCacheBusting: true });
    const simplePath = `assets/gallery/${category}/${image.filename}`;
    const relativePath = `./assets/gallery/${category}/${image.filename}`;
    console.group(`🖼️ SIMPLIFIED Gallery Card: ${image.filename}`);
    console.log("Original path:", originalPath);
    console.log("Hardcoded GitHub path:", hardcodedPath);
    console.log("Resolved path:", resolvedPath);
    console.log("Simple path:", simplePath);
    console.log("Relative path:", relativePath);
    console.log("Category:", category);
    console.log("Display category:", displayCategory);
    console.log("Image data:", image);
    console.groupEnd();
    card.innerHTML = `
            <div class="card-image">
                <img src="${resolvedPath}" alt="${image.alt}" width="630" height="400">
            </div>
            <div class="card-overlay">
                <div class="card-title">${image.title}</div>
                <div class="card-category">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
            </div>
        `;
    const img = card.querySelector("img");
    img.onerror = () => {
      console.error(`❌ SIMPLIFIED: Failed to load image:`, resolvedPath);
      img.style.display = "none";
      card.querySelector(".card-image").innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; background: #f5f5f5; color: #666;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📷</div>
                    <div style="font-size: 0.875rem;">Image not available</div>
                    <div style="font-size: 0.75rem; margin-top: 0.25rem; opacity: 0.7;">${image.filename}</div>
                </div>
            `;
    };
    img.onload = () => {
      console.log(`✅ SIMPLIFIED: Successfully loaded image:`, resolvedPath);
    };
    return card;
  }
  initFilters() {
    this.filterButtons.forEach((button) => {
      button.addEventListener("click", () => this.handleFilterClick(button));
    });
  }
  initLightbox() {
    this.galleryContainer.addEventListener("click", (e) => {
      const card = e.target.closest(".gallery-card");
      if (!card) return;
      const clickedImage = {
        filename: card.querySelector("img").src.split("/").pop(),
        title: card.querySelector(".card-title").textContent,
        category: card.dataset.category
      };
      let imagesToShow = [];
      let clickedIndex = 0;
      if (this.currentFilter === "all") {
        imagesToShow = this.allImagesData;
      } else {
        imagesToShow = this.allImagesData.filter((img) => img.category === this.currentFilter);
      }
      const lightboxImages = imagesToShow.map((image) => {
        return {
          src: getAssetPath(`/assets/gallery/${image.category}/${image.filename}`, {
            addCacheBusting: true
          }),
          title: image.title,
          category: image.category.charAt(0).toUpperCase() + image.category.slice(1),
          alt: image.alt
        };
      });
      clickedIndex = imagesToShow.findIndex(
        (img) => img.filename === clickedImage.filename && img.category === clickedImage.category
      );
      if (clickedIndex === -1) clickedIndex = 0;
      this.lightbox.open(lightboxImages, clickedIndex);
    });
  }
  handleFilterClick(button) {
    this.filterButtons.forEach((btn) => btn.classList.remove("cs-active"));
    button.classList.add("cs-active");
    const filter = button.dataset.filter;
    this.filterItems(filter);
  }
  filterItems(filter) {
    this.currentFilter = filter;
    this.galleryItems.forEach((item) => {
      const displayCategory = item.dataset.displayCategory;
      const shouldShow = displayCategory === filter;
      if (shouldShow) {
        item.style.display = "block";
      } else {
        item.style.display = "none";
      }
    });
    const visibleItems = this.galleryItems.filter(
      (item) => item && item.style.display === "block"
    );
    console.log(`🔄 SIMPLIFIED: Showing ${visibleItems.length} items for filter '${filter}'`);
  }
}
gsapWithCSS.registerPlugin(ScrollTrigger);
class NeffPavingApp {
  constructor() {
    this.galleryFilter = null;
    this.init();
  }
  init() {
    console.log("Initializing Neff Paving App...");
    this.initHeroVideo();
    this.initAnimations();
    this.initNavigation();
    try {
      this.initGalleryFilters();
      console.log("Gallery initialized successfully");
    } catch (error) {
      console.error("Gallery initialization failed:", error);
    }
    console.log("Neff Paving app initialized successfully");
  }
  initHeroVideo() {
    const video = document.getElementById("hero-video");
    if (!video) return;
    video.addEventListener("error", (e) => {
      console.error("Video failed to load:", e);
      const heroSection = document.getElementById("hero");
      if (heroSection) {
        heroSection.style.backgroundColor = "#2c2c2c";
      }
    });
    video.addEventListener("loadeddata", () => {
      video.play().catch((err) => {
        console.error("Video autoplay failed:", err);
      });
    });
    video.style.opacity = "1";
  }
  initAnimations() {
    AOS.init({
      duration: 1e3,
      once: true,
      offset: 100
    });
    this.removeLoadingStates();
  }
  removeLoadingStates() {
    const style = document.createElement("style");
    style.textContent = `
            /* Force immediate visibility - no loading states */
            .loading,
            .spinner,
            .loader,
            .loading-overlay,
            .progress-bar,
            .loading-indicator {
                display: none !important;
                opacity: 0 !important;
                visibility: hidden !important;
            }
            
            /* Ensure all gallery images are immediately visible */
            .gallery-card,
            .gallery-item,
            .gallery img,
            .card-image img {
                opacity: 1 !important;
                visibility: visible !important;
                display: block !important;
            }
            
            /* Ensure forms work without loading indicators */
            .form-loading,
            .btn .loading,
            .submit-loading {
                display: none !important;
            }
            
            /* Remove any transition delays that might appear as loading */
            .gallery-card,
            .service-card,
            .contact-method {
                transition-delay: 0s !important;
            }
            
            /* Force maps and images to display immediately */
            .map-placeholder,
            .image-placeholder {
                background: transparent !important;
            }
            
            /* Disable animations that might look like loading */
            .spin {
                animation: none !important;
            }
        `;
    document.head.appendChild(style);
    console.log("✅ Loading states removed - content displays immediately");
  }
  initNavigation() {
    document.querySelectorAll('nav a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      });
    });
  }
  initGalleryFilters() {
    const galleryElement = document.getElementById("gallery");
    if (galleryElement) {
      this.galleryFilter = new GalleryFilter(galleryElement);
    }
  }
}
function initializeApp() {
  try {
    console.log("Starting NeffPavingApp initialization...");
    new NeffPavingApp();
    console.log("NeffPavingApp initialized successfully");
  } catch (error) {
    console.error("Failed to initialize NeffPavingApp:", error);
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
class FormValidationService {
  constructor() {
    this.validationRules = {
      area: {
        min: 50,
        // Minimum 50 sq ft
        max: 5e5,
        // Maximum 500,000 sq ft (11.5 acres)
        reasonable: {
          residential: { min: 100, max: 1e4 },
          // 100-10,000 sq ft
          commercial: { min: 1e3, max: 1e5 },
          // 1,000-100,000 sq ft
          maintenance: { min: 50, max: 5e4 },
          // 50-50,000 sq ft
          custom: { min: 50, max: 5e5 },
          // 50-500,000 sq ft
          emergency: { min: 50, max: 2e4 }
          // 50-20,000 sq ft
        }
      },
      perimeter: {
        min: 28,
        // Minimum perimeter for 50 sq ft area
        max: 1e4
        // Maximum 10,000 ft perimeter
      }
    };
    this.measurementToolInstructions = {
      "google-maps": {
        title: "Google Maps Area Finder",
        description: "Easy-to-use 2D measurement with satellite imagery",
        instructions: [
          "Search for your project location using the address search",
          "Click the drawing tools to select polygon, rectangle, or circle",
          "Click on the map to start drawing your area",
          "For polygons: Click to add points, click first point again to close",
          "For rectangles: Click and drag to create the rectangle",
          "For circles: Click center point, then drag to set radius",
          'Use the "Calculate Area" button to get measurements'
        ],
        benefits: [
          "Simple and intuitive interface",
          "Real satellite imagery for accurate placement",
          "Multiple drawing tools (polygon, rectangle, circle)",
          "Automatic area and perimeter calculation",
          "Address search for quick location finding"
        ],
        limitations: [
          "Limited to 2D measurements only",
          "Cannot account for elevation changes",
          "May be less accurate for complex terrain"
        ]
      }
    };
    this.helpText = {
      serviceTypes: {
        residential: "Driveways, walkways, patios, and small parking areas for homes",
        commercial: "Parking lots, loading docks, and business access areas",
        maintenance: "Crack sealing, sealcoating, striping, and repair work",
        custom: "Specialized paving projects requiring unique solutions",
        emergency: "Urgent repairs for safety hazards or damage"
      },
      measurementTools: {
        when3DRecommended: [
          "Properties with significant elevation changes",
          "Sloped driveways or parking areas",
          "Terraced or multi-level projects",
          "Properties near hills or valleys",
          "When precise surface area is critical"
        ],
        when2DAcceptable: [
          "Flat or nearly flat surfaces",
          "Simple rectangular areas",
          "Quick estimates for planning",
          "Basic residential driveways",
          "Small maintenance projects"
        ]
      }
    };
    this.tooltips = {
      measurement3D: "Use 3D measurement for slopes and complex terrain to get accurate surface area calculations. This is especially important for driveways on hills or uneven ground.",
      areaValidation: "Area measurements help us provide accurate estimates and ensure we bring the right equipment and materials for your project.",
      serviceTypeSelection: "Select the service type that best matches your project. This helps us provide appropriate pricing and timeline estimates.",
      addressImportant: "Project address helps us factor in local conditions, permit requirements, and travel time for accurate estimates.",
      timeline: "Timeline preferences help us schedule your project efficiently and set realistic expectations for completion."
    };
  }
  /**
   * Validate area measurement based on service type
   */
  validateAreaMeasurement(area, serviceType = "residential", unit = "sqft") {
    const validation = {
      isValid: true,
      warnings: [],
      errors: [],
      recommendations: []
    };
    if (!area || area <= 0) {
      validation.isValid = false;
      validation.errors.push("Area measurement is required and must be greater than 0");
      return validation;
    }
    const areaInSqFt = this.convertToSquareFeet(area, unit);
    if (areaInSqFt < this.validationRules.area.min) {
      validation.isValid = false;
      validation.errors.push(`Area is below minimum of ${this.validationRules.area.min} sq ft`);
    }
    if (areaInSqFt > this.validationRules.area.max) {
      validation.isValid = false;
      validation.errors.push(`Area exceeds maximum of ${this.validationRules.area.max.toLocaleString()} sq ft`);
    }
    const reasonableRange = this.validationRules.area.reasonable[serviceType];
    if (reasonableRange) {
      if (areaInSqFt < reasonableRange.min) {
        validation.warnings.push(`Area seems small for ${serviceType} projects. Typical range is ${reasonableRange.min.toLocaleString()}-${reasonableRange.max.toLocaleString()} sq ft`);
      }
      if (areaInSqFt > reasonableRange.max) {
        validation.warnings.push(`Area seems large for ${serviceType} projects. Typical range is ${reasonableRange.min.toLocaleString()}-${reasonableRange.max.toLocaleString()} sq ft`);
        validation.recommendations.push("Consider breaking large projects into phases");
      }
    }
    if (areaInSqFt > 5e3) {
      validation.recommendations.push("For large areas, consider using 3D measurement tools for better accuracy");
    }
    if (areaInSqFt > 2e4) {
      validation.recommendations.push("Large commercial projects may require site survey for final measurements");
    }
    return validation;
  }
  /**
   * Validate perimeter measurement
   */
  validatePerimeterMeasurement(perimeter, area, unit = "ft") {
    const validation = {
      isValid: true,
      warnings: [],
      errors: []
    };
    if (!perimeter || perimeter <= 0) {
      validation.warnings.push("Perimeter measurement not provided - using area-based estimate");
      return validation;
    }
    const perimeterInFt = this.convertToFeet(perimeter, unit);
    if (perimeterInFt < this.validationRules.perimeter.min) {
      validation.warnings.push(`Perimeter seems unusually small (${perimeterInFt} ft)`);
    }
    if (perimeterInFt > this.validationRules.perimeter.max) {
      validation.warnings.push(`Perimeter seems unusually large (${perimeterInFt.toLocaleString()} ft)`);
    }
    if (area) {
      const areaInSqFt = this.convertToSquareFeet(area, unit === "ft" ? "sqft" : "sqm");
      const ratio = perimeterInFt / Math.sqrt(areaInSqFt);
      if (ratio > 8) {
        validation.warnings.push("Area shape appears very elongated or irregular");
      }
      if (ratio < 2) {
        validation.warnings.push("Area shape appears very compact - please verify measurements");
      }
    }
    return validation;
  }
  /**
   * Get measurement tool instructions for specific tool
   */
  getMeasurementToolInstructions(toolType) {
    return this.measurementToolInstructions[toolType] || null;
  }
  /**
   * Get help text for specific form field
   */
  getHelpText(fieldType, subType = null) {
    if (subType && this.helpText[fieldType] && this.helpText[fieldType][subType]) {
      return this.helpText[fieldType][subType];
    }
    return this.helpText[fieldType] || null;
  }
  /**
   * Get tooltip text for specific element
   */
  getTooltip(elementType) {
    return this.tooltips[elementType] || null;
  }
  /**
   * Recommend measurement tool based on project characteristics
   */
  recommendMeasurementTool(serviceType, projectDescription = "", hasSlope = false) {
    const recommendation = {
      primary: "google-maps",
      secondary: "google-maps",
      reasoning: []
    };
    const slopeKeywords = ["slope", "hill", "sloped", "steep", "elevation", "grade", "incline"];
    const hasSlopeKeyword = slopeKeywords.some(
      (keyword) => projectDescription.toLowerCase().includes(keyword)
    );
    if (hasSlope || hasSlopeKeyword) {
      recommendation.primary = "google-maps";
      recommendation.secondary = "google-maps";
      recommendation.reasoning.push("2D measurement suitable for most terrain types");
    }
    if (serviceType === "commercial") {
      recommendation.reasoning.push("Commercial projects benefit from precise 3D measurements");
      if (recommendation.primary === "google-maps") {
        recommendation.reasoning.push("Consider 3D measurement for complex layouts");
      }
    }
    if (serviceType === "emergency") {
      recommendation.primary = "google-maps";
      recommendation.secondary = "google-maps";
      recommendation.reasoning.push("Quick 2D measurement suitable for emergency repairs");
    }
    return recommendation;
  }
  /**
   * Validate complete form data
   */
  validateForm(formData) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: []
    };
    const requiredFields = ["firstName", "lastName", "email", "phone", "serviceType"];
    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].trim() === "") {
        validation.isValid = false;
        validation.errors.push(`${this.formatFieldName(field)} is required`);
      }
    });
    if (formData.email && !this.isValidEmail(formData.email)) {
      validation.isValid = false;
      validation.errors.push("Please enter a valid email address");
    }
    if (formData.phone && !this.isValidPhone(formData.phone)) {
      validation.warnings.push("Phone number format could not be verified");
    }
    if (formData.areaData) {
      const areaValidation = this.validateAreaMeasurement(
        formData.areaData.area || formData.areaData.areaInSquareFeet,
        formData.serviceType,
        "sqft"
      );
      validation.isValid = validation.isValid && areaValidation.isValid;
      validation.errors.push(...areaValidation.errors);
      validation.warnings.push(...areaValidation.warnings);
      validation.recommendations.push(...areaValidation.recommendations);
      if (formData.areaData.perimeter) {
        const perimeterValidation = this.validatePerimeterMeasurement(
          formData.areaData.perimeter,
          formData.areaData.area || formData.areaData.areaInSquareFeet,
          "ft"
        );
        validation.warnings.push(...perimeterValidation.warnings);
        validation.errors.push(...perimeterValidation.errors);
      }
    }
    const toolRecommendation = this.recommendMeasurementTool(
      formData.serviceType,
      formData.projectDescription
    );
    validation.recommendations.push(...toolRecommendation.reasoning);
    return validation;
  }
  /**
   * Get validation message for display
   */
  getValidationMessage(validation) {
    let message = "";
    if (validation.errors.length > 0) {
      message += `Errors: ${validation.errors.join(", ")}
`;
    }
    if (validation.warnings.length > 0) {
      message += `Warnings: ${validation.warnings.join(", ")}
`;
    }
    if (validation.recommendations.length > 0) {
      message += `Recommendations: ${validation.recommendations.join(", ")}`;
    }
    return message.trim();
  }
  // Helper methods
  convertToSquareFeet(value, unit) {
    const conversions = {
      sqft: 1,
      sqm: 10.7639,
      acres: 43560
    };
    return value * (conversions[unit] || 1);
  }
  convertToFeet(value, unit) {
    const conversions = {
      ft: 1,
      m: 3.28084,
      meters: 3.28084
    };
    return value * (conversions[unit] || 1);
  }
  formatFieldName(fieldName) {
    return fieldName.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
  }
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/\D/g, "");
    return cleanPhone.length >= 10 && phoneRegex.test(cleanPhone);
  }
}
class EstimateService {
  constructor() {
    this.rates = {
      residential: {
        base: 3.5,
        premium: 4.5
      },
      commercial: {
        base: 4,
        premium: 5
      }
    };
    this.modifiers = {
      complexity: {
        simple: 1,
        moderate: 1.2,
        complex: 1.5
      },
      accessibility: {
        easy: 1,
        moderate: 1.15,
        difficult: 1.3
      },
      season: {
        peak: 1.1,
        regular: 1,
        offSeason: 0.9
      },
      urgency: {
        standard: 1,
        rush: 1.25,
        emergency: 1.5
      }
    };
    this.materialCosts = {
      asphalt: 2.5,
      concrete: 4,
      sealcoating: 0.5,
      striping: 0.25
    };
    this.laborRates = {
      skilled: 45,
      semiskilled: 35,
      general: 25
    };
  }
  calculateEstimate(squareFeet, serviceType, options = {}) {
    const estimate = {
      baseCost: 0,
      materialCost: 0,
      laborCost: 0,
      totalCost: 0,
      timeline: {
        days: 0,
        startDate: null,
        endDate: null
      },
      breakdown: {}
    };
    const { base, premium } = this.rates[serviceType];
    estimate.baseCost = squareFeet * (options.premium ? premium : base);
    let modifiedCost = estimate.baseCost;
    if (options.complexity) {
      modifiedCost *= this.modifiers.complexity[options.complexity] || 1;
    }
    if (options.accessibility) {
      modifiedCost *= this.modifiers.accessibility[options.accessibility] || 1;
    }
    if (options.season) {
      modifiedCost *= this.modifiers.season[options.season] || 1;
    }
    if (options.urgency) {
      modifiedCost *= this.modifiers.urgency[options.urgency] || 1;
    }
    if (options.discount && options.discount > 0 && options.discount < 1) {
      modifiedCost *= 1 - options.discount;
    }
    estimate.baseCost = modifiedCost;
    estimate.materialCost = this.calculateMaterialCost(squareFeet, options.materials || []);
    estimate.laborCost = this.calculateLaborCost(squareFeet, serviceType, options);
    estimate.timeline = this.calculateTimeline(squareFeet, serviceType, options);
    estimate.totalCost = estimate.baseCost + estimate.materialCost + estimate.laborCost;
    estimate.breakdown = {
      baseRate: options.premium ? premium : base,
      squareFeet,
      modifiers: this.getAppliedModifiers(options),
      materials: options.materials || [],
      laborHours: this.calculateLaborHours(squareFeet, serviceType, options)
    };
    return estimate;
  }
  calculateMaterialCost(squareFeet, materials) {
    let totalMaterialCost = 0;
    materials.forEach((material) => {
      const costPerSqFt = this.materialCosts[material.type] || 0;
      const coverage = material.coverage || squareFeet;
      const quantity = material.quantity || 1;
      totalMaterialCost += costPerSqFt * coverage * quantity;
    });
    return totalMaterialCost;
  }
  calculateLaborCost(squareFeet, serviceType, options) {
    const laborHours = this.calculateLaborHours(squareFeet, serviceType, options);
    const skillLevel = options.skillLevel || "semiskilled";
    const hourlyRate = this.laborRates[skillLevel] || this.laborRates.semiskilled;
    return laborHours * hourlyRate;
  }
  calculateLaborHours(squareFeet, serviceType, options) {
    const baseHoursPerSqFt = {
      residential: 0.02,
      commercial: 0.015
    };
    let hours = squareFeet * (baseHoursPerSqFt[serviceType] || 0.02);
    if (options.complexity === "complex") {
      hours *= 1.5;
    } else if (options.complexity === "moderate") {
      hours *= 1.2;
    }
    if (options.accessibility === "difficult") {
      hours *= 1.3;
    } else if (options.accessibility === "moderate") {
      hours *= 1.15;
    }
    return Math.max(hours, 4);
  }
  calculateTimeline(squareFeet, serviceType, options) {
    const laborHours = this.calculateLaborHours(squareFeet, serviceType, options);
    const hoursPerDay = options.hoursPerDay || 8;
    const workDays = Math.ceil(laborHours / hoursPerDay);
    const bufferDays = Math.ceil(workDays * 0.2);
    const totalDays = workDays + bufferDays;
    const startDate = options.startDate ? new Date(options.startDate) : /* @__PURE__ */ new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + totalDays);
    return {
      days: totalDays,
      workDays,
      bufferDays,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0]
    };
  }
  getAppliedModifiers(options) {
    const applied = {};
    if (options.complexity) {
      applied.complexity = {
        type: options.complexity,
        multiplier: this.modifiers.complexity[options.complexity]
      };
    }
    if (options.accessibility) {
      applied.accessibility = {
        type: options.accessibility,
        multiplier: this.modifiers.accessibility[options.accessibility]
      };
    }
    if (options.season) {
      applied.season = {
        type: options.season,
        multiplier: this.modifiers.season[options.season]
      };
    }
    if (options.urgency) {
      applied.urgency = {
        type: options.urgency,
        multiplier: this.modifiers.urgency[options.urgency]
      };
    }
    if (options.discount) {
      applied.discount = {
        rate: options.discount,
        multiplier: 1 - options.discount
      };
    }
    return applied;
  }
  // Utility method to get available options
  getAvailableOptions() {
    return {
      serviceTypes: Object.keys(this.rates),
      complexityLevels: Object.keys(this.modifiers.complexity),
      accessibilityLevels: Object.keys(this.modifiers.accessibility),
      seasons: Object.keys(this.modifiers.season),
      urgencyLevels: Object.keys(this.modifiers.urgency),
      materialTypes: Object.keys(this.materialCosts),
      skillLevels: Object.keys(this.laborRates)
    };
  }
}
const STORAGE_KEYS = {
  GOOGLE_MAPS_DATA: "neff_paving_google_maps_measurements",
  ACTIVE_TOOL: "neff_paving_active_measurement_tool",
  MEASUREMENT_SESSION: "neff_paving_measurement_session"
};
function getMeasurementData(toolType) {
  try {
    const key = getStorageKey(toolType);
    const stored = sessionStorage.getItem(key);
    if (!stored) {
      return null;
    }
    const parsedData = JSON.parse(stored);
    const dataAge = Date.now() - new Date(parsedData.timestamp).getTime();
    const maxAge = 24 * 60 * 60 * 1e3;
    if (dataAge > maxAge) {
      clearMeasurementData(toolType);
      return null;
    }
    return parsedData.data;
  } catch (error) {
    console.error("Failed to retrieve measurement data:", error);
    return null;
  }
}
function clearMeasurementData(toolType) {
  try {
    const key = getStorageKey(toolType);
    sessionStorage.removeItem(key);
    updateSessionMetadata();
    console.log(`Measurement data cleared for ${toolType}`);
  } catch (error) {
    console.error("Failed to clear measurement data:", error);
  }
}
function clearAllMeasurementData() {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      sessionStorage.removeItem(key);
    });
    console.log("All measurement data cleared");
  } catch (error) {
    console.error("Failed to clear all measurement data:", error);
  }
}
function getActiveTool() {
  return sessionStorage.getItem(STORAGE_KEYS.ACTIVE_TOOL) || "google-maps";
}
function hasMeasurementData() {
  return Object.values(STORAGE_KEYS).some((key) => {
    if (key === STORAGE_KEYS.MEASUREMENT_SESSION) return false;
    return sessionStorage.getItem(key) !== null;
  });
}
function getAllMeasurementData() {
  return {
    googleMaps: getMeasurementData("google-maps"),
    activeTool: getActiveTool()
  };
}
function handleFormSubmission() {
  clearAllMeasurementData();
}
function handleFormReset() {
  clearAllMeasurementData();
}
function getStorageKey(toolType) {
  switch (toolType) {
    case "google-maps":
      return STORAGE_KEYS.GOOGLE_MAPS_DATA;
    default:
      throw new Error(`Unknown tool type: ${toolType}`);
  }
}
function updateSessionMetadata() {
  try {
    const metadata = {
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
      tools: []
    };
    if (sessionStorage.getItem(STORAGE_KEYS.GOOGLE_MAPS_DATA)) {
      metadata.tools.push("google-maps");
    }
    sessionStorage.setItem(STORAGE_KEYS.MEASUREMENT_SESSION, JSON.stringify(metadata));
  } catch (error) {
    console.error("Failed to update session metadata:", error);
  }
}
class EstimateForm {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.validationService = new FormValidationService();
    this.estimateService = new EstimateService();
    this.formData = {};
    this.measurementData = null;
    this.serviceType = document.getElementById("service-type");
    this.squareFootage = document.getElementById("square-footage");
    this.isSubmitting = false;
    this.init();
  }
  init() {
    this.render();
    this.attachEventListeners();
    this.loadMeasurementData();
    this.updateSubmitButtonState();
  }
  render() {
    this.container.innerHTML = `
            <div class="estimate-form-container">
                <div class="form-header">
                    <h2>Request Your Free Estimate</h2>
                    <p class="form-subtitle">Complete the form below to receive a detailed estimate for your paving project</p>
                </div>

                <form id="estimate-form" class="estimate-form" novalidate>
                    <!-- Personal Information Section -->
                    <div class="form-section">
                        <h3 class="section-title">
                            <span class="section-icon">👤</span>
                            Personal Information
                        </h3>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="firstName" class="form-label">
                                    First Name <span class="required">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="firstName" 
                                    name="firstName" 
                                    class="form-input" 
                                    required
                                    aria-describedby="firstName-error"
                                >
                                <div class="error-message" id="firstName-error"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="lastName" class="form-label">
                                    Last Name <span class="required">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="lastName" 
                                    name="lastName" 
                                    class="form-input" 
                                    required
                                    aria-describedby="lastName-error"
                                >
                                <div class="error-message" id="lastName-error"></div>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="email" class="form-label">
                                    Email Address <span class="required">*</span>
                                </label>
                                <input 
                                    type="email" 
                                    id="email" 
                                    name="email" 
                                    class="form-input" 
                                    required
                                    aria-describedby="email-error"
                                    placeholder="your@email.com"
                                >
                                <div class="error-message" id="email-error"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="phone" class="form-label">
                                    Phone Number <span class="required">*</span>
                                </label>
                                <input 
                                    type="tel" 
                                    id="phone" 
                                    name="phone" 
                                    class="form-input" 
                                    required
                                    aria-describedby="phone-error"
                                    placeholder="(555) 123-4567"
                                >
                                <div class="error-message" id="phone-error"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Project Details Section -->
                    <div class="form-section">
                        <h3 class="section-title">
                            <span class="section-icon">🏗️</span>
                            Project Details
                        </h3>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="serviceType" class="form-label">
                                    Service Type <span class="required">*</span>
                                    <span class="tooltip" data-tooltip="${this.validationService.getTooltip("serviceTypeSelection")}">ℹ️</span>
                                </label>
                                <select 
                                    id="serviceType" 
                                    name="serviceType" 
                                    class="form-select" 
                                    required
                                    aria-describedby="serviceType-error"
                                >
                                    <option value="">Select a service type</option>
                                    <option value="residential">Residential Paving</option>
                                    <option value="commercial">Commercial Paving</option>
                                    <option value="maintenance">Maintenance Services</option>
                                    <option value="custom">Custom Projects</option>
                                    <option value="emergency">Emergency Repairs</option>
                                </select>
                                <div class="error-message" id="serviceType-error"></div>
                                <div class="help-text" id="serviceType-help"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="timeline" class="form-label">
                                    Preferred Timeline
                                    <span class="tooltip" data-tooltip="${this.validationService.getTooltip("timeline")}">ℹ️</span>
                                </label>
                                <input 
                                    type="date" 
                                    id="timeline" 
                                    name="timeline" 
                                    class="form-input"
                                    min="${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}"
                                    aria-describedby="timeline-error"
                                >
                                <div class="error-message" id="timeline-error"></div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="projectDescription" class="form-label">
                                Project Description
                            </label>
                            <textarea 
                                id="projectDescription" 
                                name="projectDescription" 
                                class="form-textarea" 
                                rows="4"
                                placeholder="Please describe your paving project in detail..."
                                aria-describedby="projectDescription-error"
                            ></textarea>
                            <div class="error-message" id="projectDescription-error"></div>
                        </div>
                    </div>

                    <!-- Property Address Section -->
                    <div class="form-section">
                        <h3 class="section-title">
                            <span class="section-icon">📍</span>
                            Property Address
                            <span class="tooltip" data-tooltip="${this.validationService.getTooltip("addressImportant")}">ℹ️</span>
                        </h3>
                        
                        <div class="form-group">
                            <label for="streetAddress" class="form-label">
                                Street Address <span class="required">*</span>
                            </label>
                            <input 
                                type="text" 
                                id="streetAddress" 
                                name="streetAddress" 
                                class="form-input" 
                                required
                                placeholder="123 Main Street"
                                aria-describedby="streetAddress-error"
                            >
                            <div class="error-message" id="streetAddress-error"></div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="city" class="form-label">
                                    City <span class="required">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="city" 
                                    name="city" 
                                    class="form-input" 
                                    required
                                    aria-describedby="city-error"
                                >
                                <div class="error-message" id="city-error"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="state" class="form-label">
                                    State <span class="required">*</span>
                                </label>
                                <select 
                                    id="state" 
                                    name="state" 
                                    class="form-select" 
                                    required
                                    aria-describedby="state-error"
                                >
                                    <option value="">Select State</option>
                                    <option value="OH">Ohio</option>
                                    <option value="KY">Kentucky</option>
                                    <option value="WV">West Virginia</option>
                                    <option value="PA">Pennsylvania</option>
                                    <option value="IN">Indiana</option>
                                    <option value="MI">Michigan</option>
                                </select>
                                <div class="error-message" id="state-error"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="zipCode" class="form-label">
                                    ZIP Code <span class="required">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="zipCode" 
                                    name="zipCode" 
                                    class="form-input" 
                                    required
                                    pattern="[0-9]{5}(-[0-9]{4})?"
                                    placeholder="12345"
                                    aria-describedby="zipCode-error"
                                >
                                <div class="error-message" id="zipCode-error"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Map Measurement Data Section -->
                    <div class="form-section">
                        <h3 class="section-title">
                            <span class="section-icon">📐</span>
                            Area Measurement
                            <span class="tooltip" data-tooltip="${this.validationService.getTooltip("areaValidation")}">ℹ️</span>
                        </h3>
                        
                        <div class="measurement-status" id="measurement-status">
                            <div class="measurement-requirement">
                                <strong>Use the map below to measure your project area</strong>
                                <p>Draw the area on the map to get an accurate measurement for your estimate.</p>
                            </div>
                        </div>

                        <!-- Map Container -->
                        <div class="map-container">
                            <!-- Google Maps Container -->
                            <div id="google-maps-container" class="map-placeholder" style="display: block;">
                                <div id="google-maps-measurement" style="height: 400px; width: 100%; position: relative;">
                                    <p style="text-align: center; padding: 2rem; color: #6b6b6b;">Google Maps measurement tool will load here</p>
                                </div>
                                <div id="google-maps-results" class="measurement-results" style="display: none; margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
                                    <h4 style="margin: 0 0 0.5rem 0; color: #2c2c2c; font-size: 18px;">Measurement Results</h4>
                                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                                        <div class="result-item">
                                            <span style="font-weight: 600; color: #495057;">Area:</span>
                                            <span id="google-area-result" style="color: #28a745; font-weight: 600;">0 sq ft</span>
                                        </div>
                                        <div class="result-item">
                                            <span style="font-weight: 600; color: #495057;">Perimeter:</span>
                                            <span id="google-perimeter-result" style="color: #007bff; font-weight: 600;">0 ft</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Hidden fields for measurement data -->
                        <input type="hidden" id="areaCoordinates" name="areaCoordinates">
                        <input type="hidden" id="calculatedSquareFootage" name="calculatedSquareFootage">
                        <input type="hidden" id="measurementTool" name="measurementTool">
                        <input type="hidden" id="measurementTimestamp" name="measurementTimestamp">
                    </div>

                    <!-- Form Actions -->
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" id="reset-form">
                            Reset Form
                        </button>
                        <button type="submit" class="btn btn-primary" id="submit-estimate" disabled>
                            Request Estimate
                        </button>
                        <button type="button" class="btn btn-secondary" id="get-quote" disabled style="margin-left: 1rem;">
                            Get Quick Quote
                        </button>
                    </div>
                    
                    <!-- Pricing Display Section -->
                    <div class="pricing-display" id="pricing-display" style="display: none;">
                        <div class="pricing-header">
                            <h3>Estimated Pricing</h3>
                            <p class="pricing-disclaimer">*This is an estimate. Final pricing may vary based on site conditions and additional requirements.</p>
                        </div>
                        <div class="pricing-details" id="pricing-details">
                            <!-- Pricing information will be populated here -->
                        </div>
                    </div>

                    <!-- Form Validation Summary -->
                    <div class="validation-summary" id="validation-summary" style="display: none;">
                        <h4>Please correct the following errors:</h4>
                        <ul id="validation-errors"></ul>
                    </div>
                </form>
            </div>
        `;
  }
  attachEventListeners() {
    const form = document.getElementById("estimate-form");
    document.getElementById("submit-estimate");
    const getQuoteButton = document.getElementById("get-quote");
    const resetButton = document.getElementById("reset-form");
    const serviceTypeSelect = document.getElementById("serviceType");
    const googleMapsToggle = document.getElementById("google-maps-toggle");
    form.addEventListener("submit", (e) => this.handleSubmit(e));
    if (getQuoteButton) {
      getQuoteButton.addEventListener("click", () => this.handleGetQuote());
    }
    resetButton.addEventListener("click", () => this.resetForm());
    serviceTypeSelect.addEventListener("change", (e) => this.handleServiceTypeChange(e));
    form.addEventListener("input", (e) => this.handleFieldValidation(e));
    form.addEventListener("blur", (e) => this.handleFieldValidation(e), true);
    if (googleMapsToggle) {
      googleMapsToggle.addEventListener("click", () => this.toggleMeasurementTool("google-maps"));
    }
    const phoneInput = document.getElementById("phone");
    phoneInput.addEventListener("input", (e) => this.formatPhoneNumber(e));
    setTimeout(() => this.initializeMeasurementTools(), 100);
  }
  handleSubmit(event) {
    event.preventDefault();
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    if (this.measurementData) {
      data.areaData = this.measurementData;
    }
    const validation = this.validationService.validateForm(data);
    if (!validation.isValid) {
      this.displayValidationErrors(validation);
      this.isSubmitting = false;
      return;
    }
    this.submitForm(data);
  }
  async submitForm(data) {
    var _a;
    try {
      const estimate = this.estimateService.calculateEstimate(
        ((_a = data.areaData) == null ? void 0 : _a.areaInSquareFeet) || 0,
        data.serviceType,
        {
          premium: false,
          complexity: "moderate",
          accessibility: "easy",
          season: "regular",
          urgency: "standard"
        }
      );
      const submissionData = {
        ...data,
        estimate,
        submittedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      const response = await fetch("/api/estimates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(submissionData)
      });
      if (!response.ok) {
        throw new Error("Failed to submit estimate request");
      }
      const result = await response.json();
      this.handleSubmitSuccess(result);
    } catch (error) {
      this.handleSubmitError(error);
    } finally {
      this.isSubmitting = false;
    }
  }
  handleSubmitSuccess(result) {
    var _a, _b;
    this.container.innerHTML = `
            <div class="success-message">
                <div class="success-icon">✅</div>
                <h2>Estimate Request Submitted Successfully!</h2>
                <p>Thank you for your interest in our paving services. We've received your request and will contact you within 2 hours.</p>
                <div class="success-details">
                    <p><strong>Reference #:</strong> ${result.referenceNumber}</p>
                    <p><strong>Estimated Project Cost:</strong> $${((_b = (_a = result.estimate) == null ? void 0 : _a.totalCost) == null ? void 0 : _b.toLocaleString()) || "TBD"}</p>
                </div>
                <button type="button" class="btn btn-primary" onclick="window.location.reload()">
                    Submit Another Request
                </button>
            </div>
        `;
    handleFormSubmission();
  }
  handleSubmitError(error) {
    console.error("Form submission error:", error);
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-alert";
    errorDiv.innerHTML = `
            <strong>Error:</strong> ${error.message}
            <button type="button" class="error-close" onclick="this.parentElement.remove()">×</button>
        `;
    this.container.insertBefore(errorDiv, this.container.firstChild);
  }
  handleFieldValidation(event) {
    const field = event.target;
    const fieldName = field.name;
    const value = field.value;
    if (!fieldName) return;
    const errorElement = document.getElementById(`${fieldName}-error`);
    if (errorElement) {
      errorElement.textContent = "";
      field.classList.remove("error");
    }
    if (field.hasAttribute("required") && !value.trim()) {
      if (event.type === "blur") {
        this.showFieldError(field, "This field is required");
      }
      return;
    }
    switch (fieldName) {
      case "email":
        if (value && !this.validationService.isValidEmail(value)) {
          this.showFieldError(field, "Please enter a valid email address");
        }
        break;
      case "phone":
        if (value && !this.validationService.isValidPhone(value)) {
          this.showFieldError(field, "Please enter a valid phone number");
        }
        break;
      case "zipCode":
        if (value && !/^\d{5}(-\d{4})?$/.test(value)) {
          this.showFieldError(field, "Please enter a valid ZIP code");
        }
        break;
    }
  }
  showFieldError(field, message) {
    const errorElement = document.getElementById(`${field.name}-error`);
    if (errorElement) {
      errorElement.textContent = message;
      field.classList.add("error");
    }
  }
  displayValidationErrors(validation) {
    const summaryDiv = document.getElementById("validation-summary");
    const errorsList = document.getElementById("validation-errors");
    if (validation.errors.length > 0) {
      errorsList.innerHTML = validation.errors.map((error) => `<li>${error}</li>`).join("");
      summaryDiv.style.display = "block";
      summaryDiv.scrollIntoView({ behavior: "smooth" });
    }
  }
  handleServiceTypeChange(event) {
    const serviceType = event.target.value;
    const helpText = document.getElementById("serviceType-help");
    if (serviceType && this.validationService.getHelpText("serviceTypes", serviceType)) {
      helpText.textContent = this.validationService.getHelpText("serviceTypes", serviceType);
      helpText.style.display = "block";
    } else {
      helpText.style.display = "none";
    }
  }
  formatPhoneNumber(event) {
    let value = event.target.value.replace(/\D/g, "");
    if (value.length >= 6) {
      value = value.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
    } else if (value.length >= 3) {
      value = value.replace(/(\d{3})(\d{3})/, "($1) $2");
    } else if (value.length > 0) {
      value = value.replace(/(\d{3})/, "($1");
    }
    event.target.value = value;
  }
  launchMeasurementTool(toolType) {
    window.open(`/assets/measurement-tools/${toolType}.html`, "_blank");
  }
  loadMeasurementData() {
    if (hasMeasurementData()) {
      this.measurementData = getAllMeasurementData();
      this.updateMeasurementStatus();
    }
  }
  updateMeasurementStatus() {
    const statusDiv = document.getElementById("measurement-status");
    if (this.measurementData && this.measurementData.googleMaps) {
      const data = this.measurementData.googleMaps;
      const area = data.areaInSquareFeet || data.area || 0;
      statusDiv.innerHTML = `
                <div class="measurement-success">
                    <strong>✅ Area Measured: ${area.toLocaleString()} sq ft</strong>
                    <p>Using Google Maps tool</p>
                </div>
            `;
      document.getElementById("calculatedSquareFootage").value = area;
      document.getElementById("measurementTool").value = this.measurementData.activeTool;
      document.getElementById("measurementTimestamp").value = (/* @__PURE__ */ new Date()).toISOString();
    }
  }
  updateSubmitButtonState() {
    const submitButton = document.getElementById("submit-estimate");
    const getQuoteButton = document.getElementById("get-quote");
    const hasRequiredFields = this.checkRequiredFields();
    const hasMeasurement = this.measurementData && this.measurementData.googleMaps;
    submitButton.disabled = !hasRequiredFields || !hasMeasurement;
    getQuoteButton.disabled = !hasMeasurement;
  }
  checkRequiredFields() {
    const requiredFields = ["firstName", "lastName", "email", "phone", "serviceType", "streetAddress", "city", "state", "zipCode"];
    return requiredFields.every((fieldName) => {
      const field = document.getElementById(fieldName);
      return field && field.value.trim();
    });
  }
  resetForm() {
    if (confirm("Are you sure you want to reset the form? All entered data will be lost.")) {
      document.getElementById("estimate-form").reset();
      this.measurementData = null;
      this.updateMeasurementStatus();
      this.updateSubmitButtonState();
      document.querySelectorAll(".error-message").forEach((el) => el.textContent = "");
      document.querySelectorAll(".form-input, .form-select, .form-textarea").forEach((el) => {
        el.classList.remove("error");
      });
      handleFormReset();
    }
  }
  /**
   * Initialize the measurement tools in the estimate form
   */
  initializeMeasurementTools() {
    this.initializeGoogleMaps();
  }
  /**
   * Initialize Google Maps measurement tool
   */
  initializeGoogleMaps() {
    if (!this.googleMapsLoaded) {
      this.loadGoogleMapsMeasurementTool();
    }
    this.activeMeasurementTool = "google-maps";
  }
  /**
   * Load Google Maps measurement tool
   */
  async loadGoogleMapsMeasurementTool() {
    const googleMapsDiv = document.getElementById("google-maps-measurement");
    googleMapsDiv.innerHTML = '<p style="text-align: center; padding: 2rem; color: #28a745;">Google Maps measurement tool coming soon!</p>';
    this.googleMapsLoaded = true;
  }
  /**
   * Handle get quote button click
   */
  async handleGetQuote() {
    if (!this.measurementData || !this.measurementData.googleMaps) {
      alert("Please measure the project area first using the map tool above.");
      return;
    }
    try {
      const serviceType = document.getElementById("serviceType").value || "residential";
      const pricingData = this.calculatePricing(serviceType);
      this.displayPricing(pricingData);
    } catch (error) {
      console.error("Error calculating pricing:", error);
      alert("Unable to calculate pricing. Please try again.");
    }
  }
  /**
   * Calculate pricing based on measurements and service type
   */
  calculatePricing(serviceType = "residential") {
    if (!this.measurementData) {
      throw new Error("No measurement data available");
    }
    const data = this.measurementData.googleMaps;
    const squareFootage = data.areaInSquareFeet || data.area || 0;
    const basePricing = {
      residential: {
        asphalt: { min: 3.5, max: 7, avg: 5.25 },
        concrete: { min: 6, max: 12, avg: 9 },
        maintenance: { min: 1.5, max: 3, avg: 2.25 }
      },
      commercial: {
        asphalt: { min: 4, max: 8.5, avg: 6.25 },
        concrete: { min: 7, max: 15, avg: 11 },
        maintenance: { min: 2, max: 4, avg: 3 }
      },
      maintenance: {
        asphalt: { min: 1.5, max: 3.5, avg: 2.5 },
        concrete: { min: 2, max: 4.5, avg: 3.25 },
        maintenance: { min: 1, max: 2.5, avg: 1.75 }
      },
      custom: {
        asphalt: { min: 4.5, max: 9, avg: 6.75 },
        concrete: { min: 8, max: 16, avg: 12 },
        maintenance: { min: 2.5, max: 5, avg: 3.75 }
      },
      emergency: {
        asphalt: { min: 5, max: 10, avg: 7.5 },
        concrete: { min: 9, max: 18, avg: 13.5 },
        maintenance: { min: 3, max: 6, avg: 4.5 }
      }
    };
    const serviceTypePricing = basePricing[serviceType] || basePricing.residential;
    const calculations = {
      asphalt: {
        min: Math.round(squareFootage * serviceTypePricing.asphalt.min),
        max: Math.round(squareFootage * serviceTypePricing.asphalt.max),
        avg: Math.round(squareFootage * serviceTypePricing.asphalt.avg)
      },
      concrete: {
        min: Math.round(squareFootage * serviceTypePricing.concrete.min),
        max: Math.round(squareFootage * serviceTypePricing.concrete.max),
        avg: Math.round(squareFootage * serviceTypePricing.concrete.avg)
      },
      maintenance: {
        min: Math.round(squareFootage * serviceTypePricing.maintenance.min),
        max: Math.round(squareFootage * serviceTypePricing.maintenance.max),
        avg: Math.round(squareFootage * serviceTypePricing.maintenance.avg)
      }
    };
    const sizeMultiplier = this.getSizeMultiplier(squareFootage);
    const seasonMultiplier = this.getSeasonMultiplier();
    Object.keys(calculations).forEach((material) => {
      calculations[material].min = Math.round(calculations[material].min * sizeMultiplier * seasonMultiplier);
      calculations[material].max = Math.round(calculations[material].max * sizeMultiplier * seasonMultiplier);
      calculations[material].avg = Math.round(calculations[material].avg * sizeMultiplier * seasonMultiplier);
    });
    return {
      squareFootage,
      serviceType,
      calculations,
      factors: {
        sizeMultiplier,
        seasonMultiplier
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  /**
   * Get size-based pricing multiplier
   */
  getSizeMultiplier(squareFootage) {
    if (squareFootage < 500) return 1.2;
    if (squareFootage < 1e3) return 1.1;
    if (squareFootage < 2e3) return 1;
    if (squareFootage < 5e3) return 0.95;
    return 0.9;
  }
  /**
   * Get seasonal pricing multiplier
   */
  getSeasonMultiplier() {
    const month = (/* @__PURE__ */ new Date()).getMonth();
    if (month === 11 || month === 0 || month === 1) return 1.15;
    if (month >= 2 && month <= 4 || month >= 8 && month <= 9) return 1;
    return 0.95;
  }
  /**
   * Display pricing information
   */
  displayPricing(pricingData) {
    const pricingDisplay = document.getElementById("pricing-display");
    const pricingDetails = document.getElementById("pricing-details");
    if (!pricingDisplay || !pricingDetails) return;
    const { squareFootage, serviceType, calculations, factors } = pricingData;
    pricingDetails.innerHTML = `
            <div class="pricing-overview">
                <div class="pricing-stat">
                    <span class="stat-label">Project Area:</span>
                    <span class="stat-value">${squareFootage.toLocaleString()} sq ft</span>
                </div>
                <div class="pricing-stat">
                    <span class="stat-label">Service Type:</span>
                    <span class="stat-value">${this.formatServiceType(serviceType)}</span>
                </div>
            </div>
            
            <div class="estimate-disclaimer" style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 1rem; margin: 1.5rem 0; color: #856404;">
                <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
                    <span style="font-size: 1.25rem; flex-shrink: 0;">⚠️</span>
                    <div>
                        <strong style="display: block; margin-bottom: 0.5rem; color: #856404;">Important Pricing Disclaimer</strong>
                        <p style="margin: 0; line-height: 1.5; color: #856404;">These estimates are preliminary calculations based on basic measurements and standard pricing. The final project price may vary anywhere from <strong>25% to 50% higher or lower</strong> than the predicted cost depending on site conditions, material choices, accessibility, permits, and specific project requirements.</p>
                    </div>
                </div>
            </div>
            
            <div class="material-pricing">
                <h4>Pricing by Material</h4>
                
                <div class="material-option">
                    <div class="material-header">
                        <h5>🛣️ Asphalt Paving</h5>
                        <p>Durable, cost-effective option for driveways and parking lots</p>
                    </div>
                    <div class="price-range">
                        <span class="price-min">$${calculations.asphalt.min.toLocaleString()}</span>
                        <span class="price-separator">-</span>
                        <span class="price-max">$${calculations.asphalt.max.toLocaleString()}</span>
                        <span class="price-avg">Avg: $${calculations.asphalt.avg.toLocaleString()}</span>
                    </div>
                </div>
                
                <div class="material-option">
                    <div class="material-header">
                        <h5>🏗️ Concrete Paving</h5>
                        <p>Long-lasting, premium option with excellent durability</p>
                    </div>
                    <div class="price-range">
                        <span class="price-min">$${calculations.concrete.min.toLocaleString()}</span>
                        <span class="price-separator">-</span>
                        <span class="price-max">$${calculations.concrete.max.toLocaleString()}</span>
                        <span class="price-avg">Avg: $${calculations.concrete.avg.toLocaleString()}</span>
                    </div>
                </div>
                
                <div class="material-option">
                    <div class="material-header">
                        <h5>🔧 Maintenance Services</h5>
                        <p>Repairs, sealing, and restoration services</p>
                    </div>
                    <div class="price-range">
                        <span class="price-min">$${calculations.maintenance.min.toLocaleString()}</span>
                        <span class="price-separator">-</span>
                        <span class="price-max">$${calculations.maintenance.max.toLocaleString()}</span>
                        <span class="price-avg">Avg: $${calculations.maintenance.avg.toLocaleString()}</span>
                    </div>
                </div>
            </div>
            
            <div class="pricing-factors">
                <h4>Pricing Factors Applied</h4>
                <ul>
                    <li>Project Size: ${this.formatMultiplier(factors.sizeMultiplier)} (${this.getSizeDescription(squareFootage)})</li>
                    <li>Seasonal Rate: ${this.formatMultiplier(factors.seasonMultiplier)} (${this.getSeasonDescription()})</li>
                    <li>Service Type: ${this.formatServiceType(serviceType)}</li>
                </ul>
            </div>
            
            <div class="pricing-actions">
                <button type="button" class="btn btn-primary" onclick="document.getElementById('submit-estimate').scrollIntoView({behavior: 'smooth'})">
                    Request Detailed Estimate
                </button>
                <button type="button" class="btn btn-outline" onclick="window.print()">
                    Print Quote
                </button>
            </div>
        `;
    pricingDisplay.style.display = "block";
    pricingDisplay.scrollIntoView({ behavior: "smooth" });
  }
  /**
   * Format service type for display
   */
  formatServiceType(serviceType) {
    const types = {
      "residential": "Residential Paving",
      "commercial": "Commercial Paving",
      "maintenance": "Maintenance Services",
      "custom": "Custom Projects",
      "emergency": "Emergency Repairs"
    };
    return types[serviceType] || "Residential Paving";
  }
  /**
   * Format multiplier for display
   */
  formatMultiplier(multiplier) {
    const percentage = Math.round((multiplier - 1) * 100);
    if (percentage > 0) return `+${percentage}%`;
    if (percentage < 0) return `${percentage}%`;
    return "Standard";
  }
  /**
   * Get size description
   */
  getSizeDescription(squareFootage) {
    if (squareFootage < 500) return "Small project";
    if (squareFootage < 1e3) return "Medium project";
    if (squareFootage < 2e3) return "Large project";
    if (squareFootage < 5e3) return "Very large project";
    return "Commercial scale";
  }
  /**
   * Get season description
   */
  getSeasonDescription() {
    const month = (/* @__PURE__ */ new Date()).getMonth();
    if (month === 11 || month === 0 || month === 1) return "Winter rates";
    if (month >= 2 && month <= 4 || month >= 8 && month <= 9) return "Peak season";
    return "Summer rates";
  }
}
document.addEventListener("DOMContentLoaded", function() {
  const estimateFormContainer = document.getElementById("estimate-form-container");
  if (estimateFormContainer) {
    try {
      const estimateForm = new EstimateForm("estimate-form-container");
      console.log("EstimateForm initialized successfully");
    } catch (error) {
      console.error("Failed to initialize EstimateForm:", error);
      estimateFormContainer.innerHTML = `
                        <div style="text-align: center; padding: 3rem; color: #e74c3c; background: #fdf2f2; border: 2px solid #e74c3c; border-radius: 8px;">
                            <h3>Unable to Load Form</h3>
                            <p>Please refresh the page to try again.</p>
                            <p style="font-size: 0.9rem; margin-top: 1rem; color: #666;">Error: ${error.message}</p>
                        </div>
                    `;
    }
  }
});
//# sourceMappingURL=main-Ct4sabCa.js.map
