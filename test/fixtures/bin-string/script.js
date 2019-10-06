#!/usr/bin/env node
const fs = require('fs')
const assert = require('assert')
assert.equal(fs.statSync(__filename).mode & 0o111, 0o111)
console.log('ok')
