'use strict'

var pipeline = require('mississippi').pipeline
var tar = require('tar-stream')
var zlib = require('zlib')

module.exports = makeTarball
function makeTarball (files, opts, cb) {
  if (!cb) {
    cb = opts
    opts = null
  }
  opts = opts || {}
  var pack = tar.pack()
  Object.keys(files).forEach(function (filename) {
    var entry = files[filename]
    pack.entry({
      name: (opts.noPrefix ? '' : 'package/') + filename,
      type: entry.type,
      size: entry.size,
      mode: entry.mode,
      mtime: entry.mtime,
      linkname: entry.linkname,
      uid: entry.uid,
      gid: entry.gid,
      uname: entry.uname,
      gname: entry.gname
    }, typeof files[filename] === 'string'
    ? files[filename]
    : files[filename].data)
  })
  pack.finalize()
  if (opts.stream && opts.gzip) {
    return cb(null, pipeline(pack, zlib.createGzip()))
  } else if (opts.stream) {
    return cb(null, pack)
  } else {
    var tarData = ''
    pack.on('data', function (d) { tarData += d })
    pack.on('error', cb)
    pack.on('end', function () {
      if (opts.gzip) {
        zlib.gzip(tarData, cb)
      } else {
        cb(null, tarData)
      }
    })
  }
}
