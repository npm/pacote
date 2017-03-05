'use strict'

const BB = require('bluebird')

const pipeline = require('mississippi').pipeline
const tar = require('tar-stream')
const zlib = require('zlib')

module.exports = makeTarball
function makeTarball (files, opts) {
  opts = opts || {}
  const pack = tar.pack()
  Object.keys(files).forEach(function (filename) {
    const entry = files[filename]
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
  return BB.fromNode(cb => {
    if (opts.stream && opts.gzip) {
      return cb(null, pipeline(pack, zlib.createGzip()))
    } else if (opts.stream) {
      return cb(null, pack)
    } else {
      let tarData = ''
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
  })
}
