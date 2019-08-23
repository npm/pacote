'use strict'

const BB = require('bluebird')

const getStream = require('get-stream')
const { pipeline } = require('mississippi')
const tar = require('tar-stream')
const zlib = require('zlib')

const gzip = BB.promisify(zlib.gzip)

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
      mtime: entry.mtime || new Date(0),
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

  const tryFn = () => {
    if (opts.stream && opts.gzip) {
      return pipeline(pack, zlib.createGzip())
    } else if (opts.stream) {
      return pack
    } else {
      return getStream.buffer(pack).then(ret => {
        if (opts.gzip) {
          return gzip(ret)
        } else {
          return ret
        }
      })
    }
  }
  return new Promise((resolve, reject) => {
    try {
      Promise.resolve(tryFn())
        .then(resolve)
        .catch(reject)
    } catch (err) {
      reject(err)
    }
  })
}
