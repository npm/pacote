var extractShrinkwrap = require('../util/extract-shrinkwrap')
var inflight = require('inflight')
var manifestCache = require('../cache/manifest')
var optCheck = require('../util/opt-check')
var pickRegistry = require('./pick-registry')
var registryKey = require('./registry-key')
var url = require('url')

module.exports = metadata
function metadata (spec, opts, cb) {
  opts = optCheck(opts)

  var registry = pickRegistry(spec, opts)
  var uri = metadataUrl(registry, spec.escapedName, spec.spec)

  cb = inflight('pacote registry metadata req: ' + uri, cb)
  if (!cb) {
    opts.log.silly('metadata', 'request for', uri, 'inflight. Stepping back.')
    return
  }

  manifestCache.get('registry-metadata', uri, {
    log: opts.log,
    cache: opts.cache
  }, function (err, metadata) {
    if (err && err.code !== 'ENOENT') { return cb(err) }
    if (metadata) {
      return cb(null, metadata, registry)
    } else {
      // nothing in cache. Let's grab it!
      fetchFromRegistry(uri, registry, opts, function (err, metadata) {
        if (err) { return cb(err) }
        manifestCache.put('registry', uri, manifest, {
          log: opts.log,
          cache: opts.cache
        }, function (err) {
          if (err) { return cb(err) }
          // returning the identifier here
          cb(null, manifest, registry)
        })
      })
    }
  })
}

module.exports.url = manifestUrl
function manifestUrl (registry, name, version) {
  // Literally the URL you make a req to to get a version-specific pkg.
  var normalized = registry.slice(-1) !== '/'
  ? registry + '/'
  : registry
  return url.resolve(
    normalized, name + '/' + version)
}

function fetchFromRegistry (uri, registry, opts, cb) {
  opts.log.silly('manifest', 'fetching', uri, 'from registry.')
  var client = new (require('npm-registry-client'))({
    log: opts.log,
    retry: opts.retry
  })
  client.get(uri, {
    auth: opts.auth && opts.auth[registryKey(registry)]
  }, function (err, manifest) {
    if (err) { return cb(err) }
    opts.log.silly('manifest', 'found', uri, 'in registry.')
    ensureShrinkwrapInfo(manifest, opts, cb)
  })
}

function ensureShrinkwrapInfo (manifest, opts, cb) {
  // TODO: `opts.requireShrinkwrap` needs to go away once other stuff's done.
  // It's only here so I don't have to code the full fetch yet.
  if (
    !opts.requireShrinkwrap ||
    manifest.hasShrinkwrap !== true ||
    manifest._shrinkwrap == null
  ) {
    // Yay! We can short-circuit!
    cb(null, manifest)
  } else {
    // Oh no! Now the only way we can find out is by DLing
    // the entire pkg :<
    //
    // `fetch-stream` is lazy-loaded because it's heavyweight.
    // If users are working entirely off cache, it'll never get here.
    require('./fetch-stream')({
      name: manifest.name,
      version: manifest.version
    }, opts, manifest, function (err, pkg, stream) {
      if (err) { return cb(err) }
      extractShrinkwrap(stream, {
        log: opts.log
      }, function (err, sr) {
        if (err) { return cb(err) }
        if (sr) {
          manifest._shrinkwrap = sr
          manifest.hasShrinkwrap = true
        }
        cb(null, manifest)
      })
    })
  }
}
