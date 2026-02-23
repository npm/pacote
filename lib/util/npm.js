// run an npm command
const spawn = require('@npmcli/promise-spawn')

module.exports = (npmBin, npmCommand, cwd, env, extra) => {
  const isJS = npmBin.endsWith('.js')
  const cmd = isJS ? process.execPath : npmBin
  const args = (isJS ? [npmBin] : []).concat(npmCommand)

  // when installing to run the `prepare` script for a git dep, we need
  // to ensure that we don't run into a cycle of checking out packages
  // in temp directories.  this lets us link previously-seen repos that
  // are also being prepared.

  // If the command already contains an explicit --before flag (which pacote
  // derives from opts.before, itself potentially computed from min-release-age),
  // we must strip npm_config_min_release_age from the child environment.
  //
  // npm's config validator treats --min-release-age and --before as mutually
  // exclusive. The child process inherits the parent's env, so if the parent
  // was invoked with --min-release-age, npm_config_min_release_age will be
  // set in env. The child then sees BOTH --before (from args) AND
  // min-release-age (from env) simultaneously and exits with:
  //   "npm error --min-release-age cannot be provided when using --before"
  //
  // The fix: when --before is already present in the command args, delete
  // npm_config_min_release_age from the child's env so the child only ever
  // sees one of the two mutually exclusive flags.
  //
  // See: https://github.com/npm/cli/issues/9005
  const hasBeforeFlag = args.some(
    arg => typeof arg === 'string' && arg.startsWith('--before=')
  )

  const childEnv = hasBeforeFlag
    ? Object.fromEntries(
      Object.entries(env).filter(
        ([key]) => key.toLowerCase() !== 'npm_config_min_release_age'
      )
    )
    : env

  return spawn(cmd, args, { cwd, env: childEnv }, extra)
}
