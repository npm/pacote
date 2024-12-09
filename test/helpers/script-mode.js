const scriptMode = () => {
  // On Windows, scripts are r/w but not executable
  if (process.platform === 'win32') {
    return 0o666
  } else {
    // On Unix, scripts are executable
    return 0o111
  }
}

module.exports = scriptMode
