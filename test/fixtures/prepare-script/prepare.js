require('abbrev')
const fs = require('fs')
fs.writeFileSync(__dirname + '/index.js', `
// abbrev should not be here in production!
console.log('TAP version 13')
console.log('1..1')
try {
  require('./node_modules/abbrev')
  console.log('not ok 1 - dev dep present')
  process.exit(1)
} catch (er) {
  console.log('ok 1 - no dev dep')
}
`)
