/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {REACT_PROVIDER_TYPE, REACT_CONTEXT_TYPE} from 'shared/ReactSymbols';

import type {ReactContext} from 'shared/ReactTypes';

/**
 * 创建一个Context对象 
 * @param {*} defaultValue  
 * @param {*} calculateChangedBits //使用Object.is()计算新老context的差异
 */
export function createContext<T>(
  defaultValue: T,
  calculateChangedBits: ?(a: T, b: T) => number,
): ReactContext<T> {
  /**
   * 处理calculateChangedBits
   */
  if (calculateChangedBits === undefined) {
    calculateChangedBits = null;
  } else {
    if (__DEV__) {
      if (
        calculateChangedBits !== null &&
        typeof calculateChangedBits !== 'function'
      ) {
        console.error(
          'createContext: Expected the optional second argument to be a ' +
            'function. Instead received: %s',
          calculateChangedBits,
        );
      }
    }
  }

  const context: ReactContext<T> = {
    //标识该对象为 context类型
    $$typeof: REACT_CONTEXT_TYPE,    
    _calculateChangedBits: calculateChangedBits,
    /**
     * 作为支持多个并发渲染器的解决方法，我们将一些渲染器分类为主要渲染器，将其他渲染器分类为辅助渲染器。
     * 我们只希望最多有两个并发渲染器：React Native（主要）和Fabric（次要）;React DOM（主要）和React ART（次要）。
     *  辅助渲染器将自己的context的value存储在单独的字段中。
     * <Provider value={xxx}>中的value就是赋值给_currentValue的
     * 也就是说_currentValue和_currentValue2作用是一样的，只是分别给主渲染器和辅助渲染器使用
     */

    _currentValue: defaultValue,
    _currentValue2: defaultValue,
    //用来追踪该context的并发渲染器的数量
    _threadCount: 0,
    // These are circular
    Provider: (null: any),
    Consumer: (null: any),
  };

  // Provider 是 context 的提供者，可以给这个组件传一个value值来覆盖createContext传入的默认值，当value值变化时就会通知到子级的消费者。
  context.Provider = {
    // 用于表示Provider
    $$typeof: REACT_PROVIDER_TYPE,
    // 将context赋值给_context
    _context: context,
  };

  let hasWarnedAboutUsingNestedContextConsumers = false;
  let hasWarnedAboutUsingConsumerProvider = false;

  if (__DEV__) {
    // A separate object, but proxies back to the original context object for
    // backwards compatibility. It has a different $$typeof, so we can properly
    // warn for the incorrect usage of Context as a Consumer.
    const Consumer = {
      $$typeof: REACT_CONTEXT_TYPE,
      _context: context,
      _calculateChangedBits: context._calculateChangedBits,
    };
    // $FlowFixMe: Flow complains about not setting a value, which is intentional here
    Object.defineProperties(Consumer, {
      Provider: {
        get() {
          if (!hasWarnedAboutUsingConsumerProvider) {
            hasWarnedAboutUsingConsumerProvider = true;
            console.error(
              'Rendering <Context.Consumer.Provider> is not supported and will be removed in ' +
                'a future major release. Did you mean to render <Context.Provider> instead?',
            );
          }
          return context.Provider;
        },
        set(_Provider) {
          context.Provider = _Provider;
        },
      },
      _currentValue: {
        get() {
          return context._currentValue;
        },
        set(_currentValue) {
          context._currentValue = _currentValue;
        },
      },
      _currentValue2: {
        get() {
          return context._currentValue2;
        },
        set(_currentValue2) {
          context._currentValue2 = _currentValue2;
        },
      },
      _threadCount: {
        get() {
          return context._threadCount;
        },
        set(_threadCount) {
          context._threadCount = _threadCount;
        },
      },
      Consumer: {
        get() {
          if (!hasWarnedAboutUsingNestedContextConsumers) {
            hasWarnedAboutUsingNestedContextConsumers = true;
            console.error(
              'Rendering <Context.Consumer.Consumer> is not supported and will be removed in ' +
                'a future major release. Did you mean to render <Context.Consumer> instead?',
            );
          }
          return context.Consumer;
        },
      },
    });
    // $FlowFixMe: Flow complains about missing properties because it doesn't understand defineProperty
    context.Consumer = Consumer;
  } else {
    //Consumber对象指向React.Context对象,是为了立即拿到<Provider>提供的最新值
    // 在<Consumer>进行渲染时，为了保证Consumer拿到最新的值,直接让Consumer=React.Context，    
    // React.Context中的_currentValue已经被<Provider>的value给赋值了,所以Consumer能立即拿到最新的值
    context.Consumer = context;
  }

  if (__DEV__) {
    context._currentRenderer = null;
    context._currentRenderer2 = null;
  }

  return context;
}
