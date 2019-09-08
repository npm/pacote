
const main = () => {
  const t = require('tap')
  const spawn = require('../../lib/util/spawn.js')

  const cases = {
    ok: [0, null, 'stdout\n', 'stderr\n'],
    fail: [1, null, '', 'not ok\n'],
    signal: [null, 'SIGTERM', '', ''],
  }
  const args = Object.keys(cases)

  t.test('piped output', t => {
    t.plan(args.length)
    args.forEach(arg => t.test(arg, t => {
      const c = cases[arg]
      const code = c[0]
      const signal = c[1]
      const ok = code === 0 && signal === null
      const cmd = process.execPath
      const args = [__filename, arg]
      const stdout = c[2]
      const stderr = c[3]
      return ok
        ? t.resolveMatch(spawn(cmd, args), {cmd, args, stdout, stderr})
        : t.rejects(spawn(cmd, args), {
          message: `failed '${cmd} ${args.join(' ')}'`,
          cmd, args, stdout, stderr, code, signal,
        })
    }))
  })

  t.test('no output', t => {
    t.plan(args.length)
    args.forEach(arg => t.test(arg, t => {
      const c = cases[arg]
      const code = c[0]
      const signal = c[1]
      const ok = code === 0 && signal === null
      const cmd = process.execPath
      const args = [__filename, arg]
      const stdout = ''
      const stderr = ''
      const message = 'message'
      return ok
        ? t.resolveMatch(spawn(cmd, args, { stdio: 'ignore' }),
          { cmd, args, stdout, stderr })
        : t.rejects(spawn(cmd, args, { stdio: 'ignore' }, message),
          { message, cmd, args, stdout, stderr, code, signal })
    }))
  })

  t.test('errors', t => {
    t.rejects(spawn(__filename), {
      message: `spawn ${__filename} EACCES`,
      errno: 'EACCES',
      code: 'EACCES',
      syscall: `spawn ${__filename}`,
      path: __filename,
      stdout: '',
      stderr: '',
    })
    return t.test('stdio errors', t => {
      const proto = require('stream').Readable.prototype
      const emit = proto.emit
      proto.emit = function (ev, ...args) {
        if (ev === 'data')
          return this.emit('error', new Error(args[0].toString()))
        else
          return emit.call(this, ev, ...args)
      }
      t.teardown(() => proto.emit = emit)

      t.rejects(spawn(process.execPath, [__filename, 'stdout']), {
        message: 'stdout'
      })

      return t.rejects(spawn(process.execPath, [__filename, 'stderr']), {
        message: 'stderr'
      })
    })
  })

  t.end()
}

// write some node programs that can be spawned and do stuff
switch (process.argv[2]) {
  case undefined:
    main()
    break

  case 'ok':
    console.log('stdout')
    console.error('stderr')
    process.exit(0)
  case 'stdout':
    console.log('stdout')
    process.exit(0)
  case 'stderr':
    console.error('stderr')
    process.exit(0)
  case 'fail':
    console.error('not ok')
    process.exit(1)
  case 'signal':
    process.kill(process.pid, 'SIGTERM')
    setTimeout(() => {}, 1000)
    break
}

// write some node programs that can be spawned and do stuff
switch (process.argv[2]) {
  case undefined:
    main()
    break

  case 'echo':
    console.log('ok')
    process.exit(0)
  case 'fail':
    console.error('not ok')
    process.exit(1)
  case 'signal':
    process.kill(process.pid, 'SIGTERM')
    setTimeout(() => {}, 1000)
    break
}
