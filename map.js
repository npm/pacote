const { basename } = require('path')
const map = base => base === 'index.js' ? base : `lib/${base}`
module.exports = test => map(basename(test))
