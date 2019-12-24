/**
 * 生成随机字符串
 * Math.random() 生成一个[0,1)之间的浮点型伪随机数字
 * numObj.toString([radix]) 根据基数返回指定numObj的字符串表示形式。 radix取值范围[2,36],默认值为10
 * str.substring(indexStart[, indexEnd]) 返回从开始索引到结束索引（不包括）之间的字符，或从开始索引直到字符串的末尾（不指定indexEnd）的字符
 * str.split([separator[, limit]]) 用指定的分隔符将字符串分割成子字符串数组
 * arr.join([separator]) 将所有的数组元素转换成字符串，再用分隔符将这些字符串连接成一个字符串返回来，
 */

const randomString = () =>
  Math.random()
    .toString(36)
    .substring(7)
    .split('')
    .join('.')
/**
 * Redex保留的私有action type。
  * INIT 初始化Redux的时候使用
  * PEPLACE  替换reducer的时候使用。
  * PROBE_UNKNOWN_ACTION 未知操作。
 * 这三个action type都是随机字符串以防止与用户业务中定义的action type重复。
 * 不要在代码中直接使用这些保留action type。
 */

const ActionTypes = {
  INIT: `@@redux/INIT${randomString()}`,
  REPLACE: `@@redux/REPLACE${randomString()}`,
  PROBE_UNKNOWN_ACTION: () => `@@redux/PROBE_UNKNOWN_ACTION${randomString()}`
}

export default ActionTypes
