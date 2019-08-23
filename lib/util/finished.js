'use strict'

module.exports = function (child, hasExitCode = false) {
  return new Promise((resolve, reject) => {
    child.on('error', reject)
    child.on(hasExitCode ? 'close' : 'end', function (exitCode) {
      if (exitCode === undefined || exitCode === 0) {
        return resolve()
      } else {
        let err = new Error('exited with error code: ' + exitCode)
        return reject(err)
      }
    })
  })
}
