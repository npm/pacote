'use strict'

const util = require('util')

const fs = require('fs')
const getStream = require('get-stream')
const mkdirp = util.promisify(require('mkdirp'))
const npa = require('npm-package-arg')
const optCheck = require('./lib/util/opt-check.js')
const { PassThrough } = require('stream')
const path = require('path')
const rimraf = util.promisify(require('rimraf'))
const withTarballStream = require('./lib/with-tarball-stream.js')

module.exports = tarball

function tarball (spec, opts) {
  opts = optCheck(opts)
  spec = npa(spec, opts.where)
  return withTarballStream(spec, opts, (stream) => getStream.buffer(stream))
}

module.exports.stream = tarballStream

function tarballStream (spec, opts) {
  opts = optCheck(opts)
  spec = npa(spec, opts.where)
  const output = new PassThrough()
  let hasTouchedOutput = false
  let lastError = null
  withTarballStream(spec, opts, (stream) => {
    if (hasTouchedOutput && lastError) {
      throw lastError
    } else if (hasTouchedOutput) {
      throw new Error('abort, abort!')
    } else {
      return new Promise((resolve, reject) => {
        stream.on('error', reject)
        output.on('error', reject)
        output.on('error', () => {
          hasTouchedOutput = true
        })
        output.on('finish', resolve)
        stream.pipe(output)
        stream.once('data', () => {
          hasTouchedOutput = true
        })
      }).catch((err) => {
        lastError = err
        throw err
      })
    }
  }).catch((err) => output.emit('error', err))
  return output
}

module.exports.toFile = tarballToFile

function tarballToFile (spec, dest, opts) {
  opts = optCheck(opts)
  spec = npa(spec, opts.where)
  return mkdirp(path.dirname(dest)).then(() =>
    withTarballStream(spec, opts, (stream) => {
      return rimraf(dest).then(
        () =>
          new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(dest)
            stream.on('error', reject)
            writer.on('error', reject)
            writer.on('close', resolve)
            stream.pipe(writer)
          })
      )
    })
  )
}
