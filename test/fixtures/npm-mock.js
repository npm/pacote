#!/usr/bin/env node
const { argv, env } = process

const pnp = env._PACOTE_NO_PREPARE_ || ''
const pacotePath = env._PACOTE_TEST_PATH_
const pacoteOpts = env._PACOTE_TEST_OPTS_

const data = {
  argv,
  noPrepare: pnp ? pnp.split('\\n') : [],
  cwd: process.cwd(),
}

if (data.noPrepare.length > 5) {
  throw new Error('infinite regress detected!')
}

// just an incredibly rudimentary package manager
const pkg = require(process.cwd() + '/package.json')
const pacote = require(pacotePath)
for (const [name, spec] of Object.entries(pkg.dependencies)) {
  pacote.extract(spec, process.cwd() + '/' + name, {
    npmBin: __filename,
    ...JSON.parse(pacoteOpts),
    Arborist: require('@npmcli/arborist'),
  })
}

require('fs').writeFileSync('log', JSON.stringify(data, 0, 2))
