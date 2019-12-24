/**
 *  从右到左组合单参数函数，最右边的函数可以接受多个参数。
 *  @param 需要合成的多个函数
 *  @returns 从右到左把接收到的函数合成后的最终函数。
 * 
 */
export default function compose(...funcs) {
  // funcs 保存了所以参数函数的数组
  
  /**
   *  1、如果没有传递任何参数，就返回一个函数，这个函数是输入什么得到什么
   *  */
  if (funcs.length === 0) {
    return arg => arg
  }
  /**
   * 2、只传递一个参数的时候，就直接把这个函数返回
   */
  if (funcs.length === 1) {
    return funcs[0]
  }
  /**
   * 3、参数个数大于1时，// 返回从右向左组合后的函数 
   * reduce((a,b)=>()=>{})) 相当于 reduceRight()
   * 每次循环返回一个函数 (...args) => a(b(...args))。所以每当一次循环结束之后a=(...args) => a(b(...args))
   * 例如[f,g,h].reduce((a,b)=>(...args) => a(b(...args))) 
   * 第一次循环之后：a=(...args) =>f(g(...args))
   * 第二次循环之后：a=(...args) =>f(g(h(...args)))
   */
  return funcs.reduce((a, b) => (...args) => a(b(...args)))
}
