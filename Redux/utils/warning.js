/**
 * 在控制台打印错误信息
 * console.error() 只是向控制台输出一条红色错误信息，并不会导致程序流的任何改变
 * throw 抛出异常并中断程序，如果再try中引发的throw,则将程序流引向catch
 */
export default function warning(message) {
  /**
   * 1、如果console存在，console.error()打印出错误信息
   */
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error(message)
  }
  /**
   * 2、控制程序流，通过throw抛出错误
   * js中使用try/catch捕捉异常，throw 创建自定义错误并抛出错误
   */
  try {
    throw new Error(message)
  } catch (e) {} 
}
