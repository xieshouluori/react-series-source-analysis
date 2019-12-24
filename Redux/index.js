import createStore from './createStore'
import combineReducers from './combineReducers'
import bindActionCreators from './bindActionCreators'
import applyMiddleware from './applyMiddleware'
import compose from './compose'
import warning from './utils/warning'
import __DO_NOT_USE__ActionTypes from './utils/actionTypes'


/**
 * 功能1：对应用执行环境和Redux是否压缩进行了监测
 */

// 用于判断压缩与否的函数
function isCrushed() {}

// 如果当前环境不是生产环境，但是代码被压缩了，那么Redux便会警告开发者。这边Redux使用一个压缩检验函数，通过判断函数isCrushed的函数名是否为isCrushed判断Redux代码是否被压缩。
if (
  process.env.NODE_ENV !== 'production' &&
  typeof isCrushed.name === 'string' &&
  isCrushed.name !== 'isCrushed'
) {
  warning(
    'You are currently using minified code outside of NODE_ENV === "production". ' +
      'This means that you are running a slower development build of Redux. ' +
      'You can use loose-envify (https://github.com/zertosh/loose-envify) for browserify ' +
      'or setting mode to production in webpack (https://webpack.js.org/concepts/mode/) ' +
      'to ensure you have the correct code for your production build.'
  )
}
/**
 * 功能2 :导出Redux的核心API
 */
export {
  createStore,
  combineReducers,
  bindActionCreators,
  applyMiddleware,
  compose,
  __DO_NOT_USE__ActionTypes
}
