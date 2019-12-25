import ActionTypes from './utils/actionTypes'
import warning from './utils/warning'
import isPlainObject from './utils/isPlainObject'

//功能： 如果返回的state为undefined，则抛出错误
function getUndefinedStateErrorMessage(key, action) {
  const actionType = action && action.type
  const actionDescription =
    (actionType && `action "${String(actionType)}"`) || 'an action'

  return (
    `Given ${actionDescription}, reducer "${key}" returned undefined. ` +
    `To ignore an action, you must explicitly return the previous state. ` +
    `If you want this reducer to hold no value, you can return null instead of undefined.`
  )
}
// 功能：判断是否有reducers处理之外的的state类型
function getUnexpectedStateShapeWarningMessage(
  inputState,
  reducers,
  action,
  unexpectedKeyCache
) {
  //获取所有reducers的key值
  const reducerKeys = Object.keys(reducers)

  const argumentName =
    action && action.type === ActionTypes.INIT
      ? 'preloadedState argument passed to createStore' //传递给createStore的preloadedState参数
      : 'previous state received by the reducer' ////reducer接收的先前状态

  //1、判断reducer，如果没有有效的reducer报错
  // 确保传递给comineReducers的参数是一个值为Reducers的对象
  if (reducerKeys.length === 0) {
    return (
      'Store does not have a valid reducer. Make sure the argument passed ' +
      'to combineReducers is an object whose values are reducers.'
    )
  }
  //2、判断state的类型， state必须为纯对象
  if (!isPlainObject(inputState)) {
    return (
      `The ${argumentName} has unexpected type of "` +
      {}.toString.call(inputState).match(/\s([a-z|A-Z]+)/)[1] +
      `". Expected argument to be an object with the following ` +
      `keys: "${reducerKeys.join('", "')}"`
    )
  }
  //3、 获取state上未被reducer处理的状态的键值
  const unexpectedKeys = Object.keys(inputState).filter(
    key => !reducers.hasOwnProperty(key) && !unexpectedKeyCache[key]
  )

  unexpectedKeys.forEach(key => {
    unexpectedKeyCache[key] = true
  })
/**
 *4、 检测是否为内置的replace action，因为当使用store的replaceReducer时会自动触发该内置action，
 * 并将reducer替换成传入的，此时检测的reducer和原状态树必然会存在冲突，
 * 所以在这种情况下检测到的unexpectedKeys并不具备参考价值，将不会针对性的返回抛错信息，反之则会返回。
 */
  if (action && action.type === ActionTypes.REPLACE) return

  if (unexpectedKeys.length > 0) {
    return (
      `Unexpected ${unexpectedKeys.length > 1 ? 'keys' : 'key'} ` +
      `"${unexpectedKeys.join('", "')}" found in ${argumentName}. ` +
      `Expected to find one of the known reducer keys instead: ` +
      `"${reducerKeys.join('", "')}". Unexpected keys will be ignored.`
    )
  }
}

// 功能: 执行所有reducer，判断用户的reducer结构是否正确
// 遍历执行所有的reducer，进行返回类型的判断
function assertReducerShape(reducers) {
  Object.keys(reducers).forEach(key => {
    const reducer = reducers[key]
    const initialState = reducer(undefined, { type: ActionTypes.INIT })
    
    //1、判断在初始化期间生成的state
    // 初始化state不能是undefined。如果不想为此reducer设置值，可以使用NULL而不是undefined。
    if (typeof initialState === 'undefined') {
      throw new Error(
        `Reducer "${key}" returned undefined during initialization. ` +
          `If the state passed to the reducer is undefined, you must ` +
          `explicitly return the initial state. The initial state may ` +
          `not be undefined. If you don't want to set a value for this reducer, ` +
          `you can use null instead of undefined.`
      )
    }

    //2、判断随机状态时生成的state 
    // 告诫用户必须返回任何未知操作的当前状态，除非未定义。
    // 在这种情况下，无论操作类型如何，都必须返回初始状态。初始状态不能未定义，但可以为空。
    if (
      typeof reducer(undefined, {
        type: ActionTypes.PROBE_UNKNOWN_ACTION()
      }) === 'undefined'
    ) {
      throw new Error(
        `Reducer "${key}" returned undefined when probed with a random type. ` +
          `Don't try to handle ${ActionTypes.INIT} or other actions in "redux/*" ` +
          `namespace. They are considered private. Instead, you must return the ` +
          `current state for any unknown actions, unless it is undefined, ` +
          `in which case you must return the initial state, regardless of the ` +
          `action type. The initial state may not be undefined, but can be null.`
      )
    }
  })
}

/**
  把定义的多个 reducer 函数组合为一个 reducer 函数
 */
export default function combineReducers(reducers) {
  /**
   * 1、处理参数reducers，用对象存储处理后的所有reducers
   */
  const reducerKeys = Object.keys(reducers)
  const finalReducers = {}
  
    //利用循环，筛选掉reducers中 不是function的reducer，生成finalReducers对象。
    //这个新对象，包含的是过滤 undefined 和 非函数 后的 reducer
    //并且可以在后续的修改中，不影响到原来的 reducers对象
  for (let i = 0; i < reducerKeys.length; i++) {
    const key = reducerKeys[i]
  
    if (process.env.NODE_ENV !== 'production') {
      if (typeof reducers[key] === 'undefined') {
        warning(`No reducer provided for key "${key}"`)
      }
    }
   
    if (typeof reducers[key] === 'function') {
      finalReducers[key] = reducers[key]
    }
  }
  const finalReducerKeys = Object.keys(finalReducers)


  // 确保我们不会发出同样的警告
  let unexpectedKeyCache
  if (process.env.NODE_ENV !== 'production') {
    unexpectedKeyCache = {}
  }
  //2、 执行所有的reducer，判断reducer的结构是否正确
  let shapeAssertionError
  try {
    assertReducerShape(finalReducers)
  } catch (e) {
    // 接收错误
    shapeAssertionError = e
  }

  //3、返回一个新的 reducer 函数
  return function combination(state = {}, action) {
    //1、 判断上文的类型判断是否通过
    if (shapeAssertionError) {
      throw shapeAssertionError
    }

    if (process.env.NODE_ENV !== 'production') {
      const warningMessage = getUnexpectedStateShapeWarningMessage(
        state,
        finalReducers,
        action,
        unexpectedKeyCache
      )
      if (warningMessage) {
        warning(warningMessage)
      }
    }
    //用于判断state是否改变
    let hasChanged = false
    const nextState = {}
    /**
     * 2、遍历所有reducer；
     * 每次dispatch的时候就会遍历执行所有的reducer
     */
    for (let i = 0; i < finalReducerKeys.length; i++) {
      const key = finalReducerKeys[i]
      const reducer = finalReducers[key]
      const previousStateForKey = state[key]
      // 执行reducer,生成新的state
      const nextStateForKey = reducer(previousStateForKey, action)
      // （1）如果经过reducer处理之后生成的state为undefined，则报错
      if (typeof nextStateForKey === 'undefined') {
        const errorMessage = getUndefinedStateErrorMessage(key, action)
        throw new Error(errorMessage)
      }
      // （2）将新的state存入nextState
      nextState[key] = nextStateForKey
      // （3）标识state是否发生变化。 如果reducer前后，state未发生改变，则hasChanged仍未false，如果改变了，则将hasChanged设置为true
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey
    }
    // 循环执行完所有的reducer之后，再次判断 state是否发生改变
    hasChanged =
      hasChanged || finalReducerKeys.length !== Object.keys(state).length
    
      //3、 state改变了则返回改变之后的state，否则返回之前的state
    return hasChanged ? nextState : state
  }
}
