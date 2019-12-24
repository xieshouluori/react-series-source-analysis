/**
 * 判断参数是否为纯对象
 */
export default function isPlainObject(obj) {
  /**
   * 1、排除array和null类型
   * 使用typeof obj==='object' 可以得出obj为字面变量/null/array
   */
  if (typeof obj !== 'object' || obj === null) return false
  
  /**
   * 2、通过weile循环找到obj对象的顶层原型
   * Object.getPrototypeOf(obj) 返回obj对象的原型
   */
  let proto = obj
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto)
  }
  /**
   * 3、 判断obj的原型 是否等于obj的顶层原型
   */
  return Object.getPrototypeOf(obj) === proto
}
