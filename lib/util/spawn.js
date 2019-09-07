const { spawn } = require('child_process')
module.exports = (cmd, args, options, ermsg) => new Promise((res, rej) => {
  console.error('SPAWN', cmd, args.join(' '), options)
  const proc = spawn(cmd, args, options)
  const stdout = []
  const stderr = []
  proc.on('error', er => rej(er))
  proc.stdout.on('data', c => stdout.push(c))
  proc.stderr.on('data', c => stderr.push(c))
  proc.stdout.on('error', er => rej(er))
  proc.stderr.on('error', er => rej(er))
  proc.on('close', (code, signal) => {
    if (code || signal)
      return rej(Object.assign(new Error(ermsg), {
        cmd,
        args,
        code,
        signal,
        stdout: Buffer.concat(stdout).toString('utf8'),
        stderr: Buffer.concat(stderr).toString('utf8'),
      }))
    res()
  })
})
