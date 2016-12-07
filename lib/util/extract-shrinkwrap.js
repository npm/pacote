var pipe = require('mississippi').pipe
var tar = require('tar-stream')

module.exports = extractShrinkwrap
function extractShrinkwrap (stream, cb) {
  var sr = null
  var extract = tar.extract(stream)
  extract.on('entry', function onEntry (header, stream, next) {
    if (header.name === 'package/npm-shrinkwrap.json') {
      // got a shrinkwrap!
      extract.removeListener('entry', onEntry)
      var data = ''
      stream.on('data', function (d) { data += d })
      stream.on('error', cb)
      stream.on('end', function () {
        try {
          sr = JSON.parse(data)
        } catch (e) {
          cb(e)
        }
      })
    } else {
      next()
    }
  })
  pipe(stream, extract, function (err) {
    cb(err, sr)
  })
}
