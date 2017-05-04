'use strict'

const tap = require('tap')
const registryKey = require('../lib/fetchers/registry/registry-key')

tap.equals(registryKey("https://somedomain/somepath/"), "//somedomain/somepath/", "registryKey should keep URL path")
tap.equals(registryKey("https://somedomain/somepath/morepath"), "//somedomain/somepath/", "registryKey should strip trailing path segment")
