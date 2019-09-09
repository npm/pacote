const headSha = require('../../../lib/util/git/head-sha.js')
const t = require('tap')
const {resolve} = require('path')
const repo = resolve(__dirname, '../../..')

t.resolveMatch(headSha(repo), /^[0-9a-f]{40}$/)
