var finished = require('mississippi').finished
var gunzip = require('./gunzip-maybe')
var pipe = require('mississippi').pipe
var pipeline = require('mississippi').pipeline
var through = require('mississippi').through

// `tar-stream` is significantly faster than `node-tar`, but there's
// a risk that `tar-stream` can cause some incompatibilities.
//
// It's worth keeping an eye out for issues caused by this, and
// swap out the module for node-tar if they rear their head.
var tar = require('tar-stream')

// Picks out just the `npm-shrinkwrap.json` from a package
// tarball (coming through `pkgStream`), and stops parsing the
// tarball as soon as the file is found.
module.exports = extractShrinkwrap
function extractShrinkwrap (pkgStream, opts, cb) {
  var extract = tar.extract()

  // The extra `through` is to compensate for misbehaving `pkgStream`s.
  // For example, `request` streams are notoriously unreliable.
  // This is a bit of defensive programming, not a fix for
  // a specific known example of an issue.
  var unzipped = pipeline(through(), gunzip(), extract)

  var shrinkwrap = null // we'll pop the data in here if found.
  extract.on('entry', function onEntry (header, fileStream, next) {
    if (header.name === 'package/npm-shrinkwrap.json') {
      opts.log.silly('extract-shrinkwrap', 'found shrinkwrap')
      // got a shrinkwrap! Now we don't need to look for entries anymore.
      extract.removeListener('entry', onEntry)

      // Grab all the file data off the entry fileStream.
      var data = ''
      fileStream.on('data', function (d) { data += d })

      finished(fileStream, function (err) {
        if (err) { return extract.emit('error', err) }
        try {
          shrinkwrap = JSON.parse(data)
        } catch (e) {
          extract.emit('error', e)
        }
        // By destroying `unzipped`, this *should* stop `tar-stream`
        // from continuing to waste resources on tarball parsing.
        unzipped.unpipe()
        cb(null, shrinkwrap)
      })
    } else {
      // Not a shrinkwrap. Autodrain this entry, and move on to the next.
      fileStream.resume()
      next()
    }
  })

  // Any other streams that `pkgStream` is being piped to should
  // remain unaffected by this, although there might be confusion
  // around backpressure issues.
  pipe(pkgStream, unzipped, function (err) {
    // If we already successfully emitted a shrinkwrap,
    // we literally don't care about any errors.
    // Issues with `pkgStream` can be handled elsewhere if needed.
    if (!shrinkwrap) { cb(err) }
  })
}
