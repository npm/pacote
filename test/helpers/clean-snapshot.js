// paths used in snapshot testing
const cwd = process.cwd()
const home = process.env.HOME
const execPath = process.execPath

const cleanSnapshot = (input) => {
  // On MacOS in GitHub Actions, NODE is a subdirectory of HOME so replace NODE first
  let output = input
    .split(cwd).join('{CWD}')
    .split(execPath).join('{NODE}')
    .split(home).join('{HOME}')

  // On Windows, also replace variations with escaped backslashes
  if (process.platform === 'win32') {
    output = output
      .split(cwd.replace(/\\/g, '\\\\')).join('{CWD}')
      .split(cwd.replace(/\\/g, '\\\\\\\\')).join('{CWD}')
      .split(execPath.replace(/\\/g, '\\\\')).join('{NODE}')
      .split(execPath.replace(/\\/g, '\\\\\\\\')).join('{NODE}')
      .split(home.replace(/\\/g, '\\\\')).join('{HOME}')
      .split(home.replace(/\\/g, '\\\\\\\\')).join('{HOME}')
      .replace(/\\\\/g, '/')
      .replace(/\\(?!")/g, '/')
  }

  return output
}

module.exports = cleanSnapshot
