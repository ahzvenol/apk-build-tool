import { spawn } from 'child_process'

export const executeCommand = async (
  command: string,
  args: string[],
  description = ''
): Promise<void> => {
  console.log(
    '\x1b[93m%s\x1b[0m',
    `\n${command} ${args.join(' ')}\n`.replace(/((-(?:storepass|keypass))\s+|(pass:))\S+/g, '$1***')
  )

  return new Promise<void>((resolve, reject) => {
    const process = spawn(command, args)

    process.stdout.on('data', (data) => console.log(data.toString()))

    process.stderr.on('data', (data) => console.error(data.toString()))

    process.on('close', (code) => {
      if (code !== 0) {
        console.error(`Process exited with code ${code}`)
        reject(new Error(`Process exited with code ${code}`))
      } else {
        console.log(`${description || command} completed successfully`)
        resolve()
      }
    })
  })
}
