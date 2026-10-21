const t = require('tap')
const { readFileSync } = require('node:fs')
const { resolve } = require('node:path')
const { getPublishTag } = require('@npmcli/template-oss/lib/release/util.js')
const template = require('@npmcli/template-oss/package.json')
const pkg = require('../package.json')

const major = Number(pkg.version.split('.')[0])
const workflow = name =>
  readFileSync(resolve(__dirname, '../.github/workflows', `${name}.yml`), 'utf8')

t.test('maintenance releases use the matching major tag', t => {
  const options = {
    backport: pkg.templateOSS.backport,
    defaultTag: 'latest',
  }

  t.equal(template.version, pkg.devDependencies['@npmcli/template-oss'])
  t.equal(pkg.templateOSS.backport, major)
  t.equal(pkg.templateOSS.publish, 'true')
  t.equal(getPublishTag(pkg.version, options), `latest-${major}`)
  t.equal(getPublishTag(`${major}.0.3-pre.0`, options), `prerelease-${major}`)
  t.equal(getPublishTag(`${major + 1}.0.0`, {
    backport: null,
    defaultTag: 'latest',
  }), 'latest')
  t.end()
})

t.test('release jobs receive the maintenance configuration', t => {
  const release = workflow('release')

  for (const command of ['template-oss-release-please', 'template-oss-release-manager']) {
    const run = release.split('\n').find(line =>
      line.trim().startsWith('run:') && line.includes(`${command} `))

    t.match(run, `--backport="${major}"`)
    t.match(run, '--defaultTag="latest"')
  }

  t.match(workflow('ci-release'), `default: release/v${major}`)
  t.end()
})

t.test('publishing uses the computed release tag', t => {
  const integration = workflow('release-integration')

  t.match(integration, 'jq -r .publishTag')
  t.match(integration, 'npm publish --provenance --tag="$PUBLISH_TAG"')
  t.end()
})
