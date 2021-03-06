/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from 'shared/invariant';
import {REACT_ELEMENT_TYPE} from 'shared/ReactSymbols';

import ReactCurrentOwner from './ReactCurrentOwner';

// 返回一个布尔值，只是对象自身属性中是否具有指定的属性
const hasOwnProperty = Object.prototype.hasOwnProperty;

// 内建保留的props
const RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true,
};

let specialPropKeyWarningShown, specialPropRefWarningShown;

// 判断ref是否存在和ref是否合法
function hasValidRef(config) {
  if (__DEV__) {
    if (hasOwnProperty.call(config, 'ref')) {
      /**
       * Object.getOwnPropertyDescriptor() 方法返回指定对象上一个自有属性对应的属性描述符。（自有属性指的是直接赋予该对象的属性，不需要从原型链上进行查找的属性）
       * get方法：获取该属性的访问器函数（getter）。如果没有访问器， 该值为undefined。
       */
      const getter = Object.getOwnPropertyDescriptor(config, 'ref').get;
      if (getter && getter.isReactWarning) {
        return false;
      }
    }
  }
  return config.ref !== undefined;
}

// 判断key是否存在和key是否合法
function hasValidKey(config) {
  if (__DEV__) {
    if (hasOwnProperty.call(config, 'key')) {
      const getter = Object.getOwnPropertyDescriptor(config, 'key').get;
      if (getter && getter.isReactWarning) {
        return false;
      }
    }
  }
  return config.key !== undefined;
}
/**
 * 设置key的访问器函数
 * 不允许开发者去props上直接获取key，开发环境下，会给出警告日志。通过defineProperty方法设置key的访问器属性。
 */
function defineKeyPropWarningGetter(props, displayName) {
  const warnAboutAccessingKey = function() {
    if (__DEV__) {
      if (!specialPropKeyWarningShown) {
        specialPropKeyWarningShown = true;
        console.error(
          '%s: `key` is not a prop. Trying to access it will result ' +
            'in `undefined` being returned. If you need to access the same ' +
            'value within the child component, you should pass it as a different ' +
            'prop. (https://fb.me/react-special-props)',
          displayName,
        );
      }
    }
  };
  warnAboutAccessingKey.isReactWarning = true;
  Object.defineProperty(props, 'key', {
    get: warnAboutAccessingKey,
    configurable: true,
  });
}
/**
 * 设置ref的访问器函数
 * 不允许开发者去props上直接获取ref，开发环境下，会给出警告日志。
 */
function defineRefPropWarningGetter(props, displayName) {
  const warnAboutAccessingRef = function() {
    if (__DEV__) {
      if (!specialPropRefWarningShown) {
        specialPropRefWarningShown = true;
        console.error(
          '%s: `ref` is not a prop. Trying to access it will result ' +
            'in `undefined` being returned. If you need to access the same ' +
            'value within the child component, you should pass it as a different ' +
            'prop. (https://fb.me/react-special-props)',
          displayName,
        );
      }
    }
  };
  warnAboutAccessingRef.isReactWarning = true;
  Object.defineProperty(props, 'ref', {
    get: warnAboutAccessingRef,
    configurable: true,
  });
}

/**
 * 使用工厂方法创建一个React 元素。而不在使用类的模式创建。
 * 作用：使用$$typeof的值来识别是否为一个React 元素
 *
 * @param {*} type
 * @param {*} props
 * @param {*} key
 * @param {string|object} ref
 * @param {*} owner
 * @param {*} self A *temporary* helper to detect places where `this` is
 * different from the `owner` when React.createElement is called, so that we
 * can warn. We want to get rid of owner and replace string `ref`s with arrow
 * functions, and as long as `this` and owner are the same, there will be no
 * change in behavior.
 * @param {*} source An annotation object (added by a transpiler or otherwise)
 * indicating filename, line number, and/or other information.
 * @internal
 */
const ReactElement = function(type, key, ref, self, source, owner, props) {
  /**
   * 1、创建一个element对象
   */
  const element = {
    // This tag allows us to uniquely identify this as a React Element
    // 用于唯一标识react组件的标签。用于确定是否属于ReactElement
    $$typeof: REACT_ELEMENT_TYPE,
    
    //来判断如何创建节点
    type: type,  
    // 内置属性
    key: key,
    ref: ref,
    // 属性和子元素
    props: props,

    // 记录创建此元素的组件
    _owner: owner,
  };
  //2、 如果是开发环境，添加 _store、_self、_source属性
  // _store、_self和_source属性都是用来在开发环境中方便测试提供的，用来比对两个ReactElement
  if (__DEV__) {
    // The validation flag is currently mutative. We put it on
    // an external backing store so that we can freeze the whole object.
    // This can be replaced with a WeakMap once they are implemented in
    // commonly used development environments.
    element._store = {};

    // To make comparing ReactElements easier for testing purposes, we make
    // the validation flag non-enumerable (where possible, which should
    // include every environment we run tests in), so the test framework
    // ignores it.
    Object.defineProperty(element._store, 'validated', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: false,
    });
    // self and source are DEV only properties.
    Object.defineProperty(element, '_self', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: self,
    });
    // Two elements created in two different places should be considered
    // equal for testing purposes and therefore we hide it from enumeration.
    Object.defineProperty(element, '_source', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: source,
    });
    // 调用Object.freeze方法冻结props和element，防止被修改
    if (Object.freeze) {
      Object.freeze(element.props);
      Object.freeze(element);
    }
  }
  // 3、返回element对象
  return element;
};

/**
 * https://github.com/reactjs/rfcs/pull/107
 * @param {*} type
 * @param {object} props
 * @param {string} key
 */
export function jsx(type, config, maybeKey) {
  let propName;

  // Reserved names are extracted
  const props = {};

  let key = null;
  let ref = null;

  // Currently, key can be spread in as a prop. This causes a potential
  // issue if key is also explicitly declared (ie. <div {...props} key="Hi" />
  // or <div key="Hi" {...props} /> ). We want to deprecate key spread,
  // but as an intermediary step, we will use jsxDEV for everything except
  // <div {...props} key="Hi" />, because we aren't currently able to tell if
  // key is explicitly declared to be undefined or not.
  if (maybeKey !== undefined) {
    key = '' + maybeKey;
  }

  if (hasValidKey(config)) {
    key = '' + config.key;
  }

  if (hasValidRef(config)) {
    ref = config.ref;
  }

  // Remaining properties are added to a new props object
  for (propName in config) {
    if (
      hasOwnProperty.call(config, propName) &&
      !RESERVED_PROPS.hasOwnProperty(propName)
    ) {
      props[propName] = config[propName];
    }
  }

  // Resolve default props
  if (type && type.defaultProps) {
    const defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }

  return ReactElement(
    type,
    key,
    ref,
    undefined,
    undefined,
    ReactCurrentOwner.current,
    props,
  );
}

/**
 * https://github.com/reactjs/rfcs/pull/107
 * @param {*} type
 * @param {object} props
 * @param {string} key
 */
export function jsxDEV(type, config, maybeKey, source, self) {
  let propName;

  // Reserved names are extracted
  const props = {};

  let key = null;
  let ref = null;

  // Currently, key can be spread in as a prop. This causes a potential
  // issue if key is also explicitly declared (ie. <div {...props} key="Hi" />
  // or <div key="Hi" {...props} /> ). We want to deprecate key spread,
  // but as an intermediary step, we will use jsxDEV for everything except
  // <div {...props} key="Hi" />, because we aren't currently able to tell if
  // key is explicitly declared to be undefined or not.
  if (maybeKey !== undefined) {
    key = '' + maybeKey;
  }

  if (hasValidKey(config)) {
    key = '' + config.key;
  }

  if (hasValidRef(config)) {
    ref = config.ref;
  }

  // Remaining properties are added to a new props object
  for (propName in config) {
    if (
      hasOwnProperty.call(config, propName) &&
      !RESERVED_PROPS.hasOwnProperty(propName)
    ) {
      props[propName] = config[propName];
    }
  }

  // Resolve default props
  if (type && type.defaultProps) {
    const defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }

  if (key || ref) {
    const displayName =
      typeof type === 'function'
        ? type.displayName || type.name || 'Unknown'
        : type;
    if (key) {
      defineKeyPropWarningGetter(props, displayName);
    }
    if (ref) {
      defineRefPropWarningGetter(props, displayName);
    }
  }

  return ReactElement(
    type,
    key,
    ref,
    self,
    source,
    ReactCurrentOwner.current,
    props,
  );
}

/**
 * 功能： 创建并返回给定类型的新ReactElement。
 */
// 参数：type:元素类型 config：包含属性的对象  children：子元素

export function createElement(type, config, children) {
  let propName;

  // 存放属性和子元素
  const props = {};

  let key = null;
  let ref = null;
  let self = null;
  let source = null;

  /**
   *1、 处理属性对象 config
   */
  if (config != null) {
    // 判断ref属性是否存在，如果存在，赋给变量ref
    if (hasValidRef(config)) {
      ref = config.ref;
    }
    // 判断key属性是否存在，如果存在将key转成字符串赋给变量key
    if (hasValidKey(config)) {
      key = '' + config.key;
    }
    // 处理属性__self和__source
    self = config.__self === undefined ? null : config.__self;
    source = config.__source === undefined ? null : config.__source;
   
    // 过滤掉ref、key、self、source这四个属性，循环剩余属性分别赋给props
    for (propName in config) {
      if (
        hasOwnProperty.call(config, propName) &&
        !RESERVED_PROPS.hasOwnProperty(propName)
      ) {
        props[propName] = config[propName];
      }
    }
  }
  /**
   * 2、处理children---赋给props的children属性。
   * arguments.length-2是为了排除掉type和config这两个属性。React.createElement会把第2个参数之后的所有参数都看做是子元素，并最终赋值给props.children属性。
   * children个数可能至于一个，也可能大于一个。导致props.children可能是对象，也可能是数组
   */

  // 获取children的个数 
  const childrenLength = arguments.length - 2;
  // 如果个数为1，将children直接赋给props的children属性。则props.children为对象
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    // 如果个数大于1 ，使用Array()创建一个数组childArray，存放所有child。此时props.children为数组
    const childArray = Array(childrenLength);
    for (let i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    if (__DEV__) {
      if (Object.freeze) {
        Object.freeze(childArray);
      }
    }
    props.children = childArray;
  }
/**
 * 3、处理组件的默认参数
 * eg:
 * class App extends React.Component {
      render() {
        return <div>{this.props.name}</div>
      }
    }

    App.defaultProps = {
      name: "Hello React"
    };
    如上，App就是 type，App.defaultProps就是type.defaultProps
 */ 
  if (type && type.defaultProps) {
    const defaultProps = type.defaultProps;
    // 默认参数为对象，遍历默认参数的属性，分别赋值给props
    for (propName in defaultProps) {
      // 如果props中该属性的值是undefined，就把defaultProps中的值赋给props。
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }
  /**
   * 如果在开发模式下就会调用Object.defineProperty方法去定义props对象下的key和ref属性，通过Object.defineProperty去修改key和ref属性的get方法，这样如果你就开发模式下尝试去调用key和ref属性就会控制台就是有警告提示。
   */
  // function.displayName 属性获取函数的显示名称.该特性是非标准的，请尽量不要在生产环境中使用它！
  // var popup = function(content) { console.log(content); };
  // popup.displayName = 'Show Popup';
  // console.log(popup.displayName); // "Show Popup"

  if (__DEV__) {
    if (key || ref) {
      const displayName =
        typeof type === 'function'
          ? type.displayName || type.name || 'Unknown'
          : type;
      if (key) {
        defineKeyPropWarningGetter(props, displayName);
      }
      if (ref) {
        defineRefPropWarningGetter(props, displayName);
      }
    }
  }
  //4、 调用ReactElement方法，返回一个ReactElement对象，这个对象保存了组件渲染时候需要的用到的一系列属性
  return ReactElement(
    type,
    key,
    ref,
    self,
    source,
    ReactCurrentOwner.current,
    props,
  );
}

/**
 * 功能：返回用于生成指定类型 React 元素的函数 （此函数已废弃）
 * 建议使用 JSX 或直接调用 React.createElement() 来替代它。
 */
// 参数：type 可以是标签名字符串（eg：div、span）、React组件类型（class组件或函数组件）、React fragment类型
export function createFactory(type) {
  /**
   * 1、 执行createElement方法
   * Function.prototype.bind() 返回一个原函数的拷贝，并拥有指定的 this 值和初始参数。不会立马执行。
   * 在 bind() 被调用时，这个新函数的 this 被指定为 bind() 的第一个参数，而其余参数将作为新函数的参数，供调用时使用
  */

  const factory = createElement.bind(null, type);
 
  /**
   * 2、 将type属性暴露给factory，以方便从元素上直接访问该type属性 E.g. `<Foo />.type === Foo`
  */
  factory.type = type;
  return factory;
}

/**
 * 功能： 以 element 元素为样板克隆并返回新的 React 元素,并修改原始元素的key
 */
export function cloneAndReplaceKey(oldElement, newKey) {
  const newElement = ReactElement(
    oldElement.type,
    newKey,
    oldElement.ref,
    oldElement._self,
    oldElement._source,
    oldElement._owner,
    oldElement.props,
  );

  return newElement;
}

/**
 *功能： 以 element 元素为样板克隆并返回新的 React 元素
 * 返回元素的 props 是将新的 props 与原始元素的 props 浅层合并后的结果。新的子元素将取代现有的子元素，而来自原始元素的 key 和 ref 将被保留。
 * 应用：把子组件需要的属性和回调函数通过cloneElement的方式merge进去。从一定程度上减少代码的重复书写
 */
export function cloneElement(element, config, children) {
  invariant(
    !(element === null || element === undefined),
    'React.cloneElement(...): The argument must be a React element, but you passed %s.',
    element,
  );

  let propName;

  //1、复制原始元素的props生成新的props对象。
  const props = Object.assign({}, element.props);

  //2、提取原始元素的key、ref、self、source （提取内建props相关的值）
  let key = element.key;
  let ref = element.ref;
  // Self is preserved since the owner is preserved.
  const self = element._self;
  // Source is preserved since cloneElement is unlikely to be targeted by a
  // transpiler, and the original source is probably a better indicator of the
  // true owner.
  const source = element._source;

  // Owner will be preserved, unless ref is overridden
  let owner = element._owner;

  //3、 处理config
  if (config != null) {
    if (hasValidRef(config)) {
      // Silently steal the ref from the parent.
      ref = config.ref;
      owner = ReactCurrentOwner.current;
    }
    if (hasValidKey(config)) {
      key = '' + config.key;
    }

    // 剩余属性覆盖旧元素上的属性
    let defaultProps;
    if (element.type && element.type.defaultProps) {
      defaultProps = element.type.defaultProps;
    }
    for (propName in config) {
      if (
        hasOwnProperty.call(config, propName) &&
        !RESERVED_PROPS.hasOwnProperty(propName)
      ) {
        if (config[propName] === undefined && defaultProps !== undefined) {
          // Resolve default props
          props[propName] = defaultProps[propName];
        } else {
          props[propName] = config[propName];
        }
      }
    }
  }

  //4、 处理子元素
  const childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    const childArray = Array(childrenLength);
    for (let i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    props.children = childArray;
  }
  // 5、通过ReactElement方法 返回一个React元素
  return ReactElement(element.type, key, ref, self, source, owner, props);
}
/**
 *功能：验证对象是否为 React 元素，返回值为 true 或 false。
 *验证条件：为对象类型，且$$typeof属性的值为REACT_ELEMENT_TYPE
 */
export function isValidElement(object) {
  return (
    typeof object === 'object' &&
    object !== null &&
    object.$$typeof === REACT_ELEMENT_TYPE
  );
}
