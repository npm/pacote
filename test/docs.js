var fs = require('graceful-fs')
var path = require('path')
var test = require('tap').test

test('all fixtures are documented', function (t) {
  // TODO - actually parse that table and make sure the
  //        important bits are documented?
  var readmePath = path.join(__dirname, 'fixtures', 'README.md')
  fs.readFile(readmePath, 'utf8', function (err, text) {
    if (err) { throw err }
    fs.readdir(path.dirname(readmePath), function (err, files) {
      if (err) { throw err }
      files.forEach(function (f) {
        if (f !== 'README.md') {
          t.match(text, f, f + ' is mentioned.')
        }
      })
      t.end()
    })
  })
})

test('all toplevel api calls are documented')
