var cacache = require('cacache')

module.exports = cachingStream
function cachingStream (pkg, opts) {
  // TODO - this does not exist in cacache so it's better to make a tee-stream
  return cacache.put.through(opts.cache, pkg._key, {
    digest: pkg._shasum,
    hashAlgorithm: opts.hashAlgorithm,
    metadata: pkg,
    size: pkg._size,

    uid: opts.cacheUid,
    gid: opts.cacheGid
  })
}
