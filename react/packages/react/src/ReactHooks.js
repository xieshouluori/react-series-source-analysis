/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  ReactContext,
  ReactEventResponder,
  ReactEventResponderListener,
} from 'shared/ReactTypes';
import invariant from 'shared/invariant';
import {REACT_RESPONDER_TYPE} from 'shared/ReactSymbols';

import ReactCurrentDispatcher from './ReactCurrentDispatcher';


function resolveDispatcher() {
  // 获取了 ReactCurrentDispatcher 的 current 属性。
  const dispatcher = ReactCurrentDispatcher.current;
  // 当这个属性值为空时报错，否则返回这个对象。
  invariant(
    dispatcher !== null,
    'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
      ' one of the following reasons:\n' +
      '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
      '2. You might be breaking the Rules of Hooks\n' +
      '3. You might have more than one copy of React in the same app\n' +
      'See https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem.',
  );
  return dispatcher;
}
/**
 * useContext
 * 使用 const value = useContext(MyContext);接收一个 context 对象（React.createContext 的返回值）并返回该 context 的当前值
 * 当前的 context 值由上层组件中距离当前组件最近的 <MyContext.Provider> 的 value prop 决定。
 * 调用了 useContext 的组件总会在 context 值变化时重新渲染。
 * @param {*} Context  createContext 返回的结果
 * @param {*} unstable_observedBits  计算新老 context 变化相关的参数，保留为将来使用，
 * @returns {*} 返回的是 context 的当前值
 */
export function useContext<T>(
  Context: ReactContext<T>,
  unstable_observedBits: number | boolean | void,
) {
  const dispatcher = resolveDispatcher();
  if (__DEV__) {
    if (unstable_observedBits !== undefined) {
      console.error(
        'useContext() second argument is reserved for future ' +
          'use in React. Passing it is not supported. ' +
          'You passed: %s.%s',
        unstable_observedBits,
        typeof unstable_observedBits === 'number' && Array.isArray(arguments[2])
          ? '\n\nDid you call array.map(useContext)? ' +
            'Calling Hooks inside a loop is not supported. ' +
            'Learn more at https://fb.me/rules-of-hooks'
          : '',
      );
    }

    // TODO: add a more generic warning for invalid values.
    if ((Context: any)._context !== undefined) {
      const realContext = (Context: any)._context;
      // Don't deduplicate because this legitimately causes bugs
      // and nobody should be using this in existing code.
      if (realContext.Consumer === Context) {
        console.error(
          'Calling useContext(Context.Consumer) is not supported, may cause bugs, and will be ' +
            'removed in a future major release. Did you mean to call useContext(Context) instead?',
        );
      } else if (realContext.Provider === Context) {
        console.error(
          'Calling useContext(Context.Provider) is not supported. ' +
            'Did you mean to call useContext(Context) instead?',
        );
      }
    }
  }
  return dispatcher.useContext(Context, unstable_observedBits);
}

export function useState<S>(initialState: (() => S) | S) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}

export function useReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useReducer(reducer, initialArg, init);
}

export function useRef<T>(initialValue: T): {current: T} {
  const dispatcher = resolveDispatcher();
  return dispatcher.useRef(initialValue);
}

export function useEffect(
  create: () => (() => void) | void,
  inputs: Array<mixed> | void | null,
) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useEffect(create, inputs);
}

export function useLayoutEffect(
  create: () => (() => void) | void,
  inputs: Array<mixed> | void | null,
) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useLayoutEffect(create, inputs);
}

export function useCallback(
  callback: () => mixed,
  inputs: Array<mixed> | void | null,
) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useCallback(callback, inputs);
}

export function useMemo(
  create: () => mixed,
  inputs: Array<mixed> | void | null,
) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useMemo(create, inputs);
}

export function useImperativeHandle<T>(
  ref: {current: T | null} | ((inst: T | null) => mixed) | null | void,
  create: () => T,
  inputs: Array<mixed> | void | null,
): void {
  const dispatcher = resolveDispatcher();
  return dispatcher.useImperativeHandle(ref, create, inputs);
}

export function useDebugValue(value: any, formatterFn: ?(value: any) => any) {
  if (__DEV__) {
    const dispatcher = resolveDispatcher();
    return dispatcher.useDebugValue(value, formatterFn);
  }
}

export const emptyObject = {};

export function useResponder(
  responder: ReactEventResponder<any, any>,
  listenerProps: ?Object,
): ?ReactEventResponderListener<any, any> {
  const dispatcher = resolveDispatcher();
  if (__DEV__) {
    if (responder == null || responder.$$typeof !== REACT_RESPONDER_TYPE) {
      console.error(
        'useResponder: invalid first argument. Expected an event responder, but instead got %s',
        responder,
      );
      return;
    }
  }
  return dispatcher.useResponder(responder, listenerProps || emptyObject);
}

export function useTransition(
  config: ?Object,
): [(() => void) => void, boolean] {
  const dispatcher = resolveDispatcher();
  return dispatcher.useTransition(config);
}

export function useDeferredValue<T>(value: T, config: ?Object): T {
  const dispatcher = resolveDispatcher();
  return dispatcher.useDeferredValue(value, config);
}
