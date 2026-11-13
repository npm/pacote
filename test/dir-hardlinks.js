const t = require('tap')
const fs = require('node:fs/promises')
const { join } = require('node:path')
const tar = require('tar')
const Arborist = require('@npmcli/arborist')
const pacote = require('../lib/index.js')

for (const hardlinks of [true, false]) {
  t.test(hardlinks ? 'pack hardlinked files' : 'pack independent files', async t => {
    const content = 'module.exports = "present at both paths"\n'
    const root = t.testdir({
      source: {
        'package.json': JSON.stringify({ name: 'hardlink-fixture', version: '1.0.0' }),
        'index.js': content,
        dist: {},
      },
    })
    const source = join(root, 'source')
    const original = join(source, 'index.js')
    const duplicate = join(source, 'dist/index.js')
    if (hardlinks) {
      await fs.link(original, duplicate)
    } else {
      await fs.copyFile(original, duplicate)
    }
    const before = await fs.stat(original)
    const other = await fs.stat(duplicate)
    t.equal(before.ino === other.ino, hardlinks, 'fixture uses the intended inode relationship')

    const archive = join(root, 'package.tgz')
    const options = { cache: join(root, 'cache'), Arborist }
    await fs.writeFile(archive, await pacote.tarball(source, options))
    const entries = []
    await tar.t({
      file: archive,
      onReadEntry: entry => entries.push({ path: entry.path, type: entry.type }),
    })
    t.same(entries.filter(e => e.path.endsWith('index.js')), [
      { path: 'package/dist/index.js', type: 'File' },
      { path: 'package/index.js', type: 'File' },
    ], 'both paths are regular archive entries')

    const destination = join(root, 'extracted')
    await pacote.extract(archive, destination, options)
    for (const file of ['index.js', 'dist/index.js']) {
      t.equal(await fs.readFile(join(destination, file), 'utf8'), content, `${file} is extracted`)
    }
    const after = await fs.stat(original)
    t.equal(after.ino, before.ino, 'source inode is unchanged')
    t.equal(after.nlink, before.nlink, 'source hardlink count is unchanged')
    t.equal(after.mode, before.mode, 'source mode is unchanged')
  })
}
