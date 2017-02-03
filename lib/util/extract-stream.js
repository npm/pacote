var gunzip = require('./gunzip-maybe')
var path = require('path')
var pipeline = require('mississippi').pipeline
var tar = require('tar-fs')

module.exports = extractStream
function extractStream (dest, opts) {
  return pipeline(gunzip(), tar.extract(dest, {
    map: function (header) {
      if (process.platform !== 'win32') {
        header.uid = opts.uid == null ? header.uid : opts.uid
        header.gid = opts.gid == null ? header.gid : opts.gid
      }
      return header
    },
    ignore: makeIgnore(opts.log),
    dmode: opts.dmode,
    fmode: opts.fmode,
    umask: opts.umask,
    strip: 1
  }))
}

function makeIgnore (log) {
  var sawIgnores = {}
  return function (name, header) {
    return _ignore(name, header, sawIgnores, log)
  }
}

function _ignore (name, header, sawIgnores, logger) {
  if (header.type.match(/^.*Link$/)) {
    if (logger) {
      logger.warn(
        'extract-stream',
        'excluding symbolic link',
        header.path, '->', header.linkname)
    }
    return true
  }

  // Note: This mirrors logic in the fs read operations that are
  // employed during tarball creation, in the fstream-npm module.
  // It is duplicated here to handle tarballs that are created
  // using other means, such as system tar or git archive.
  if (header.type === 'File') {
    var base = path.basename(header.path)
    if (base === '.npmignore') {
      sawIgnores[header.path] = true
    } else if (base === '.gitignore') {
      var npmignore = header.path.replace(/\.gitignore$/, '.npmignore')
      if (sawIgnores[npmignore]) {
        // Skip this one, already seen.
        return true
      } else {
        // Rename, may be clobbered later.
        header.path = npmignore
        header._path = npmignore
      }
    }
  }

  return false
}
