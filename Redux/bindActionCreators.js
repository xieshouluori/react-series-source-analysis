/**
 * 三层函数
 * 第一层，传入actionCreator, dispatch。
 * 第二层：返回一个匿名函数
 * 第三层：返回用dispatch方法包裹actionCreator
 */
function bindActionCreator(actionCreator, dispatch) {
  return function() {
    // 用dispatch方法包裹actionCreator
    return dispatch(actionCreator.apply(this, arguments))
  }
}

export default function bindActionCreators(actionCreators, dispatch) {
  //1、传入一个 action creator,则直接调用bindActionCreator函数，返回一个匿名函数
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch)
  }
  // 如果actionCreators不是对象，报错
  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error(
      `bindActionCreators expected an object or a function, instead received ${
        actionCreators === null ? 'null' : typeof actionCreators
      }. ` +
        `Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`
    )
  }
//2、  遍历actionCreators，对每个actionCreator（action生成器）执行bindActionCreator函数，返回一个匿名函数，执行匿名函数则会调用该函数返回的dispatch方法。
  const boundActionCreators = {}
  for (const key in actionCreators) {
    const actionCreator = actionCreators[key]
    if (typeof actionCreator === 'function') {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch)
    }
  }
  // 返回处理过后的ctionCreators对象
  return boundActionCreators
}
