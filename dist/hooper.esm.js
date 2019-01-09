/**
    * Hopper 0.0.5
    * (c) 2019
      * @license MIT
      */
function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    var ownKeys = Object.keys(source);

    if (typeof Object.getOwnPropertySymbols === 'function') {
      ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
        return Object.getOwnPropertyDescriptor(source, sym).enumerable;
      }));
    }

    ownKeys.forEach(function (key) {
      _defineProperty(target, key, source[key]);
    });
  }

  return target;
}

function getInRange(value, min, max) {
  return Math.max(Math.min(value, max), min);
}
function now() {
  return Date.now();
}

var script = {
  name: "Hooper",

  provide() {
    return {
      $hooper: this
    };
  },

  props: {
    // count of items to showed per view
    itemsToShow: {
      default: 1,
      type: Number
    },
    // count of items to slide when use navigation buttons
    itemsToSlide: {
      default: 1,
      type: Number
    },
    // control infinite scrolling mode
    infiniteScroll: {
      default: false,
      type: Boolean
    },
    // control center mode
    centerMode: {
      default: false,
      type: Boolean
    },
    // vertical sliding mode
    vertical: {
      default: false,
      type: Boolean
    },
    // enable rtl mode
    rtl: {
      default: null,
      type: Boolean
    },
    // enable auto sliding to carousal
    autoPlay: {
      default: false,
      type: Boolean
    },
    // speed of auto play to trigger slide
    playSpeed: {
      default: 3000,
      type: Number
    },
    // toggle mouse dragging
    mouseDrag: {
      default: true,
      type: Boolean
    },
    // toggle touch dragging
    touchDrag: {
      default: true,
      type: Boolean
    },
    // toggle mouse wheel sliding
    wheelControl: {
      default: false,
      type: Boolean
    },
    // toggle keyboard control
    keysControl: {
      default: false,
      type: Boolean
    },
    // enable any move to commit a slide
    shortDrag: {
      default: true,
      type: Boolean
    },
    // sliding transition time in ms
    transition: {
      default: 300,
      type: Number
    },
    // sync two carousels to slide together
    sync: {
      default: "",
      type: String
    },
    // an object to pass all settings
    settings: {
      default() {
        return {};
      },

      type: Object
    }
  },

  data() {
    return {
      isDraging: false,
      isSliding: false,
      isTouch: false,
      slideWidth: 0,
      slideHeight: 0,
      slidesCount: 0,
      currentSlide: 0,
      trackOffset: 0,
      slides: [],
      allSlides: [],
      defaults: {},
      breakpoints: {},
      delta: {
        x: 0,
        y: 0
      },
      $settings: {}
    };
  },

  computed: {
    trackTransform() {
      const {
        infiniteScroll,
        vertical,
        rtl,
        centerMode
      } = this.$settings;
      const direction = rtl ? -1 : 1;
      let clonesSpace = 0;
      let centeringSpace = 0;
      let translate = 0;

      if (centerMode) {
        centeringSpace = vertical ? (this.containerHeight - this.slideHeight) / 2 : (this.containerWidth - this.slideWidth) / 2;
      }

      if (infiniteScroll) {
        clonesSpace = vertical ? this.slideHeight * this.slidesCount : this.slideWidth * this.slidesCount * direction;
      }

      if (vertical) {
        translate = this.delta.y + direction * (centeringSpace - this.trackOffset * this.slideHeight);
        return `transform: translate(0, ${translate - clonesSpace}px);`;
      }

      if (!vertical) {
        translate = this.delta.x + direction * (centeringSpace - this.trackOffset * this.slideWidth);
        return `transform: translate(${translate - clonesSpace}px, 0);`;
      }
    }

  },
  watch: {
    trackOffset(newVal, oldVal) {
      if (!this.$settings.infiniteScroll) {
        this.slides[newVal].classList.add("is-active");
        this.slides[oldVal].classList.remove("is-active");
        return;
      }

      this.allSlides[newVal + this.slidesCount].classList.add("is-active");
      this.allSlides[oldVal + this.slidesCount].classList.remove("is-active");
    },

    "settings.itemsToShow"(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.$settings.itemsToShow = newVal;
      }
    }

  },
  methods: {
    // controling methods
    slideTo(slideIndex, mute = false) {
      const previousSlide = this.currentSlide;
      const index = this.$settings.infiniteScroll ? slideIndex : getInRange(slideIndex, 0, this.slidesCount - 1);
      this.$emit("beforeSlide", {
        currentSlide: this.currentSlide,
        slideTo: index
      });

      if (this.syncEl && !mute) {
        this.syncEl.slideTo(slideIndex, true);
      }

      this.$refs.track.style.transition = `${this.$settings.transition}ms`;
      this.trackOffset = index;
      this.currentSlide = this.normalizeCurrentSlideIndex(index);
      this.isSliding = true;
      window.setTimeout(() => {
        this.isSliding = false;
      }, this.$settings.transition); // show the onrignal slide instead of the cloned one

      if (this.$settings.infiniteScroll) {
        const temp = () => {
          this.trackOffset = this.normalizeCurrentSlideIndex(this.currentSlide);
          this.$refs.track.removeEventListener("transitionend", temp);
        };

        this.$refs.track.addEventListener("transitionend", temp);
      }

      this.$emit("slide", {
        currentSlide: this.currentSlide,
        slideFrom: previousSlide
      });
    },

    slideNext() {
      this.slideTo(this.currentSlide + this.$settings.itemsToSlide);
    },

    slidePrev() {
      this.slideTo(this.currentSlide - this.$settings.itemsToSlide);
    },

    // init methods
    init() {
      // get the element direction if not explicitly set
      if (this.defaults !== null) {
        this.defaults.rtl = getComputedStyle(this.$el).direction === "rtl";
      }

      this.slides = Array.from(this.$refs.track.children);
      this.allSlides = Array.from(this.slides);
      this.slidesCount = this.slides.length;

      if (this.$settings.infiniteScroll) {
        this.initClones();
      }

      if (this.$settings.autoPlay) {
        this.initAutoPlay();
      }

      if (this.$settings.mouseDrag) {
        this.$refs.track.addEventListener("mousedown", this.onDragStart);
      }

      if (this.$settings.touchDrag) {
        this.$refs.track.addEventListener("touchstart", this.onDragStart, {
          passive: true
        });
      }

      if (this.$settings.keysControl) {
        // todo: bind event ot carousel element
        document.addEventListener("keydown", this.onKeypress);
      }

      if (this.$settings.wheelControl) {
        this.lastScrollTime = now();
        this.$el.addEventListener("wheel", this.onWheel, {
          passive: false
        });
      }

      if (this.$settings.sync) {
        const el = this.$parent.$refs[this.$settings.sync];

        if (!el) {
          if (process.env.NODE_ENV !== "production") {
            console.warn(`Hooper: expects an element with attribute ref="${this.$settings.sync}", but found none.`);
          }

          return;
        }

        this.syncEl = this.$parent.$refs[this.$settings.sync];
        this.syncEl.syncEl = this;
      }
    },

    initClones() {
      const slidesBefore = document.createDocumentFragment();
      const slidesAfter = document.createDocumentFragment();
      let before = [];
      let after = [];
      this.slides.forEach(slide => {
        const elBefore = slide.cloneNode(true);
        const elAfter = slide.cloneNode(true);
        elBefore.classList.add("veer-clone");
        elAfter.classList.add("veer-clone");
        slidesBefore.appendChild(elBefore);
        slidesAfter.appendChild(elAfter);
        before.push(elBefore);
        after.push(elAfter);
      });
      this.allSlides.push(...after);
      this.allSlides.unshift(...before);
      this.$refs.track.appendChild(slidesAfter);
      this.$refs.track.insertBefore(slidesBefore, this.$refs.track.firstChild);
    },

    initAutoPlay() {
      setInterval(() => {
        if (this.currentSlide === this.slidesCount - 1 && !this.$settings.infiniteScroll) {
          this.slideTo(0);
          return;
        }

        this.slideNext();
      }, this.$settings.playSpeed);
    },

    initDefaults() {
      this.breakpoints = this.settings.breakpoints;
      this.defaults = _objectSpread({}, this.$props, this.settings);
      this.$settings = this.defaults;
    },

    // updating methods
    update() {
      this.updateBreakpoints();
      this.updateWidth();
    },

    updateWidth() {
      const rect = this.$el.getBoundingClientRect();
      this.containerWidth = rect.width;
      this.containerHeight = rect.height;
      this.slideWidth = this.containerWidth / this.$settings.itemsToShow;
      this.slideHeight = this.containerHeight / this.$settings.itemsToShow;
      this.allSlides.forEach(slide => {
        if (this.$settings.vertical) {
          slide.style.height = `${this.slideHeight}px`;
          return;
        }

        slide.style.width = `${this.slideWidth}px`;
      });
    },

    updateBreakpoints() {
      if (!this.breakpoints) {
        return;
      }

      const breakpoints = Object.keys(this.breakpoints).sort((a, b) => a - b);
      let matched;
      breakpoints.forEach(breakpoint => {
        if (window.matchMedia(`(min-width: ${breakpoint}px)`).matches) {
          this.$settings = Object.assign({}, this.defaults, this.breakpoints[breakpoint]);
          matched = breakpoint;
          return;
        }
      });

      if (!matched) {
        this.$settings = this.defaults;
      }
    },

    // events handlers
    onDragStart(event) {
      this.isTouch = event.type === "touchstart";

      if (!this.isTouch && event.button !== 0) {
        return;
      }

      event.preventDefault();
      this.startPosition = {
        x: 0,
        y: 0
      };
      this.endPosition = {
        x: 0,
        y: 0
      };
      this.isDraging = true;
      this.startPosition.x = this.isTouch ? event.touches[0].clientX : event.clientX;
      this.startPosition.y = this.isTouch ? event.touches[0].clientY : event.clientY;
      document.addEventListener(this.isTouch ? "touchmove" : "mousemove", this.onDrag);
      document.addEventListener(this.isTouch ? "touchend" : "mouseup", this.onDragEnd);
    },

    onDrag(event) {
      if (this.isSliding) {
        return;
      }

      this.endPosition.x = this.isTouch ? event.touches[0].clientX : event.clientX;
      this.endPosition.y = this.isTouch ? event.touches[0].clientY : event.clientY;
      this.delta.x = this.endPosition.x - this.startPosition.x;
      this.delta.y = this.endPosition.y - this.startPosition.y;
    },

    onDragEnd() {
      const tolerance = this.$settings.shortDrag ? 0.5 : 0.15;

      if (this.$settings.vertical) {
        const draggedSlides = Math.round(Math.abs(this.delta.y / this.slideHeight) + tolerance);
        this.slideTo(this.currentSlide - Math.sign(this.delta.y) * draggedSlides);
      }

      if (!this.$settings.vertical) {
        const direction = (this.$settings.rtl ? -1 : 1) * Math.sign(this.delta.x);
        const draggedSlides = Math.round(Math.abs(this.delta.x / this.slideWidth) + tolerance);
        this.slideTo(this.currentSlide - direction * draggedSlides);
      }

      this.isDraging = false;
      this.delta.x = 0;
      this.delta.y = 0;
      document.removeEventListener(this.isTouch ? "touchmove" : "mousemove", this.onDrag);
      document.removeEventListener(this.isTouch ? "touchend" : "mouseup", this.onDragEnd);
    },

    onTransitionend() {
      this.$refs.track.style.transition = "";
      this.isSliding = false;
      this.$emit("afterSlide", {
        currentSlide: this.currentSlide
      });
    },

    onKeypress(event) {
      const key = event.key;

      if (key.startsWith("Arrow")) {
        event.preventDefault();
      }

      if (this.$settings.vertical) {
        if (key === "ArrowUp") {
          this.slidePrev();
        }

        if (key === "ArrowDown") {
          this.slideNext();
        }

        return;
      }

      if (this.$settings.rtl) {
        if (key === "ArrowRight") {
          this.slidePrev();
        }

        if (key === "ArrowLeft") {
          this.slideNext();
        }

        return;
      }

      if (key === "ArrowRight") {
        this.slideNext();
      }

      if (key === "ArrowLeft") {
        this.slidePrev();
      }
    },

    onWheel(event) {
      event.preventDefault();

      if (now() - this.lastScrollTime < 60) {
        return;
      } // get wheel direction


      const value = event.wheelDelta || -event.deltaY;
      const delta = Math.sign(value);

      if (delta === -1) {
        this.slideNext();
      }

      if (delta === 1) {
        this.slidePrev();
      }
    },

    // utitlite functions
    normalizeCurrentSlideIndex(index) {
      if (index >= this.slidesCount) {
        index = index - this.slidesCount;
        return this.normalizeCurrentSlideIndex(index);
      }

      if (index < 0) {
        index = index + this.slidesCount;
        return this.normalizeCurrentSlideIndex(index);
      }

      return index;
    }

  },

  created() {
    this.initDefaults();

    if (typeof window !== "undefined") {
      window.addEventListener("resize", this.update);
    }
  },

  mounted() {
    this.init();
    this.$nextTick(() => {
      this.update();
      this.slides[this.currentSlide].classList.add("is-active");
    });
  },

  beforeDestroy() {
    window.removeEventListener("resize", this.update);
  }

};

/* script */
            const __vue_script__ = script;
            
/* template */
var __vue_render__ = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"hooper",class:{
    'is-vertical': _vm.$settings.vertical,
    'is-rtl': _vm.$settings.rtl,
  }},[_c('div',{ref:"track",staticClass:"hooper-track",class:{ 'is-dragging': _vm.isDraging },style:(_vm.trackTransform),on:{"transitionend":_vm.onTransitionend}},[_vm._t("default")],2),_vm._v(" "),_vm._t("hooper-addons")],2)};
var __vue_staticRenderFns__ = [];

  /* style */
  const __vue_inject_styles__ = function (inject) {
    if (!inject) return
    inject("data-v-9fb48026_0", { source: "\n.hooper{position:relative;overflow:hidden;box-sizing:border-box;width:100%\n}\n.hooper *{box-sizing:border-box\n}\n.hooper-track{display:flex;box-sizing:border-box;width:100%\n}\n.hooper-slide{flex-shrink:0\n}\n.hooper.is-vertical .hooper-track{flex-direction:column;height:200px\n}\n.hooper.is-rtl{direction:rtl\n}", map: undefined, media: undefined });

  };
  /* scoped */
  const __vue_scope_id__ = undefined;
  /* module identifier */
  const __vue_module_identifier__ = undefined;
  /* functional template */
  const __vue_is_functional_template__ = false;
  /* component normalizer */
  function __vue_normalize__(
    template, style, script$$1,
    scope, functional, moduleIdentifier,
    createInjector, createInjectorSSR
  ) {
    const component = (typeof script$$1 === 'function' ? script$$1.options : script$$1) || {};

    // For security concerns, we use only base name in production mode.
    component.__file = "Hooper.vue";

    if (!component.render) {
      component.render = template.render;
      component.staticRenderFns = template.staticRenderFns;
      component._compiled = true;

      if (functional) component.functional = true;
    }

    component._scopeId = scope;

    {
      let hook;
      if (style) {
        hook = function(context) {
          style.call(this, createInjector(context));
        };
      }

      if (hook !== undefined) {
        if (component.functional) {
          // register for functional component in vue file
          const originalRender = component.render;
          component.render = function renderWithStyleInjection(h, context) {
            hook.call(context);
            return originalRender(h, context)
          };
        } else {
          // inject component registration as beforeCreate hook
          const existing = component.beforeCreate;
          component.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
      }
    }

    return component
  }
  /* style inject */
  function __vue_create_injector__() {
    const head = document.head || document.getElementsByTagName('head')[0];
    const styles = __vue_create_injector__.styles || (__vue_create_injector__.styles = {});
    const isOldIE =
      typeof navigator !== 'undefined' &&
      /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());

    return function addStyle(id, css) {
      if (document.querySelector('style[data-vue-ssr-id~="' + id + '"]')) return // SSR styles are present.

      const group = isOldIE ? css.media || 'default' : id;
      const style = styles[group] || (styles[group] = { ids: [], parts: [], element: undefined });

      if (!style.ids.includes(id)) {
        let code = css.source;
        let index = style.ids.length;

        style.ids.push(id);

        if (css.map) {
          // https://developer.chrome.com/devtools/docs/javascript-debugging
          // this makes source maps inside style tags work properly in Chrome
          code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
          // http://stackoverflow.com/a/26603875
          code +=
            '\n/*# sourceMappingURL=data:application/json;base64,' +
            btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
            ' */';
        }

        if (isOldIE) {
          style.element = style.element || document.querySelector('style[data-group=' + group + ']');
        }

        if (!style.element) {
          const el = style.element = document.createElement('style');
          el.type = 'text/css';

          if (css.media) el.setAttribute('media', css.media);
          if (isOldIE) {
            el.setAttribute('data-group', group);
            el.setAttribute('data-next-index', '0');
          }

          head.appendChild(el);
        }

        if (isOldIE) {
          index = parseInt(style.element.getAttribute('data-next-index'));
          style.element.setAttribute('data-next-index', index + 1);
        }

        if (style.element.styleSheet) {
          style.parts.push(code);
          style.element.styleSheet.cssText = style.parts
            .filter(Boolean)
            .join('\n');
        } else {
          const textNode = document.createTextNode(code);
          const nodes = style.element.childNodes;
          if (nodes[index]) style.element.removeChild(nodes[index]);
          if (nodes.length) style.element.insertBefore(textNode, nodes[index]);
          else style.element.appendChild(textNode);
        }
      }
    }
  }
  /* style inject SSR */
  

  
  var Hooper = __vue_normalize__(
    { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
    __vue_inject_styles__,
    __vue_script__,
    __vue_scope_id__,
    __vue_is_functional_template__,
    __vue_module_identifier__,
    __vue_create_injector__,
    undefined
  );

//
//
//
//
//
//
var script$1 = {
  name: 'HooperSlide'
};

/* script */
            const __vue_script__$1 = script$1;
            
/* template */
var __vue_render__$1 = function (_h,_vm) {var _c=_vm._c;return _c('div',{staticClass:"hooper-slide"},[_vm._t("default")],2)};
var __vue_staticRenderFns__$1 = [];

  /* style */
  const __vue_inject_styles__$1 = undefined;
  /* scoped */
  const __vue_scope_id__$1 = undefined;
  /* module identifier */
  const __vue_module_identifier__$1 = undefined;
  /* functional template */
  const __vue_is_functional_template__$1 = true;
  /* component normalizer */
  function __vue_normalize__$1(
    template, style, script,
    scope, functional, moduleIdentifier,
    createInjector, createInjectorSSR
  ) {
    const component = (typeof script === 'function' ? script.options : script) || {};

    // For security concerns, we use only base name in production mode.
    component.__file = "Slide.vue";

    if (!component.render) {
      component.render = template.render;
      component.staticRenderFns = template.staticRenderFns;
      component._compiled = true;

      if (functional) component.functional = true;
    }

    component._scopeId = scope;

    return component
  }
  /* style inject */
  
  /* style inject SSR */
  

  
  var Slide = __vue_normalize__$1(
    { render: __vue_render__$1, staticRenderFns: __vue_staticRenderFns__$1 },
    __vue_inject_styles__$1,
    __vue_script__$1,
    __vue_scope_id__$1,
    __vue_is_functional_template__$1,
    __vue_module_identifier__$1,
    undefined,
    undefined
  );

const icons = {
  arrowUp: 'M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z',
  arrowDown: 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z',
  arrowRight: 'M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z',
  arrowLeft: 'M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z'
};
var Icons = {
  name: 'HooperIcon',
  functional: true,
  inheritAttrs: true,
  props: {
    name: {
      type: String,
      required: true,
      validator: val => val in icons
    }
  },

  render(createElement, {
    props
  }) {
    const icon = icons[props.name];
    const children = [];
    children.push(createElement('path', {
      attrs: {
        d: 'M0 0h24v24H0z',
        fill: 'none'
      }
    }));
    children.push(createElement('path', {
      attrs: {
        d: icon
      }
    }));
    return createElement('svg', {
      attrs: {
        class: `icon icon-${props.name}`,
        viewBox: '0 0 24 24',
        width: '24px',
        height: '24px',
        id: `icon-${props.name}`
      }
    }, children);
  }

};

//
//
//
//
//
//
//
//
//
//
var script$2 = {
  inject: ['$hooper'],
  name: 'HooperProgress'
};

/* script */
            const __vue_script__$2 = script$2;
            
/* template */
var __vue_render__$2 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"hooper-progress"},[_c('div',{staticClass:"hooper-progress-inner",style:(("width: " + (_vm.$hooper.currentSlide * 100 / (_vm.$hooper.slidesCount - 1)) + "%"))})])};
var __vue_staticRenderFns__$2 = [];

  /* style */
  const __vue_inject_styles__$2 = function (inject) {
    if (!inject) return
    inject("data-v-ac18e6e0_0", { source: "\n.hooper-progress{position:absolute;top:0;right:0;left:0;height:4px;background-color:#efefef\n}\n.hooper-progress-inner{height:100%;background-color:#4285f4;transition:.3s\n}", map: undefined, media: undefined });

  };
  /* scoped */
  const __vue_scope_id__$2 = undefined;
  /* module identifier */
  const __vue_module_identifier__$2 = undefined;
  /* functional template */
  const __vue_is_functional_template__$2 = false;
  /* component normalizer */
  function __vue_normalize__$2(
    template, style, script,
    scope, functional, moduleIdentifier,
    createInjector, createInjectorSSR
  ) {
    const component = (typeof script === 'function' ? script.options : script) || {};

    // For security concerns, we use only base name in production mode.
    component.__file = "Progress.vue";

    if (!component.render) {
      component.render = template.render;
      component.staticRenderFns = template.staticRenderFns;
      component._compiled = true;

      if (functional) component.functional = true;
    }

    component._scopeId = scope;

    {
      let hook;
      if (style) {
        hook = function(context) {
          style.call(this, createInjector(context));
        };
      }

      if (hook !== undefined) {
        if (component.functional) {
          // register for functional component in vue file
          const originalRender = component.render;
          component.render = function renderWithStyleInjection(h, context) {
            hook.call(context);
            return originalRender(h, context)
          };
        } else {
          // inject component registration as beforeCreate hook
          const existing = component.beforeCreate;
          component.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
      }
    }

    return component
  }
  /* style inject */
  function __vue_create_injector__$1() {
    const head = document.head || document.getElementsByTagName('head')[0];
    const styles = __vue_create_injector__$1.styles || (__vue_create_injector__$1.styles = {});
    const isOldIE =
      typeof navigator !== 'undefined' &&
      /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());

    return function addStyle(id, css) {
      if (document.querySelector('style[data-vue-ssr-id~="' + id + '"]')) return // SSR styles are present.

      const group = isOldIE ? css.media || 'default' : id;
      const style = styles[group] || (styles[group] = { ids: [], parts: [], element: undefined });

      if (!style.ids.includes(id)) {
        let code = css.source;
        let index = style.ids.length;

        style.ids.push(id);

        if (css.map) {
          // https://developer.chrome.com/devtools/docs/javascript-debugging
          // this makes source maps inside style tags work properly in Chrome
          code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
          // http://stackoverflow.com/a/26603875
          code +=
            '\n/*# sourceMappingURL=data:application/json;base64,' +
            btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
            ' */';
        }

        if (isOldIE) {
          style.element = style.element || document.querySelector('style[data-group=' + group + ']');
        }

        if (!style.element) {
          const el = style.element = document.createElement('style');
          el.type = 'text/css';

          if (css.media) el.setAttribute('media', css.media);
          if (isOldIE) {
            el.setAttribute('data-group', group);
            el.setAttribute('data-next-index', '0');
          }

          head.appendChild(el);
        }

        if (isOldIE) {
          index = parseInt(style.element.getAttribute('data-next-index'));
          style.element.setAttribute('data-next-index', index + 1);
        }

        if (style.element.styleSheet) {
          style.parts.push(code);
          style.element.styleSheet.cssText = style.parts
            .filter(Boolean)
            .join('\n');
        } else {
          const textNode = document.createTextNode(code);
          const nodes = style.element.childNodes;
          if (nodes[index]) style.element.removeChild(nodes[index]);
          if (nodes.length) style.element.insertBefore(textNode, nodes[index]);
          else style.element.appendChild(textNode);
        }
      }
    }
  }
  /* style inject SSR */
  

  
  var Progress = __vue_normalize__$2(
    { render: __vue_render__$2, staticRenderFns: __vue_staticRenderFns__$2 },
    __vue_inject_styles__$2,
    __vue_script__$2,
    __vue_scope_id__$2,
    __vue_is_functional_template__$2,
    __vue_module_identifier__$2,
    __vue_create_injector__$1,
    undefined
  );

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
var script$3 = {
  inject: ['$hooper'],
  name: 'HooperPaginaiton',
  props: {
    mode: {
      default: 'indicator',
      type: String
    }
  }
};

/* script */
            const __vue_script__$3 = script$3;
            
/* template */
var __vue_render__$3 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"hooper-pagination",class:{ 'is-vertical': _vm.$hooper.$settings.vertical }},[(_vm.mode === 'indicator')?_c('ol',{staticClass:"hooper-indicators"},_vm._l((_vm.$hooper.slides),function(slide,index){return _c('li',{key:index},[_c('button',{staticClass:"hooper-indicator",class:{ 'is-active': _vm.$hooper.currentSlide === index },on:{"click":function($event){_vm.$hooper.slideTo(index);}}})])}),0):_vm._e(),_vm._v(" "),(_vm.mode === 'fraction')?[_c('span',[_vm._v(_vm._s(_vm.$hooper.currentSlide + 1))]),_vm._v(" "),_c('span',[_vm._v("/")]),_vm._v(" "),_c('span',[_vm._v(_vm._s(_vm.$hooper.slidesCount))])]:_vm._e()],2)};
var __vue_staticRenderFns__$3 = [];

  /* style */
  const __vue_inject_styles__$3 = function (inject) {
    if (!inject) return
    inject("data-v-7b5c6c6e_0", { source: "\n.hooper-pagination{position:absolute;bottom:0;right:50%;transform:translateX(50%);display:flex;padding:5px 10px\n}\n.hooper-indicators{display:flex;list-style:none;margin:0;padding:0\n}\n.hooper-indicator.is-active,.hooper-indicator:hover{background-color:#4285f4\n}\n.hooper-indicator{margin:0 2px;width:12px;height:4px;border-radius:2px;border:none;padding:0;background-color:#fff;cursor:pointer\n}\n.hooper-pagination.is-vertical{bottom:auto;right:0;top:50%;transform:translateY(-50%)\n}\n.hooper-pagination.is-vertical .hooper-indicators{flex-direction:column\n}\n.hooper-pagination.is-vertical .hooper-indicator{width:4px\n}", map: undefined, media: undefined });

  };
  /* scoped */
  const __vue_scope_id__$3 = undefined;
  /* module identifier */
  const __vue_module_identifier__$3 = undefined;
  /* functional template */
  const __vue_is_functional_template__$3 = false;
  /* component normalizer */
  function __vue_normalize__$3(
    template, style, script,
    scope, functional, moduleIdentifier,
    createInjector, createInjectorSSR
  ) {
    const component = (typeof script === 'function' ? script.options : script) || {};

    // For security concerns, we use only base name in production mode.
    component.__file = "Pagination.vue";

    if (!component.render) {
      component.render = template.render;
      component.staticRenderFns = template.staticRenderFns;
      component._compiled = true;

      if (functional) component.functional = true;
    }

    component._scopeId = scope;

    {
      let hook;
      if (style) {
        hook = function(context) {
          style.call(this, createInjector(context));
        };
      }

      if (hook !== undefined) {
        if (component.functional) {
          // register for functional component in vue file
          const originalRender = component.render;
          component.render = function renderWithStyleInjection(h, context) {
            hook.call(context);
            return originalRender(h, context)
          };
        } else {
          // inject component registration as beforeCreate hook
          const existing = component.beforeCreate;
          component.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
      }
    }

    return component
  }
  /* style inject */
  function __vue_create_injector__$2() {
    const head = document.head || document.getElementsByTagName('head')[0];
    const styles = __vue_create_injector__$2.styles || (__vue_create_injector__$2.styles = {});
    const isOldIE =
      typeof navigator !== 'undefined' &&
      /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());

    return function addStyle(id, css) {
      if (document.querySelector('style[data-vue-ssr-id~="' + id + '"]')) return // SSR styles are present.

      const group = isOldIE ? css.media || 'default' : id;
      const style = styles[group] || (styles[group] = { ids: [], parts: [], element: undefined });

      if (!style.ids.includes(id)) {
        let code = css.source;
        let index = style.ids.length;

        style.ids.push(id);

        if (css.map) {
          // https://developer.chrome.com/devtools/docs/javascript-debugging
          // this makes source maps inside style tags work properly in Chrome
          code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
          // http://stackoverflow.com/a/26603875
          code +=
            '\n/*# sourceMappingURL=data:application/json;base64,' +
            btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
            ' */';
        }

        if (isOldIE) {
          style.element = style.element || document.querySelector('style[data-group=' + group + ']');
        }

        if (!style.element) {
          const el = style.element = document.createElement('style');
          el.type = 'text/css';

          if (css.media) el.setAttribute('media', css.media);
          if (isOldIE) {
            el.setAttribute('data-group', group);
            el.setAttribute('data-next-index', '0');
          }

          head.appendChild(el);
        }

        if (isOldIE) {
          index = parseInt(style.element.getAttribute('data-next-index'));
          style.element.setAttribute('data-next-index', index + 1);
        }

        if (style.element.styleSheet) {
          style.parts.push(code);
          style.element.styleSheet.cssText = style.parts
            .filter(Boolean)
            .join('\n');
        } else {
          const textNode = document.createTextNode(code);
          const nodes = style.element.childNodes;
          if (nodes[index]) style.element.removeChild(nodes[index]);
          if (nodes.length) style.element.insertBefore(textNode, nodes[index]);
          else style.element.appendChild(textNode);
        }
      }
    }
  }
  /* style inject SSR */
  

  
  var Pagination = __vue_normalize__$3(
    { render: __vue_render__$3, staticRenderFns: __vue_staticRenderFns__$3 },
    __vue_inject_styles__$3,
    __vue_script__$3,
    __vue_scope_id__$3,
    __vue_is_functional_template__$3,
    __vue_module_identifier__$3,
    __vue_create_injector__$2,
    undefined
  );

//
var script$4 = {
  inject: ['$hooper'],
  name: 'HooperNavigation',
  components: {
    Icons
  },
  computed: {
    isPrevDisabled() {
      if (this.$hooper.$settings.infiniteScroll) {
        return false;
      }

      return this.$hooper.currentSlide === 0;
    },

    isNextDisabled() {
      if (this.$hooper.$settings.infiniteScroll) {
        return false;
      }

      return this.$hooper.currentSlide === this.$hooper.slidesCount - 1;
    }

  }
};

/* script */
            const __vue_script__$4 = script$4;
            
/* template */
var __vue_render__$4 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"hooper-navigation",class:{
    'is-vertical': _vm.$hooper.$settings.vertical,
    'is-rtl': _vm.$hooper.$settings.rtl,
  }},[_c('button',{staticClass:"hooper-next",class:{ 'is-disabled': _vm.isNextDisabled  },on:{"click":_vm.$hooper.slideNext}},[_vm._t("hooper-next",[_c('icons',{attrs:{"name":"arrowRight"}})])],2),_vm._v(" "),_c('button',{staticClass:"hooper-prev",class:{ 'is-disabled': _vm.isPrevDisabled },on:{"click":_vm.$hooper.slidePrev}},[_vm._t("hooper-prev",[_c('icons',{attrs:{"name":"arrowLeft"}})])],2)])};
var __vue_staticRenderFns__$4 = [];

  /* style */
  const __vue_inject_styles__$4 = function (inject) {
    if (!inject) return
    inject("data-v-0fb03571_0", { source: "\n.hooper-next,.hooper-prev{background-color:transparent;border:none;padding:1em;position:absolute;top:50%;transform:translateY(-50%);cursor:pointer\n}\n.hooper-next.is-disabled,.hooper-prev.is-disabled{opacity:.3;cursor:not-allowed\n}\n.hooper-next{right:0\n}\n.hooper-prev{left:0\n}\n.hooper-navigation.is-vertical .hooper-next{top:auto;bottom:0;transform:initial\n}\n.hooper-navigation.is-vertical .hooper-prev{top:0;bottom:auto;right:0;left:auto;transform:initial\n}\n.hooper-navigation.is-rtl .hooper-prev{left:auto;right:0\n}\n.hooper-navigation.is-rtl .hooper-next{right:auto;left:0\n}", map: undefined, media: undefined });

  };
  /* scoped */
  const __vue_scope_id__$4 = undefined;
  /* module identifier */
  const __vue_module_identifier__$4 = undefined;
  /* functional template */
  const __vue_is_functional_template__$4 = false;
  /* component normalizer */
  function __vue_normalize__$4(
    template, style, script,
    scope, functional, moduleIdentifier,
    createInjector, createInjectorSSR
  ) {
    const component = (typeof script === 'function' ? script.options : script) || {};

    // For security concerns, we use only base name in production mode.
    component.__file = "Navigation.vue";

    if (!component.render) {
      component.render = template.render;
      component.staticRenderFns = template.staticRenderFns;
      component._compiled = true;

      if (functional) component.functional = true;
    }

    component._scopeId = scope;

    {
      let hook;
      if (style) {
        hook = function(context) {
          style.call(this, createInjector(context));
        };
      }

      if (hook !== undefined) {
        if (component.functional) {
          // register for functional component in vue file
          const originalRender = component.render;
          component.render = function renderWithStyleInjection(h, context) {
            hook.call(context);
            return originalRender(h, context)
          };
        } else {
          // inject component registration as beforeCreate hook
          const existing = component.beforeCreate;
          component.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
      }
    }

    return component
  }
  /* style inject */
  function __vue_create_injector__$3() {
    const head = document.head || document.getElementsByTagName('head')[0];
    const styles = __vue_create_injector__$3.styles || (__vue_create_injector__$3.styles = {});
    const isOldIE =
      typeof navigator !== 'undefined' &&
      /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());

    return function addStyle(id, css) {
      if (document.querySelector('style[data-vue-ssr-id~="' + id + '"]')) return // SSR styles are present.

      const group = isOldIE ? css.media || 'default' : id;
      const style = styles[group] || (styles[group] = { ids: [], parts: [], element: undefined });

      if (!style.ids.includes(id)) {
        let code = css.source;
        let index = style.ids.length;

        style.ids.push(id);

        if (css.map) {
          // https://developer.chrome.com/devtools/docs/javascript-debugging
          // this makes source maps inside style tags work properly in Chrome
          code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
          // http://stackoverflow.com/a/26603875
          code +=
            '\n/*# sourceMappingURL=data:application/json;base64,' +
            btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
            ' */';
        }

        if (isOldIE) {
          style.element = style.element || document.querySelector('style[data-group=' + group + ']');
        }

        if (!style.element) {
          const el = style.element = document.createElement('style');
          el.type = 'text/css';

          if (css.media) el.setAttribute('media', css.media);
          if (isOldIE) {
            el.setAttribute('data-group', group);
            el.setAttribute('data-next-index', '0');
          }

          head.appendChild(el);
        }

        if (isOldIE) {
          index = parseInt(style.element.getAttribute('data-next-index'));
          style.element.setAttribute('data-next-index', index + 1);
        }

        if (style.element.styleSheet) {
          style.parts.push(code);
          style.element.styleSheet.cssText = style.parts
            .filter(Boolean)
            .join('\n');
        } else {
          const textNode = document.createTextNode(code);
          const nodes = style.element.childNodes;
          if (nodes[index]) style.element.removeChild(nodes[index]);
          if (nodes.length) style.element.insertBefore(textNode, nodes[index]);
          else style.element.appendChild(textNode);
        }
      }
    }
  }
  /* style inject SSR */
  

  
  var Navigation = __vue_normalize__$4(
    { render: __vue_render__$4, staticRenderFns: __vue_staticRenderFns__$4 },
    __vue_inject_styles__$4,
    __vue_script__$4,
    __vue_scope_id__$4,
    __vue_is_functional_template__$4,
    __vue_module_identifier__$4,
    __vue_create_injector__$3,
    undefined
  );

export default Hooper;
export { Hooper, Slide, Progress, Pagination, Navigation, Icons };
