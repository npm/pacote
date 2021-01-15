const { statSync, writeFileSync } = require('fs')
statSync(`${__dirname}/.gitignore`)
writeFileSync(`${__dirname}/prepare_ran_successfully`, 'hello')
console.log('this is fine')
