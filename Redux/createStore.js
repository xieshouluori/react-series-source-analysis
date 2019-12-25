import $$observable from 'symbol-observable'

import ActionTypes from './utils/actionTypes'
import isPlainObject from './utils/isPlainObject'
export default function createStore(reducer, preloadedState, enhancer) {
  // 1、参数检测处理
  /**
   * 1、传入参数个数>=3。提示不支持直接传入多个enhancer，需要用compose组合enhancer之后再传入
   */
  if (
    (typeof preloadedState === 'function' && typeof enhancer === 'function') ||
    (typeof enhancer === 'function' && typeof arguments[3] === 'function')
  ) {
    throw new Error(
      'It looks like you are passing several store enhancers to ' +
        'createStore(). This is not supported. Instead, compose them ' +
        'together to a single function.'
    )
  }
 
  /**
   * 2、传入两个参数。用来转换参数。如果createStore只接收le两个参数，且第二个参数为函数，enhancer的值取第二个参数
   */
  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState
    preloadedState = undefined
  }

  /**
   * 3、判断enhancer如果存在且不是一个函数，则抛出enhancer类型错误的提示，
   * 如果enhancer存在且为一个函数存在；则执行enhancer函数。并且return来终止以后的代码
   */
  if (typeof enhancer !== 'undefined') {
    if (typeof enhancer !== 'function') {
      throw new Error('Expected the enhancer to be a function.')
    }

    return enhancer(createStore)(reducer, preloadedState)
  }
  /**
   *4、 对reducer进行类型检测，如果不是函数则抛出错误
   */
  if (typeof reducer !== 'function') {
    throw new Error('Expected the reducer to be a function.')
  }
// 2、初始化变量
 
  // 当前reducer
  let currentReducer = reducer 
  //  当前state
  let currentState = preloadedState 
  //   初始化 listeners 用于放置监听函数，用于保存快照供当前 dispatch 使用
  let currentListeners = []  
  //  引用传值 指向当前 listeners，在需要修改时复制出来修改为下次快照存储数据，不影响当前订阅
  let nextListeners = currentListeners 
  // 用于标记是否正在进行 dispatch，用于控制 dispatch 依次调用不冲突
  let isDispatching = false


// 保存一份订阅快照，currentListeners的浅拷贝
// 浅拷贝的目的：
// 1、使用nextListeners作为调度时（subscribe）的临时列表，防止消费者在dispatch过程中 订阅/取消订阅 调用时出现任何错误
// 2、在一段时间内始终没有新的订阅或取消订阅的情况下，nextListeners 与 currentListeners 可以共用内存
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice()
    }
  }
  function getState() {
   /**
    * 1、 判断是否正在执行dispatch。
    * 如果正在进行dispatch，则抛出错误
    * 因为执行dispatch时，会调用Reducer生成新的state，这时候获取到的state不是最新的state。
    */
    if (isDispatching) {
      throw new Error(
        'You may not call store.getState() while the reducer is executing. ' +
          'The reducer has already received the state as an argument. ' +
          'Pass it down from the top reducer instead of reading it from the store.'
      )
    }
    // 2、返回当前state树
    return currentState
  }
  /**
   * 注册监听事件
   *返回移除监听事件的方法
   */
  function subscribe(listener) {
    //1、 参数处理：listener必须为函数
    if (typeof listener !== 'function') {
      throw new Error('Expected the listener to be a function.')
    }
    /**
     * 2、判断是否正在执行dispatch。
     * 因为执行reducer的过程中，无法获取到最新的state；
     */
    if (isDispatching) {
      throw new Error(
        'You may not call store.subscribe() while the reducer is executing. ' +
          'If you would like to be notified after the store has been updated, subscribe from a ' +
          'component and invoke store.getState() in the callback to access the latest state. ' +
          'See https://redux.js.org/api-reference/store#subscribelistener for more details.'
      )
    }
    //使用变量isSubscribed ：声明一个变量用来判断是否订阅，防止该订阅函数多次取消订阅
    let isSubscribed = true

    // 3、拷贝当前监听队列，生成临时监听队列。将监听函数添加到临时的监听队列——nextListeners
    // 在每次 dispatch() 调用之前都会保存一份快照。当你在正在调用监听器（listener）的时候订阅(subscribe)或者去掉订阅（unsubscribe），对当前的 dispatch() 不会有任何影响。但是对于下一次的 dispatch()，无论嵌套与否，都会使用订阅列表里最近的一次快照。此举为了不混淆当前的监听队列。
    ensureCanMutateNextListeners()
    nextListeners.push(listener)
    
    //4、 返回移除监听事件的方法
    return function unsubscribe() {
      // 防止多次移除监听事件
      if (!isSubscribed) {   
        return
      }
      // 判断是否正在执行dispatch
      if (isDispatching) {
        throw new Error(
          'You may not unsubscribe from a store listener while the reducer is executing. ' +
            'See https://redux.js.org/api-reference/store#subscribelistener for more details.'
        )
      }

      isSubscribed = false

      // 拷贝监听事件列表。在nextListeners上移除监听事件
      ensureCanMutateNextListeners()
      const index = nextListeners.indexOf(listener)
      nextListeners.splice(index, 1)
      currentListeners = null
    }
  }

  function dispatch(action) {
    // 1、参数判断；ation必须为纯函数
    if (!isPlainObject(action)) {
      throw new Error(
        'Actions must be plain objects. ' +
          'Use custom middleware for async actions.'
      )
    }
    // 2、参数判断：action的type不能为undefined
    if (typeof action.type === 'undefined') {
      throw new Error(
        'Actions may not have an undefined "type" property. ' +
          'Have you misspelled a constant?'
      )
    }
    // 3、判断是否正在dispatch，比如在subscribe中又执行了dispatch,如果没有这个判断，会进入死循环
    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.')
    }
    //4、执行reducer,生成新的state
    try {
      // reducer执行时isDispatching标记为true
      isDispatching = true
      // 执行reducer，参数state、 action, 生成新的State
      // 这就是dispatch一个action可以改变全局state的原因
      currentState = currentReducer(currentState, action)
    } finally {
      // reducer执行完， isDispatching标记为false， 即完成状态
      isDispatching = false
    }
    
    //5、 更新最新的监听对象,遍历当前的监听列表，逐个执行
    const listeners = (currentListeners = nextListeners)
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i]
      listener()
    }
    //6、返回当前action
    return action
  }
  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error('Expected the nextReducer to be a function.')
    }
    // 1、替换当前reducer
    currentReducer = nextReducer

    // 2、执行dispatch`@@redux/REPLACE${randomString()}`使用新reducer生成新的state,并遍历监听列表，反馈到页面上
    // 在 combineReducers 函数中有使用到这个type类型
    dispatch({ type: ActionTypes.REPLACE })
  }

  // 功能是订阅 store 的变化，适用于所有实现了 Observable 的类库（主要是适配 RxJS）。
  //该方法是为了适配 ECMA TC39 会议的一个有关 Observable 的提案（参考https://github.com/tc39/proposal-observable）所写的一个函数。
  // 引入这个功能的commit是：https://github.com/reduxjs/redux/pull/1632。
  function observable() {
    //1、 outerSubscribe 即为外部的 subscribe 函数。
    const outerSubscribe = subscribe
    //2、 返回一个包含 subscribe 方法的纯对象。
    return {
   
      subscribe(observer) {
        //1、参数为观察者，类型只能是对象
        if (typeof observer !== 'object' || observer === null) {
          throw new TypeError('Expected the observer to be an object.')
        }
       
        //2、要求观察者应有一个next方法
        function observeState() {
          if (observer.next) {
            observer.next(getState())
          }
        }
        //2、执行observeState方法，获取最新的state
        observeState()
        // 3、返回取消订阅的方法的对象 ，用于从store中取消被观察对象
        const unsubscribe = outerSubscribe(observeState)
        return { unsubscribe }
      },
      // $$observable 即为 Symbol.observable。返回Observable自身。
      [$$observable]() {
        return this
      }
    }
  }
  //4、生成初始state树
  // 快速的形成默认的state的结构
  dispatch({ type: ActionTypes.INIT })
 
  // 5、返回store
  return {
    dispatch,
    subscribe,
    getState,
    replaceReducer,
    [$$observable]: observable
  }
}
