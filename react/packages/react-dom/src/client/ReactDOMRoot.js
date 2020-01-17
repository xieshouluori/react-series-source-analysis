/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {DOMContainer} from './ReactDOM';
import type {RootTag} from 'shared/ReactRootTags';
import type {ReactNodeList} from 'shared/ReactTypes';
// TODO: This type is shared between the reconciler and ReactDOM, but will
// eventually be lifted out to the renderer.
import type {FiberRoot} from 'react-reconciler/src/ReactFiberRoot';

export type RootType = {
  render(children: ReactNodeList, callback: ?() => mixed): void,
  unmount(callback: ?() => mixed): void,

  _internalRoot: FiberRoot,
};

export type RootOptions = {
  hydrate?: boolean,
  hydrationOptions?: {
    onHydrated?: (suspenseNode: Comment) => void,
    onDeleted?: (suspenseNode: Comment) => void,
  },
};

import {
  isContainerMarkedAsRoot,
  markContainerAsRoot,
  unmarkContainerAsRoot,
} from './ReactDOMComponentTree';
import {eagerlyTrapReplayableEvents} from '../events/ReactDOMEventReplaying';
import {
  ELEMENT_NODE,
  COMMENT_NODE,
  DOCUMENT_NODE,
  DOCUMENT_FRAGMENT_NODE,
} from '../shared/HTMLNodeType';

import {createContainer, updateContainer} from 'react-reconciler/inline.dom';
import invariant from 'shared/invariant';
import {BlockingRoot, ConcurrentRoot, LegacyRoot} from 'shared/ReactRootTags';

function ReactDOMRoot(container: DOMContainer, options: void | RootOptions) {
  this._internalRoot = createRootImpl(container, ConcurrentRoot, options);
}
/**
 * DOMBlockingRoot构造函数，包含一个实例属性_internalRoot
 * @param {*} container 
 * @param {*} tag 
 * @param {*} options 
 */
function ReactDOMBlockingRoot(
  container: DOMContainer,
  tag: RootTag,
  options: void | RootOptions,
) {
  // 调用createRootImpl创建初始化Root
  this._internalRoot = createRootImpl(container, tag, options);
}

/**
 * 渲染方法
 */
ReactDOMRoot.prototype.render = ReactDOMBlockingRoot.prototype.render = function(
  children: ReactNodeList,
  callback: ?() => mixed,
): void {
  /**
   * 1、FiberRootNode （Fiber根节点）
   */
  const root = this._internalRoot;
  const cb = callback === undefined ? null : callback;
  if (__DEV__) {
    warnOnInvalidCallback(cb, 'render');
  }
  updateContainer(children, root, null, cb);
};

ReactDOMRoot.prototype.unmount = ReactDOMBlockingRoot.prototype.unmount = function(
  callback: ?() => mixed,
): void {
  const root = this._internalRoot;
  const cb = callback === undefined ? null : callback;
  if (__DEV__) {
    warnOnInvalidCallback(cb, 'render');
  }
  const container = root.containerInfo;
  updateContainer(null, root, null, () => {
    unmarkContainerAsRoot(container);
    if (cb !== null) {
      cb();
    }
  });
};

/**
 * 创建Root
 * @param {*} container 
 * @param {*} tag 
 * @param {*} options 
 */
function createRootImpl(
  container: DOMContainer,
  tag: RootTag,
  options: void | RootOptions,
) {
  // Tag is either LegacyRoot or Concurrent Root
  const hydrate = options != null && options.hydrate === true;
  const hydrationCallbacks =
    (options != null && options.hydrationOptions) || null;
   /**
    * 1、创建根节点
    */
  const root = createContainer(container, tag, hydrate, hydrationCallbacks);
  /**
   * 2、在根节点上添加属性 '__reactContainere$' + randomKey ，执行当前节点
   */
  markContainerAsRoot(root.current, container);
  //服务端
  if (hydrate && tag !== LegacyRoot) {
    const doc =
      container.nodeType === DOCUMENT_NODE
        ? container
        : container.ownerDocument;
    eagerlyTrapReplayableEvents(doc);
  }
  //3、return root
  return root;
}

export function createRoot(
  container: DOMContainer,
  options?: RootOptions,
): RootType {
  invariant(
    isValidContainer(container),
    'createRoot(...): Target container is not a DOM element.',
  );
  warnIfReactDOMContainerInDEV(container);
  return new ReactDOMRoot(container, options);
}

export function createBlockingRoot(
  container: DOMContainer,
  options?: RootOptions,
): RootType {
  invariant(
    isValidContainer(container),
    'createRoot(...): Target container is not a DOM element.',
  );
  warnIfReactDOMContainerInDEV(container);
  return new ReactDOMBlockingRoot(container, BlockingRoot, options);
}

export function createLegacyRoot(
  container: DOMContainer,
  options?: RootOptions,
): RootType {
  // 返回创建的ReactDOMBlockingRoot的实例
  return new ReactDOMBlockingRoot(container, LegacyRoot, options);
}

// 判断容器是否是 元素节点/文档节点/文档片段节点/注释节点
export function isValidContainer(node: mixed): boolean {
  return !!(
    node &&
    (node.nodeType === ELEMENT_NODE ||
      node.nodeType === DOCUMENT_NODE ||
      node.nodeType === DOCUMENT_FRAGMENT_NODE ||
      (node.nodeType === COMMENT_NODE &&
        (node: any).nodeValue === ' react-mount-point-unstable '))
  );
}

export function warnOnInvalidCallback(
  callback: mixed,
  callerName: string,
): void {
  if (__DEV__) {
    if (callback !== null && typeof callback !== 'function') {
      console.error(
        '%s(...): Expected the last optional `callback` argument to be a ' +
          'function. Instead received: %s.',
        callerName,
        callback,
      );
    }
  }
}

function warnIfReactDOMContainerInDEV(container) {
  if (__DEV__) {
    if (isContainerMarkedAsRoot(container)) {
      if (container._reactRootContainer) {
        console.error(
          'You are calling ReactDOM.createRoot() on a container that was previously ' +
            'passed to ReactDOM.render(). This is not supported.',
        );
      } else {
        console.error(
          'You are calling ReactDOM.createRoot() on a container that ' +
            'has already been passed to createRoot() before. Instead, call ' +
            'root.render() on the existing root instead if you want to update it.',
        );
      }
    }
  }
}
