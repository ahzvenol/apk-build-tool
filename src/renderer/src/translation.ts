import { version } from '~build/package'
import { Languages, translations } from '../../shared/locales'
import { effect } from '@preact/signals'
import { deepSignal } from 'deepsignal'
import { Reactive, useReactiveWrapper } from 'micro-reactive-wrapper'

const useReactive: <T>(value: T) => Reactive<T> = useReactiveWrapper(deepSignal)
export const t = useReactive(translations['zh-CN'])
export const language = useReactive<Languages>('zh-CN')

effect(() => {
  t(translations[language()])
})

effect(() => {
  document.title = `${t.title()} ${version}`
})
