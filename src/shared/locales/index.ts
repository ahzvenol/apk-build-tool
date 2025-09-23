import { English } from './English'
import { ChineseSimplified } from './ChineseSimplified'

export type Translations = typeof translations

export type Languages = keyof Translations

export const translations = {
  'zh-CN': ChineseSimplified,
  en: English
}

// 在对应语言中的语言名称
export const descriptions = {
  'zh-CN': '简体中文',
  en: 'English'
} satisfies Record<Languages, string>
