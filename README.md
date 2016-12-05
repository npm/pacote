# pacote [![npm version](https://img.shields.io/npm/v/pacote.svg)](https://npm.im/pacote) [![license](https://img.shields.io/npm/l/pacote.svg)](https://npm.im/pacote) [![Travis](https://img.shields.io/travis/zkat/pacote.svg)](https://travis-ci.org/zkat/pacote) [![AppVeyor](https://ci.appveyor.com/api/projects/status/github/zkat/pacote?svg=true)](https://ci.appveyor.com/project/zkat/pacote) [![Coverage Status](https://coveralls.io/repos/github/zkat/pacote/badge.svg?branch=latest)](https://coveralls.io/github/zkat/pacote?branch=latest)

[`pacote`](https://github.com/zkat/pacote) is a Node.js library for downloading
[npm](https://npmjs.org)-compatible packages. It supports all package specifier
syntax that `npm install` and its ilk support. It transparently caches anything
needed to reduce excess operations, using [`cacache`](https://npm.im/cacache).

## Install

`$ npm install --save pacote`

## Table of Contents

* [Example](#example)
* [Features](#features)
* [Guide](#guide)
* [API](#api)
  * [`metadata`](#metadata)
  * [`manifest`](#manifest)
  * [`tarball.unpack`](#tarball-unpack)
  * [`tarball.stream`](#tarball-stream)

### Example

```javascript
const pacote = require('pacote')

// TODO
```

### Features

* gets stuff

### Guide

#### Introduction

### API

#### <a name="get"></a> `> pacote.get(cb)`

##### Example

```javascript
pacote.get(err => {
  if (err) { throw err }
}
```
