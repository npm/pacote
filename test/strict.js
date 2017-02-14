'use strict'

var fs = require('fs')
var glob = require('glob')
var path = require('path')
var test = require('tap').test

test('all JavaScript source files use strict mode', function (t) {
  var globStr = '**/*.js'
  var root = path.resolve(__dirname, '../')
  glob(globStr, {
    cwd: root,
    ignore: 'node_modules/**/*.js'
  }, function (err, files) {
    if (err) { throw err }
    var line = "'use strict'\n"
    var bytecount = line.length
    // node@0.12 doesn't have Buffer.alloc
    var buf = Buffer.alloc ? Buffer.alloc(bytecount) : new Buffer(bytecount)
    files.forEach(function (f) {
      var fd = fs.openSync(path.join(root, f), 'r')
      fs.readSync(fd, buf, 0, bytecount, 0)
      fs.closeSync(fd)
      t.equal(buf.toString('utf8'), line, f + ' is using strict mode.')
    })
    t.done()
  })
})
