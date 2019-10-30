const bin = require.resolve('../lib/bin.js')
const {main, run, usage, parseArg, parse} = require('../lib/bin.js')
const {spawn} = require('child_process')
const t = require('tap')
const version = require('../package.json').version
t.cleanSnapshot = str =>
  str.split(version).join('{VERSION}')
  .split(process.env.HOME).join('{HOME}')

const pacote = require('../')
const called = []
pacote.resolve = (spec, conf) =>
  spec === 'fail' ? Promise.reject(new Error('fail'))
  : Promise.resolve({method: 'resolve', spec, conf})
pacote.manifest = (spec, conf) => Promise.resolve({method: 'manifest', spec, conf})
pacote.packument = (spec, conf) => Promise.resolve({method: 'packument', spec, conf})
pacote.tarball.file = (spec, file, conf) => Promise.resolve({method: 'tarball', spec, file, conf})
const Minipass = require('minipass')
pacote.tarball.stream = (spec, handler, conf) => handler(new Minipass().end('tarball data'))
pacote.extract = (spec, dest, conf) => Promise.resolve({method: 'extract', spec, dest, conf})

t.test('running bin runs main file', t => {
  const proc = spawn(process.execPath, [bin, '-h'])
  const out = []
  proc.stdout.on('data', c => out.push(c))
  proc.on('close', (code, signal) => {
    t.equal(code, 0)
    t.equal(signal, null)
    t.matchSnapshot(Buffer.concat(out).toString('utf8'), 'helpful output')
    t.end()
  })
})

t.test('parseArg', t => {
  t.same(parseArg('--foo-bar=baz=boo'), { key: 'fooBar', value: 'baz=boo' })
  t.same(parseArg('--foo'), { key: 'foo', value: true })
  t.same(parseArg('--path=~'), { key: 'path', value: process.env.HOME })
  t.same(parseArg('--no-foo'), { key: 'foo', value: false })
  t.end()
})

t.test('parse', t => {
  t.same(parse(['a', 'b', '--foo', '--no-json']), {
    _: ['a', 'b'],
    foo: true,
    json: false,
    cache: process.env.HOME + '/.npm/_cacache',
  })
  t.same(parse(['a', 'b', '--', '--json']), {
    _: ['a', 'b', '--json'],
    json: !process.stdout.isTTY,
    cache: process.env.HOME + '/.npm/_cacache',
  })
  t.match(parse(['-h']), { help: true })
  t.end()
})

t.test('run', t => {
  const conf = {some: 'configs'}
  t.resolveMatchSnapshot(run({...conf, _: ['resolve', 'spec']}))
  t.resolveMatchSnapshot(run({...conf, _: ['manifest', 'spec']}))
  t.resolveMatchSnapshot(run({...conf, _: ['packument', 'spec']}))
  t.resolveMatchSnapshot(run({...conf, _: ['tarball', 'spec', 'file']}))
  t.resolveMatchSnapshot(run({...conf, _: ['extract', 'spec', 'dest']}))
  t.throws(() => run({...conf, _: ['x']}), { message: 'bad command: x' })

  const testStdout = new Minipass({encoding: 'utf8'})
  const testOutput = []
  return t.resolveMatchSnapshot(run({
    ...conf,
    _: ['tarball'],
    testStdout,
  })).then(() => t.equal(testStdout.read(), 'tarball data'))
})

t.test('main', t => {
  const {log, error} = console
  const {exit} = process
  t.teardown(() => {
    console.log = log
    console.error = error
    process.exit = exit
  })

  const errorlog = []
  console.error = (...args) => errorlog.push(args)
  const loglog = []
  console.log = (...args) => loglog.push(args)

  const exitlog = []
  process.exit = code => exitlog.push(code)

  t.beforeEach(cb => {
    errorlog.length = 0
    loglog.length = 0
    exitlog.length = 0
    cb()
  })

  const test = (...args) =>
    t.test(args.join(' '), t => Promise.resolve(main(['--json', ...args]))
      .then(() => t.matchSnapshot({errorlog, loglog, exitlog})))

  test('--help')
  test('resolve', 'foo@bar')
  test('manifest', 'bar@foo')
  test('packument', 'paku@mint')
  test('tarball', 'tar@ball', 'file.tgz')
  test('extract', 'npm@latest-6', 'folder', '--no-json')
  test('extract', 'npm@latest-6', 'folder', '--json')
  test('blerg', 'glorb', 'glork')
  test('resolve', 'fail')
  t.end()
})
