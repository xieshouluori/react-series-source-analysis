/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */

import type {RefObject} from 'shared/ReactTypes';

/**
 *  功能：创建一个能够通过 ref 属性附加到 React 元素的 ref。
 * 返回一个拥有current属性的的对象
 */

export function createRef(): RefObject {
  //1、 创建一个对象
  const refObject = {
    current: null,
  };
  // 2、在开发环境中，禁止该对象增加新属性
  if (__DEV__) {
    /**
     * Object.seal()方法封闭一个对象，阻止添加新属性并将所有现有属性标记为不可配置。
     * 属性不可配置的效果就是属性变的不可删除，以及一个数据属性不能被重新定义成为访问器属性，或者反之。但当前属性的值只要原来是可写的就可以改变。
    */
    Object.seal(refObject);
  }
  // 3、返回refObject对象
  return refObject;
}
