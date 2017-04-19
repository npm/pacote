'use strict'

const cacache = require('cacache')
const cacheKey = require('./cache-key')

module.exports = cacache
module.exports.key = cacheKey
