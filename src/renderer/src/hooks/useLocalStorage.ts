import { useState, Dispatch, SetStateAction } from 'react'

/**
 * A custom React Hook that acts as a drop-in replacement for `useState`,
 * but with the added benefit of automatic persistence to localStorage.
 *
 * @param key The key to use in localStorage.
 * @param initialValue The default value to use if nothing is found in localStorage.
 * @returns A stateful value, and a function to update it.
 */
function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  // 1. [核心变化] Hook 内部自己调用 useState
  //    它的初始值是通过一个函数来延迟计算的 (lazy initial state)
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // 2. 尝试从 localStorage 中加载初始值
      const item = window.localStorage.getItem(key)
      // 如果找到了，就解析它；否则，返回传入的 initialValue
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      // 如果解析出错，也返回 initialValue
      console.error(`Error reading localStorage key “${key}”:`, error)
      return initialValue
    }
  })

  // 3. [核心变化] 创建一个包装过的 setter 函数
  //    这个函数会在更新 state 的同时，也更新 localStorage
  const setValue: Dispatch<SetStateAction<T>> = (value) => {
    try {
      // 允许 value 是一个函数，就像常规的 setState 一样
      const valueToStore = value instanceof Function ? value(storedValue) : value
      // 更新 React state
      setStoredValue(valueToStore)
      // 更新 localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error)
    }
  }

  // 4. [简化] 之前的两个 useEffect 现在被合并到了 useState 的初始化
  //    和包装过的 setValue 函数中，不再需要了。

  // 5. 返回与 useState 签名兼容的元组
  return [storedValue, setValue]
}

export default useLocalStorage
