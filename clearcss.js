/**
 * clearcss.js ����css����Ľű�
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
    // ���Դ���iframe��document
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
 * css���������
 * @example
 * var parser = new CssParser('body div {margin:0;}');
 * var selectors = parser.getSelectors();
 * TODO
 * 1. ��,�ָ�Ϊ������ѡ����
 * 2. ֧���к�����
 */
function CssParser(css) {
  var REG_CLEARCSS = /(\/\*((?!\*\/).|\r|\n)*\*\/)|\r|\n|(@import\s+[^;]+;)|(@charset\s+[^;]+;)/g,
    REG_ATRULEBLOCK = /@[^{]+{([^{}]+{[^{}]*})*}/g;

  this.css = typeof css === "string" ? css.trim() : "";
  // ÿ��@������ַ�������ʱ���棬��������
  this.atRuleBlock = [];
  // ȥ��atRules�����ͨ����
  this.rules = "";

  /* ���ע�͡�����
   * @import��@charset��ͬ������@������󲻸������ţ��Ҳ�����css selector����˵�������
   */
  this.initClear = function() {
    return this.css.replace(REG_CLEARCSS, "");
  };
  /**
   * ��ȡ@��ͷ�Ĺ�����Ϊ������һ���﷨�ν��н���
   * @param {String} css initClear()���˺��cssƬ��
   */
  this.setAtRuleBlock = function() {
    this.atRuleBlock = this.css.match(REG_ATRULEBLOCK);
  };
  /**
   * ȥ������@��ͷ�Ĺ��򣬱����ɳ��������ɵ�cssƬ��
   * @param {String} css initClear()���˺��cssƬ��
   */
  this.setRules = function() {
    this.rules = this.css.replace(REG_ATRULEBLOCK, "").trim();
  };
  /**
   * �ӳ����﷨Ƭ��this.rules����ȡcss selector������Ϊһ���ַ�������
   * @param {String} ֻ������������cssƬ��
   * @return {Array} ��css selector��ɵ�����
   */
  this.getSelectorFromRules = function(rules) {
    var selectors = rules.replace(/\s*{[^{}]*}\s*/g, "|").split("|");
    selectors.pop();
    return selectors;
  };
  /**
   * ��ȡʵ������ʱ�����css����Ƭ�ξ���ת������ȡ��css selector����
   * @return {Array} �洢css selectors���ַ�������
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
 * ��ȡwindow��iframe������stylesheet��selector
 * @param {Window|Iframe} context Ҫ���ҵĻ���
 * @return {Array} �洢��context������selector
 */
function getSelectorsFromContext(context) {
  var selectors = [];
  var links = m.$("link", context);
  for(var i=0,l=links.length; i<l; i++) {
    if(toString.call(links[i].sheet).indexOf("CSSStyleSheet") != -1) {
      // chrome����ʶ��Ϊstylesheet���ɹ���ȡ���ļ��ڵ�css���򣨱������rel="stylesheet"��
      selectors = selectors.concat(getSelectorsFromOneLink(links[i]));
    } else {
      // �ж��Ƿ�Ϊ��ʽ�ļ�����������ٵ���CssParser��ȡselector
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
 * ��һ��link��ǩ�л�ȡselector����getSelectorsFromContext����
 * @param {CSSStyleSheet} link ����ȷʶ��Ϊstylesheet��link��ǩ
 * @return {Array} �洢��stylesheet�����е�css selector
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
 * ���ݴ����selectorAdapt���󣬲���û��ʹ�õ���selector
 * @param {Object} adapt {context: window, selectors: []}
 * @return {Array} û��ʹ�õ���selector����
 */
function checkDomBySelectors(adapt) {
  var unusedCss = [];
  var s = adapt.selectors;
  for(var i=0,l=s.length; i<l; i++) {
    // ����@media screen{}֮��Ĺ��򣬻�ռ��һ��cssRules������������Ϊundefined�������Ҫ����s[i]�Ƿ���ڵ��ж�
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
   * �洢�������ĺ͸�������������selector��ɵĶ��������
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
