const spawn = require('../spawn.js')
const promiseRetry = require('promise-retry')
const shouldRetry = require('./should-retry.js')
const whichGit = require('./which.js')
const makeOpts = require('./opts.js')

module.exports = (gitArgs, gitOpts, opts) => {
  const gitPath = whichGit(opts)

  if (!gitPath)
    return Promise.reject(Object.assign(
      new Error('No git binary found in $PATH'), { code: 'ENOGIT' }))

  return promiseRetry((retry, number) => {
    if (number !== 1)
      opts.log.silly('pacote', `Retrying git command: ${
        gitArgs.join(' ')} attempt # ${number}`)

    return spawn(gitPath, gitArgs, makeOpts(gitOpts, opts))
      .catch(er => {
        if (shouldRetry(er.stderr, number))
          retry(er)
        else
          throw er
      })
      .then(({stdout}) => stdout)
  }, opts.retry !== null && opts.retry !== undefined ? opts.retry : {
    retries: opts['fetch-retries'],
    factor: opts['fetch-retry-factor'],
    maxTimeout: opts['fetch-retry-maxtimeout'],
    minTimeout: opts['fetch-retry-mintimeout']
  })
}
