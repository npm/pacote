module.exports = cacheKey
function cacheKey (type, identifier) {
  return ['pacote', type, identifier].join(':')
}
