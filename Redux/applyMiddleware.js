import compose from './compose'


export default function applyMiddleware(...middlewares) {
  return createStore => (...args) => {
    //1、调用createStore方法生成store对象，
    //   {
    //   dispatch,
    //   subscribe,
    //   getState,
    //   replaceReducer,
    //   [$$observable]: observable
    //  }
    const store = createStore(...args)
    //2、 定义一个 dispatch方法，这个 dispatch 在 middlewarwe 构造完之前不能调用
    let dispatch = () => {
      throw new Error(
        'Dispatching while constructing your middleware is not allowed. ' +
          'Other middleware would not be applied to this dispatch.'
      )
    }
    //3、 生成包含getState方法和dispatch方法的middlewareAPI对象。即简化版的store对象。
    const middlewareAPI = {
      getState: store.getState,
      dispatch: (...args) => dispatch(...args)
    }
    //4、 遍历中间件，将简化版store传入中间件内部，是让内部的函数可以使用到 getState、dispatch
    const chain = middlewares.map(middleware => middleware(middlewareAPI))
    //5、 从右到左组合中间件，生成新的dispatch方法
    // 假设我们传入的数组chain是［f,g,h］，那么我们的dispatch相当于把原有dispatch方法进行f,g,h层层过滤，变成了新的dispatch。
    dispatch = compose(...chain)(store.dispatch)

    return {
      ...store,
      dispatch
    }
  }
}
