export const isValidPackageName = (packageName: string): boolean => {
  const regex = /^(?=[a-z0-9])(?=.*\.)[a-z0-9_.]*[a-z0-9]$/
  return regex.test(packageName)
}
