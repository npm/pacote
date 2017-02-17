'use strict'

var test = require('tap').test

require('./util/test-dir')(__filename)

var finalizeManifest = require('../lib/finalize-manifest')

test('returns a manifest with the right fields')
test('defaults all field to expected types + values')
test('manifest returned is immutable + inextensible')
test('fills in shrinkwrap if missing')
test('fills in shasum if missing')
test('fills in `bin` if `directories.bin` present')
