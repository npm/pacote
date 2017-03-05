'use strict'

var cacache = require('cacache')
var cacheKey = require('./cache-key')

module.exports = cacache
module.exports.key = cacheKey
