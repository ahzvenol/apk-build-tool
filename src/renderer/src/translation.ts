import { version } from '~build/package'
import { Languages, translations } from '../../shared/locales'
import { useReactive } from 'micro-reactive-solid'
import { createEffect } from 'solid-js'

export const t = useReactive(translations['zh-CN'])
export const language = useReactive<Languages>('zh-CN')

createEffect(() => {
  t(translations[language()])
})

createEffect(() => {
  document.title = `${t.title()} ${version}`
})