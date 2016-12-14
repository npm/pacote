var finished = require('mississippi').finished
var gunzip = require('gunzip-maybe')
var pipe = require('mississippi').pipe
var pipeline = require('mississippi').pipeline
var tar = require('tar-stream')

module.exports = extractShrinkwrap
function extractShrinkwrap (stream, opts, cb) {
  var sr = null
  var extract = tar.extract()
  var unzipped = pipeline(gunzip(), extract)
  extract.on('entry', function onEntry (header, stream, next) {
    if (header.name === 'package/npm-shrinkwrap.json') {
      opts.log.silly('extract-shrinkwrap', 'found shrinkwrap')
      // got a shrinkwrap!
      extract.removeListener('entry', onEntry)
      var data = ''
      stream.on('data', function (d) { data += d })
      finished(stream, function (err) {
        if (err) { return extract.emit('error', err) }
        try {
          sr = JSON.parse(data)
        } catch (e) {
          extract.emit('error', e)
        }
        unzipped.destroy()
        // TODO - this is *super suspicious*.
        cb(null, sr)
      })
    } else {
      stream.resume()
      next()
    }
  })
  pipe(stream, unzipped, function (err) {
    if (!sr) { cb(err) }
  })
}
