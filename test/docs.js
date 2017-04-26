'use strict'

const BB = require('bluebird')

const fs = BB.promisifyAll(require('fs'))
const path = require('path')
const test = require('tap').test

test('all fixtures are documented', t => {
  // TODO - actually parse that table and make sure the
  //        important bits are documented?
  const readmePath = path.join(__dirname, 'fixtures', 'README.md')
  return BB.join(
    fs.readFileAsync(readmePath, 'utf8'),
    fs.readdirAsync(path.dirname(readmePath)),
    (text, files) => {
      files.forEach(f => {
        if (f !== 'README.md') {
          t.match(text, f, f + ' is mentioned.')
        }
      })
    }
  )
})

test('all toplevel api calls are documented', t => {
  const pacote = require('../')
  function getFns (obj) {
    const fns = []
    for (let k in obj) {
      if (obj.hasOwnProperty(k) && typeof obj[k] === 'function') {
        fns.push(k)
        fns.push.apply(fns, getFns(obj[k], k).map(n => `${k}.${n}`))
      }
    }
    return fns
  }
  let apiFns = getFns(pacote)
  t.comment(apiFns)
  return fs.readFileAsync(
    path.join(__dirname, '..', 'README.md'),
    'utf8'
  ).then(readme => {
    apiFns.forEach(fn => {
      t.match(
        readme,
        new RegExp(`#### <a name="[^"]+"></a> \`> pacote.${fn}\\([^)]*\\)\``, 'g'),
        `pacote.${fn} has a docs entry`
      )
    })
  })
})

test('all options are documented')
