/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {REACT_FORWARD_REF_TYPE, REACT_MEMO_TYPE} from 'shared/ReactSymbols';


/**
 * 功能：创建一个React组件，这个组件能够将其接受的 ref 属性转发到其组件树下的另一个组件中
 * @param {*} render  渲染函数 ，该渲染函数使用 props 和 ref 作为参数
 * 作用：
 * 1、转发 refs 到 DOM 组件
 * 2、在高阶组件中转发 refs
 */

export default function forwardRef<Props, ElementType: React$ElementType>(
  render: (props: Props, ref: React$Ref<ElementType>) => React$Node,
) {
  if (__DEV__) {
    if (render != null && render.$$typeof === REACT_MEMO_TYPE) {
      console.error(
        'forwardRef requires a render function but received a `memo` ' +
          'component. Instead of forwardRef(memo(...)), use ' +
          'memo(forwardRef(...)).',
      );
    } else if (typeof render !== 'function') {
      console.error(
        'forwardRef requires a render function but was given %s.',
        render === null ? 'null' : typeof render,
      );
    } else {
      if (render.length !== 0 && render.length !== 2) {
        console.error(
          'forwardRef render functions accept exactly two parameters: props and ref. %s',
          render.length === 1
            ? 'Did you forget to use the ref parameter?'
            : 'Any additional parameter will be undefined.',
        );
      }
    }

    if (render != null) {
      if (render.defaultProps != null || render.propTypes != null) {
        console.error(
          'forwardRef render functions do not support propTypes or defaultProps. ' +
            'Did you accidentally pass a React component?',
        );
      }
    }
  }
  // 返回type类型和render函数构成的对象
  return {
     //被forwardRef包裹后，组件内部的$$typeof是REACT_FORWARD_REF_TYPE
    $$typeof: REACT_FORWARD_REF_TYPE,
    //render即包装的FunctionComponent
    render,
  };
}
