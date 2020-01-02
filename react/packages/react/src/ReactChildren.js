/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from 'shared/invariant';
import {
  getIteratorFn,
  REACT_ELEMENT_TYPE,
  REACT_PORTAL_TYPE,
} from 'shared/ReactSymbols';

import {isValidElement, cloneAndReplaceKey} from './ReactElement';
import ReactDebugCurrentFrame from './ReactDebugCurrentFrame';

// 分割字符
const SEPARATOR = '.';
// 子分割字符
const SUBSEPARATOR = ':';

/**
 * 使用 =0替换字符串中的=,使用=2替换字符串中的：。
 * 返回 "$替换后的字符串"
 */
function escape(key) {
  // [xyz]:匹配方括号中的任意字符
  const escapeRegex = /[=:]/g;
  const escaperLookup = {
    '=': '=0',
    ':': '=2',
  };
  const escapedString = ('' + key).replace(escapeRegex, function(match) {
    // 返回值作为替换字符串
    // 如果replace()的第一个参数是正则表达式，并且其为全局匹配模式，那么这个方法将被多次调用，每次匹配都会被调用。
    console.log("match",match)
    return escaperLookup[match];
  });

  return '$' + escapedString;
}

/**
 * 检查单个子元素和只有一个元素的数组具有相同的键值
 */

let didWarnAboutMaps = false;

/**
 * 将多个“/”转换成一个“/”
 */
const userProvidedKeyEscapeRegex = /\/+/g;
function escapeUserProvidedKey(text) {
  /**
   * str.replace(regexp|substr, newSubStr|function):返回一个部分或全部匹配由替代模式所取代的新的字符串
   * $&	插入匹配的子串
   */
  return ('' + text).replace(userProvidedKeyEscapeRegex, '$&/');
}
// 上下文池子的大小
const POOL_SIZE = 10;
// 存放上下文的池子
const traverseContextPool = [];
/**
 * 获取上下文池子中的上下文
 * @param {*} mapResult  map后的结果集
 * @param {*} keyPrefix  键前缀
 * @param {*} mapFunction map函数
 * @param {*} mapContext map上下文
 */
function getPooledTraverseContext(
  mapResult,
  keyPrefix,
  mapFunction,
  mapContext,
) {
  /**
   * 1、当池子里有上下文数据时，弹出最后一个上下文并根据传参修改值再返回
   */
  if (traverseContextPool.length) {
    const traverseContext = traverseContextPool.pop();
    traverseContext.result = mapResult;
    traverseContext.keyPrefix = keyPrefix;
    traverseContext.func = mapFunction;
    traverseContext.context = mapContext;
    traverseContext.count = 0;
    return traverseContext;
  } else {
    /**
     * 2、 当池子里没有数据时，返回根据传参新建的上下文
     */
    return {
      result: mapResult,
      keyPrefix: keyPrefix,
      func: mapFunction,
      context: mapContext,
      count: 0,
    };
  }
}
/**
 * 释放上下文
 * @param {*} traverseContext  被遍历到的上下文
 */
function releaseTraverseContext(traverseContext) {
  /**
   * 1、初始化传入的上下文
   */
  traverseContext.result = null;
  traverseContext.keyPrefix = null;
  traverseContext.func = null;
  traverseContext.context = null;
  traverseContext.count = 0;
  /**
   * 当上下文此池子不满POOL_SIZE长度时，将初始化的上下文加入池子中。
   */
  if (traverseContextPool.length < POOL_SIZE) {
    traverseContextPool.push(traverseContext);
  }
}

/**
 * @param {?*} children 子元素集合.
 * @param {!string} nameSoFar 键路径名称.
 * @param {!function} callback 每个子元素调用的回调函数.
 * @param {?*} traverseContext 遍历的时候提供信息的上下文
 * @return {!number} 子树的个数.
 */
function traverseAllChildrenImpl(
  children,
  nameSoFar,
  callback,
  traverseContext,
) {
  /**
   * 1、判断子元素容器的类型，如果为undefined和布尔值，则设置children为null
   */
  const type = typeof children;

  if (type === 'undefined' || type === 'boolean') {
    // All of the above are perceived as null.
    children = null;
  }
 /**
  * 2、 根据children的类型，判定是否调用回调函数
  */
  let invokeCallback = false;

  if (children === null) {
    // children为undefined、true、false、null时，调用回调
    invokeCallback = true;
  } else {
    // children为string、number类型时，或为REACT_ELEMENT_TYPE、REACT_PORTAL_TYPE时，调用回调
    switch (type) {
      case 'string':
      case 'number':
        invokeCallback = true;
        break;
      case 'object':
        switch (children.$$typeof) {
          case REACT_ELEMENT_TYPE:
          case REACT_PORTAL_TYPE:
            invokeCallback = true;
        }
    }
  }

  if (invokeCallback) {
    callback(
      traverseContext,
      children,
      // 如果只有一个子元素，则用数组包裹起来，以便子元素增长的时候能保存一致。
      nameSoFar === '' ? SEPARATOR + getComponentKey(children, 0) : nameSoFar,
    );
    return 1;
  }

  let child;
  let nextName;
  let subtreeCount = 0; // 当前子树中的子元素个数
  const nextNamePrefix =
    nameSoFar === '' ? SEPARATOR : nameSoFar + SUBSEPARATOR;
/**
 * 3、children为数组，则递归遍历子节点
 */
  if (Array.isArray(children)) {
    for (let i = 0; i < children.length; i++) {
      child = children[i];
      nextName = nextNamePrefix + getComponentKey(child, i);
      subtreeCount += traverseAllChildrenImpl(
        child,
        nextName,
        callback,
        traverseContext,
      );
    }
  } else {
    const iteratorFn = getIteratorFn(children);
    if (typeof iteratorFn === 'function') {
      if (__DEV__) {
        //当在子节点使用Map的时候警告
        if (iteratorFn === children.entries) {
          if (!didWarnAboutMaps) {
            // 不支持在子级使用Map，因为可能出现不可预知的结果。
          // 请用 序列/迭代 React元素。
            console.error(
              'Using Maps as children is unsupported and will likely yield ' +
                'unexpected results. Convert it to a sequence/iterable of keyed ' +
                'ReactElements instead.',
            );
          }
          didWarnAboutMaps = true;
        }
      }

      const iterator = iteratorFn.call(children);
      let step;
      let ii = 0;
      while (!(step = iterator.next()).done) {
        child = step.value;
        nextName = nextNamePrefix + getComponentKey(child, ii++);
        subtreeCount += traverseAllChildrenImpl(
          child,
          nextName,
          callback,
          traverseContext,
        );
      }
    } else if (type === 'object') {
      let addendum = '';
      if (__DEV__) {
        addendum =
          ' If you meant to render a collection of children, use an array ' +
          'instead.' +
          ReactDebugCurrentFrame.getStackAddendum();
      }
      const childrenString = '' + children;
      invariant(
        false,
        'Objects are not valid as a React child (found: %s).%s',
        childrenString === '[object Object]'
          ? 'object with keys {' + Object.keys(children).join(', ') + '}'
          : childrenString,
        addendum,
      );
    }
  }

  return subtreeCount;
}

/**
 *遍历通常指定`props.children`的子级，或是通过属性得到：
 *
 * - `traverseAllChildren(this.props.children, ...)`
 * - `traverseAllChildren(this.props.leftPanelChildren, ...)`
 *
 * @param {?*} children 子元素容器.
 * @param {!function} callback 回调函数
 * @param {?*} traverseContext 遍历的上下文环境
 * @return {!number} 子树的个数.
 */
function traverseAllChildren(children, callback, traverseContext) {
  if (children == null) {
    return 0;
  }

  return traverseAllChildrenImpl(children, '', callback, traverseContext);
}

/**
 * Generate a key string that identifies a component within a set.
 * 获取/生成组件中的key
 * @param {*} component 可能包含用户自定义键的组件.
 * @param {number} index 如果没有用户自定义的键，则需要传入组件所在位置的索引
 * @return {string}
 */
function getComponentKey(component, index) {
  // 为了兼容未来潜在的新ES API，这里做一些校验
  if (
    typeof component === 'object' &&
    component !== null &&
    component.key != null
  ) {
    // 转义组件键
    return escape(component.key);
  }
  // 用户没有自定义组件的键值，则根据组件在Set中的索引隐式地生成36进制的键值
  return index.toString(36);
}
/**
 * 调用bookKeeping中的func
 */
function forEachSingleChild(bookKeeping, child, name) {
  const {func, context} = bookKeeping;
  func.call(context, child, bookKeeping.count++);
}

/**
 * 遍历props.children的子级.

 * @param {?*} children 子元素容器
 * @param {function(*, int)} 每个子元素指定的function
 * @param {*} forEachContext 遍历时提供的上下文.
 */
function forEachChildren(children, forEachFunc, forEachContext) {
  if (children == null) {
    return children;
  }
  const traverseContext = getPooledTraverseContext(
    null,
    null,
    forEachFunc,
    forEachContext,
  );
  traverseAllChildren(children, forEachSingleChild, traverseContext);
  releaseTraverseContext(traverseContext);
}

function mapSingleChildIntoContext(bookKeeping, child, childKey) {
  const {result, keyPrefix, func, context} = bookKeeping;

  let mappedChild = func.call(context, child, bookKeeping.count++);
  if (Array.isArray(mappedChild)) {
    mapIntoWithKeyPrefixInternal(mappedChild, result, childKey, c => c);
  } else if (mappedChild != null) {
    if (isValidElement(mappedChild)) {
      mappedChild = cloneAndReplaceKey(
        mappedChild,
        // Keep both the (mapped) and old keys if they differ, just as
        // traverseAllChildren used to do for objects as children
        keyPrefix +
          (mappedChild.key && (!child || child.key !== mappedChild.key)
            ? escapeUserProvidedKey(mappedChild.key) + '/'
            : '') +
          childKey,
      );
    }
    result.push(mappedChild);
  }
}

function mapIntoWithKeyPrefixInternal(children, array, prefix, func, context) {
  let escapedPrefix = '';
  if (prefix != null) {
    escapedPrefix = escapeUserProvidedKey(prefix) + '/';
  }
  const traverseContext = getPooledTraverseContext(
    array,
    escapedPrefix,
    func,
    context,
  );
  traverseAllChildren(children, mapSingleChildIntoContext, traverseContext);
  releaseTraverseContext(traverseContext);
}

/**
 * 遍历props.children的子级。
 * 在 children 里的每个直接子节点上调用一个函数(func)
 */
function mapChildren(children, func, context) {
  //1、 如果子节点为 null 或是 undefined，则此方法将返回 null 或是 undefined
  if (children == null) {
    return children;
  }
  // 2、如果children是一个数组
  const result = [];
  mapIntoWithKeyPrefixInternal(children, result, null, func, context);
  return result;
}

/**
 * 返回 children 中的组件总数量，等同于通过 map 或 forEach 调用回调函数的次数
 *
 * @param {?*} children Children tree container.
 * @return {number} The number of children.
 */
function countChildren(children) {
  return traverseAllChildren(children, () => null, null);
}

/**
 *将 children 这个复杂的数据结构以数组的方式扁平展开并返回，并为每个子节点分配
 */
function toArray(children) {
  const result = [];
  mapIntoWithKeyPrefixInternal(children, result, null, child => child);
  return result;
}

/**

 *
 * 验证 children 是否只有一个子节点（一个 React 元素），如果有则返回它，否则此方法会抛出错误。
 * @param {?object} children Child collection structure.
 * @return {ReactElement} The first and only `ReactElement` contained in the
 * structure.
 */
function onlyChild(children) {
  invariant(
    isValidElement(children),
    'React.Children.only expected to receive a single React element child.',
  );
  return children;
}

export {
  forEachChildren as forEach,
  mapChildren as map,
  countChildren as count,
  onlyChild as only,
  toArray,
};
