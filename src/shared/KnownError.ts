import { Languages, Translations } from './locales'

export class KnownError extends Error {
  constructor(public message: keyof Translations[Languages]) {
    super(message)
  }
}
