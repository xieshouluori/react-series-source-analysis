/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

 /**
  * 该js的作用：定义并导出两个基础类 Component、PureComponent
  */

import invariant from 'shared/invariant';

import ReactNoopUpdateQueue from './ReactNoopUpdateQueue';

const emptyObject = {};
if (__DEV__) {
  // Object.freeze() 冻结一个对象。一个被冻结的对象再也不能被修改；冻结了一个对象则不能向这个对象添加新的属性，不能删除已有属性，不能修改该对象已有属性的可枚举性、可配置性、可写性，以及不能修改已有属性的值
  Object.freeze(emptyObject);
}

/**
 * 
 * 使用ES6 classes方式定义React组件的基类
 */
function Component(props, context, updater) {
 /**
  * 1、 定义了四个实例属性
  */
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  this.updater = updater || ReactNoopUpdateQueue;
}
/**
 * 2、 在原型上定义属性isReactComponent，用于辨认是否是react组件
 */
Component.prototype.isReactComponent = {};


/**
 * 3、在原型上定义方法setState，用于更新state
 * 
 */
// 参数：partialState 可以为对象或函数，用于生成下一个状态的state； callback：状态更新之后的回调函数
Component.prototype.setState = function(partialState, callback) {
  // 参数校验
  invariant(
    typeof partialState === 'object' ||
      typeof partialState === 'function' ||
      partialState == null,
    'setState(...): takes an object of state variables to update or a ' +
      'function which returns an object of state variables.',
  );
  this.updater.enqueueSetState(this, partialState, callback, 'setState');
};

/**
 *4、 在原型上定义方法forceUpdate ：强制更新
 */
Component.prototype.forceUpdate = function(callback) {
  this.updater.enqueueForceUpdate(this, callback, 'forceUpdate');
};

/**
 * Deprecated APIs. These APIs used to exist on classic React classes but since
 * we would like to deprecate them, we're not going to move them over to this
 * modern base class. Instead, we define a getter that warns if it's accessed.
 */
if (__DEV__) {
  const deprecatedAPIs = {
    isMounted: [
      'isMounted',
      'Instead, make sure to clean up subscriptions and pending requests in ' +
        'componentWillUnmount to prevent memory leaks.',
    ],
    replaceState: [
      'replaceState',
      'Refactor your code to use setState instead (see ' +
        'https://github.com/facebook/react/issues/3236).',
    ],
  };
  const defineDeprecationWarning = function(methodName, info) {
    Object.defineProperty(Component.prototype, methodName, {
      get: function() {
        console.warn(
          '%s(...) is deprecated in plain JavaScript React classes. %s',
          info[0],
          info[1],
        );
        return undefined;
      },
    });
  };
  for (const fnName in deprecatedAPIs) {
    if (deprecatedAPIs.hasOwnProperty(fnName)) {
      defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
    }
  }
}

function ComponentDummy() {}
ComponentDummy.prototype = Component.prototype;


/**
 * React.PureComponent 与 React.Component 很相似。两者的区别在于 React.Component 并未实现 shouldComponentUpdate()，而 React.PureComponent 中以浅层对比 prop 和 state 的方式来实现了该函数。
 * React.PureComponent 中的 shouldComponentUpdate() 仅作对象的浅层比较。如果对象中包含复杂的数据结构，则有可能因为无法检查深层的差别，产生错误的比对结果。
 * 仅在你的 props 和 state 较为简单时，才使用 React.PureComponent，或者在深层数据结构发生变化时调用 forceUpdate() 来确保组件被正确地更新。你也可以考虑使用 immutable 对象加速嵌套数据的比较。
 * React.PureComponent 中的 shouldComponentUpdate() 将跳过所有子组件树的 prop 更新。因此，请确保所有子组件也都是“纯”的组件。
 */
function PureComponent(props, context, updater) {
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  this.updater = updater || ReactNoopUpdateQueue;
}
/**
 * 寄生组合式继承
*ComponentDummy的作用就是断开对于Component.prototype的引用，这样在修改PureComponent的原型链方法的时候不会对Component造成影响，同时为了避免原型链的跳跃，做了一个Object.assign(pureComponentPrototype, Component.prototype);的处理。
 */
const pureComponentPrototype = (PureComponent.prototype = new ComponentDummy());
pureComponentPrototype.constructor = PureComponent;
// Object.assign() 方法用于将所有可枚举属性的值从一个或多个源对象复制到目标对象。它将返回目标对象。
Object.assign(pureComponentPrototype, Component.prototype);
// isPureComponent 属性便于 React-dom 辨认是否是纯组件
pureComponentPrototype.isPureReactComponent = true;

export {Component, PureComponent};
