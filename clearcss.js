/**
 * clearcss.js 清理css插件的脚本
 * @author MoLice<sf.molice@gmail.com>
 * @create 2012-09-10
 */
var m = (function(M) {
  function m() {}
  for(var key in M) {
    m.prototype[key] = M[key];
  }
  return new m();
})({
  "DEBUG": true,
  "log": function() {
    if(this.DEBUG)
      console.log(arguments);
  },
  "extend": function(base, extra, isDeep) {
    var deep = typeof arguments[2] == "boolean" ? arguments[2] : false;
    if(!base)
      base = {};
    for(var key in extra) {
      if(base[key] != extra[key]) {
        if(deep && typeof extra[key] == "object") {
          base[key] = this.extend(base[key], extra[key], true);
        } else {
          base[key] = extra[key];
        }
      }
    }
    return base;
  },
  "$": function(s, context) {
    if(typeof s !== "string")
      return null;
    // 可以传入iframe的document
    context = context && ((context.document || context.contentDocument) ? (context.document || context.contentDocument) : context) || document;
    return context.querySelectorAll(s);
  },
  "localStorage": function(key, value) {
    if(!window.localStorage) {
      this.log("function localStorage: not support html5 localStorage");
      return this;
    }
    if(value) {
      // save
      localStorage.setItem(key, value);
      return this;
    } else {
      return localStorage.getItem(key);
    }
  },
  "ajax": function(setting) {
    var xhr,
      self = this,
      opt = {
        url: "",
        method: "get",
        data: {},
        onSuccess: function(data) {
          self.log("ajax.onSuccess, data = ", data);
        },
        onError: function(data) {
          self.log("ajax.onError, data = ", data);
        }
      },
      setting = this.extend(opt,setting);
    if(!window.XMLHttpRequest) {
      this.log("function ajax: window.XMLHttpRequest is undefined");
      return this;
    }
    if(setting.url == "") {
      this.log("function ajax: the url is empty");
      return this;
    }
    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if(xhr.readyState == 4) {
        if(xhr.status == 200) {
          setting.onSuccess.call(xhr, {
            setting: setting,
            response: xhr.responseText
          });
        } else {
          setting.onError.call(xhr, {
            setting: setting,
            response: xhr.responseText,
            status: xhr.status
          });
        }
      }
    };
    if(setting.method == "post") {
      xhr.open("post", setting.url, true);
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      xhr.send(this.objectToQuery(setting.data));
    } else {
      setting.url += (setting.url.indexOf("?") == -1 ? "?" : "&") + "t=" + Math.random();
      xhr.open("get",setting.url,true);
      xhr.send();
    }
    return this;
  },
  "objectToQuery": function(object) {
    if(typeof object !== "object")
      return "";
    var result = "";
    for(var key in object) {
      result += key + "=" + object[key] + "&";
    }
    return result.substring(0, result.length - 1);
  },
  "queryToObject": function(query) {
    var result = {},
      tmp = query.split("&"),
      param;
    for(var key in tmp) {
      param = tmp[key].split("=");
      if(param.length != 2)
        return {};
      result[param[0]] = param[1];
    }
    return result;
  }
});

/**
 * css规则过滤器
 * @example
 * var parser = new CssParser('body div {margin:0;}');
 * var selectors = parser.getSelectors();
 * TODO
 * 1. 将,分隔为独立的选择器
 * 2. 支持行号提醒
 */
function CssParser(css) {
  var REG_CLEARCSS = /(\/\*((?!\*\/).|\r|\n)*\*\/)|\r|\n|(@import\s+[^;]+;)|(@charset\s+[^;]+;)/g,
    REG_ATRULEBLOCK = /@[^{]+{([^{}]+{[^{}]*})*}/g;

  this.css = typeof css === "string" ? css.trim() : "";
  // 每个@规则的字符串，暂时保存，不作处理
  this.atRuleBlock = [];
  // 去除atRules后的普通规则
  this.rules = "";

  /* 清除注释、换行
   * @import、@charset不同于其他@规则，其后不跟花括号，且不包含css selector，因此单独处理
   */
  this.initClear = function() {
    return this.css.replace(REG_CLEARCSS, "");
  };
  /**
   * 获取@开头的规则，作为独立的一段语法段进行解析
   * @param {String} css initClear()过滤后的css片段
   */
  this.setAtRuleBlock = function() {
    this.atRuleBlock = this.css.match(REG_ATRULEBLOCK);
  };
  /**
   * 去除所有@开头的规则，保存由常规规则组成的css片段
   * @param {String} css initClear()过滤后的css片段
   */
  this.setRules = function() {
    this.rules = this.css.replace(REG_ATRULEBLOCK, "").trim();
  };
  /**
   * 从常规语法片段this.rules中提取css selector，保存为一个字符串数组
   * @param {String} 只包含常规规则的css片段
   * @return {Array} 由css selector组成的数组
   */
  this.getSelectorFromRules = function(rules) {
    var selectors = rules.replace(/\s*{[^{}]*}\s*/g, "|").split("|");
    selectors.pop();
    return selectors;
  };
  /**
   * 获取实例化类时传入的css代码片段经过转换后提取的css selector数组
   * @return {Array} 存储css selectors的字符串数组
   */
  this.getSelectors = function() {
    return this.getSelectorFromRules(this.rules);
  };
  // init
  this.css = this.initClear(this.css);
  //console.log("this.css-> ", this.css);
  this.setAtRuleBlock(this.css);
  //console.log("this.atRuleBlock-> ", this.atRuleBlock);
  this.setRules(this.css);
  //console.log("this.rules-> ", this.rules);
}

/**
 * 获取window或iframe中所有stylesheet的selector
 * @param {Window|Iframe} context 要查找的环境
 * @return {Array} 存储该context内所有selector
 */
function getSelectorsFromContext(context) {
  var selectors = [];
  var links = m.$("link", context);
  for(var i=0,l=links.length; i<l; i++) {
    if(toString.call(links[i].sheet).indexOf("CSSStyleSheet") != -1) {
      // chrome将其识别为stylesheet并成功获取到文件内的css规则（必须包含rel="stylesheet"）
      selectors = selectors.concat(getSelectorsFromOneLink(links[i]));
    } else {
      // 判断是否为样式文件，如果是则再调用CssParser获取selector
      if(!links[i].href)
        continue;
      if(!links[i].rel || links[i] == "stylesheet") {
        if(!links[i].type || links[i].type == "text/css") {
          m.ajax({
            url: links[i].href,
            onSuccess: function(data) {
              if(typeof data.response === "string") {
                var parser = new CssParser(data.response);
                selectors = selectors.concat(parser.getSelectors());
              }
            }
          });
        }
      }
    }
  }
  return selectors;
}
/**
 * 从一个link标签中获取selector，被getSelectorsFromContext调用
 * @param {CSSStyleSheet} link 被正确识别为stylesheet的link标签
 * @return {Array} 存储该stylesheet内所有的css selector
 */
function getSelectorsFromOneLink(link) {
  var result = [];
  var rules = link.sheet.cssRules || [];
  for(var i=0,l=rules.length; i<l; i++) {
    result.push(rules[i].selectorText);
  }
  return result;
}
/**
 * 根据传入的selectorAdapt对象，查找没被使用到的selector
 * @param {Object} adapt {context: window, selectors: []}
 * @return {Array} 没被使用到的selector数组
 */
function checkDomBySelectors(adapt) {
  var unusedCss = [];
  var s = adapt.selectors;
  for(var i=0,l=s.length; i<l; i++) {
    // 类似@media screen{}之类的规则，会占用一个cssRules索引，但内容为undefined，因此需要增加s[i]是否存在的判断
    if(s[i] && !m.$(s[i], adapt.context).length) {
      //console.log("adapt", adapt, "i", i, "selectors[i]", adapt.selectors[i]);
      unusedCss.push(s[i]);
    }
  }
  return unusedCss;
}
(function() {
  var contexts = [window].concat(m.extend([], m.$("iframe[src]")));
  /**
   * 存储由上下文和该上下文内所有selector组成的对象的数组
   * @example [{context: window, selectors: ["body", ".container"]}, {context: iframe1, selectors: ["body", ".container"]}]
   */
  var selectorAdapts = [];
  for(var i=0,l=contexts.length; i<l; i++) {
    selectorAdapts[i] = {
      context: contexts[i],
      selectors: getSelectorsFromContext(contexts[i])
    };
    console.log("unusedCss-> ", checkDomBySelectors(selectorAdapts[i]));
    console.log("context-> ", contexts[i]);
  }
})();
