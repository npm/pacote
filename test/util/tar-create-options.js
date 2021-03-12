const t = require('tap')
const tarCreateOptions = require('../../lib/util/tar-create-options.js')

const simpleOpts = tarCreateOptions({ _resolved: '/home/foo' })
t.match(
  simpleOpts,
  {
    cwd: '/home/foo',
    prefix: 'package/',
    portable: true,
    gzip: {
      strategy: 3
    },
    mtime: new Date('1985-10-26T08:15:00.000Z'),
  },
  'should return standard options'
)

t.ok(simpleOpts.filter('foo', {}), 'should not filter anything')

const optsWithBins = tarCreateOptions({
  bin: { a: 'index.js' },
  _resolved: '/foo'
})

const stat = { mode: 0o644 }
const filterRes = optsWithBins.filter('index.js', stat)
t.equal(stat.mode, 0o755, 'should return an executable stat')
t.equal(filterRes, true, 'should not filter out files')
