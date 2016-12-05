module.exports = pickRegistry
function pickRegistry (spec, opts, cb) {
  var registry = spec.scope && opts[spec.scope + ':registry']

  if (!registry && opts.scope) {
    var prefix = opts.scope[0] === '@' ? '' : '@'
    registry = opts[prefix + opts.scope + ':registry']
  }

  if (!registry) {
    registry = opts.registry
  }

  if (registry) {
    cb(null, registry)
  } else {
    cb(new Error('registry option is required'))
  }
}
