'use strict'

var gunzip = require('./util/gunzip-maybe')
var path = require('path')
var pipeline = require('mississippi').pipeline
var tar = require('tar-fs')

module.exports = extractStream
function extractStream (dest, opts) {
  opts = opts || {}
  var sawIgnores = {}
  return pipeline(gunzip(), tar.extract(dest, {
    map: function (header) {
      if (process.platform !== 'win32') {
        header.uid = opts.uid == null ? header.uid : opts.uid
        header.gid = opts.gid == null ? header.gid : opts.gid
      }
      // Note: This mirrors logic in the fs read operations that are
      // employed during tarball creation, in the fstream-npm module.
      // It is duplicated here to handle tarballs that are created
      // using other means, such as system tar or git archive.
      if (header.type === 'file') {
        var base = path.basename(header.name)
        if (base === '.npmignore') {
          sawIgnores[header.name] = true
        } else if (base === '.gitignore') {
          var npmignore = header.name.replace(/\.gitignore$/, '.npmignore')
          if (!sawIgnores[npmignore]) {
            // Rename, may be clobbered later.
            header.name = npmignore
          }
        }
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
  if (header.type.match(/^.*link$/)) {
    if (logger) {
      logger.warn(
        'extract-stream',
        'excluding symbolic link',
        header.name, '->', header.linkname)
    }
    return true
  }

  return false
}
