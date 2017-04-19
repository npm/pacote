'use strict'

const PassThrough = require('stream')

module.exports = fromString
function fromString (str) {
  const stream = new PassThrough()
  setTimeout(function () {
    stream.write(str)
    stream.end()
  })
  return stream
}
