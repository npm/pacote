# Test Fixtures

This directory contains a number of pre-generated files and directories used
by various tests. This file documents which tests use each file, and what for.

| File                      | User(s)                      | Note                                                      |
|---------------------------|------------------------------|-----------------------------------------------------------|
| `has-shrinkwrap.tgz`      | `util.extract-shrinkwrap.js` | used to test streaming shrinkwrap extraction.             |
| `no-shrinkwrap.tgz`       | `util.extract-shrinkwrap.js` | used to test streaming shrinkwrap extraction.             |
| `special-characters.tgz`  | `util.extract-shrinkwrap.js` | used to test sanitization of special characters on win32. |
