// paths used in snapshot testing
const cwd = process.cwd()
const home = process.env.HOME
const execPath = process.execPath

const cleanSnapshot = (input) => {
  let output = input
    .split(cwd).join('{CWD}')
    .split(home).join('{HOME}')
    .split(execPath).join('{NODE}')

  // On Windows, also replace variations with escaped backslashes
  if (process.platform === 'win32') {
    output = output
      .split(cwd.replace(/\\/g, '\\\\')).join('{CWD}')
      .split(cwd.replace(/\\/g, '\\\\\\\\')).join('{CWD}')
      .split(home.replace(/\\/g, '\\\\')).join('{HOME}')
      .split(home.replace(/\\/g, '\\\\\\\\')).join('{HOME}')
      .split(execPath.replace(/\\/g, '\\\\')).join('{NODE}')
      .split(execPath.replace(/\\/g, '\\\\\\\\')).join('{NODE}')
      .replace(/\\\\/g, '/')
      .replace(/\\(?!")/g, '/')
  }

  return output
}

module.exports = cleanSnapshot
