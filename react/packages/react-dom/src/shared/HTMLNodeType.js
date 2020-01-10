/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 * 节点类型的值
 */

export const ELEMENT_NODE = 1; //元素节点
export const TEXT_NODE = 3;  //文字节点
//Comment注释节点
// var commentNode = document.createComment(data) 方法用来创建并返回一个注释节点.（data 是一个字符串,包含了注释的内容.）
export const COMMENT_NODE = 8;

export const DOCUMENT_NODE = 9;//Document节点
export const DOCUMENT_FRAGMENT_NODE = 11;

//DocumentFragment节点。文档片段接口，表示一个没有父级文件的最小文档对象。它被作为一个轻量版的 Document 使用，用于存储已排好版的或尚未打理好格式的 XML 片段。最大的区别是因为 DocumentFragment 不是真实 DOM 树的一部分，它的变化不会触发 DOM 树的重新渲染，且不会导致性能等问题。
// 一个常见的用途是使用document.createDocumentFragment方法创建一个空的文档片段，在其中组装一个DOM子树，然后使用Node诸如appendChild()或（或insertBefore()）之类的接口方法将该片段的所有子节点, 而非片段本身附加（append）或插入（inserted）到DOM中。这样做会将片段的节点移动到DOM中，留下空白DocumentFragment。因为所有的节点会被一次插入到文档中，而这个操作仅发生一个重渲染的操作，而不是每个节点分别被插入到文档中，因为后者会发生多次重渲染的操作。
// 可以使用document.createDocumentFragment 方法或者构造函数来创建一个空的 DocumentFragment。
// const fragment = document.createDocumentFragment();
// for(var i=0;i<100;i++)
// {
//        var op=document.createElement("P");
//        var oText=document.createTextNode(i);
//        op.appendChild(oText);
//        fragment.appendChild(op);
// }
// document.body.appendChild(fragment);
