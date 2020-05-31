# @hediet/semver - TypeScript Implementation of The Semantic Version Specification

[![](https://img.shields.io/twitter/follow/hediet_dev.svg?style=social)](https://twitter.com/intent/follow?screen_name=hediet_dev)

A sane TypeScript implementation of the [Semantic Version specification 2.0.0](https://semver.org/spec/v2.0.0.html).
Some features are still missing but will be implemented eventually.

## Install

To install the library:

```
yarn add @hediet/semver
```

## Features

-   Parse/Stringify versions
-   Modify/Increment versions
-   Versions are immutable

## Examples

```js
const ver = SemanticVersion.parse("1.0.0-alpha.1");
equal(ver.major, 1);

const ver1 = ver.with({ preRelease: null });
equal(ver1.toString(), "1.0.0");

const ver2 = ver.with({ patch: "increment" });
equal(ver2.toString(), "1.0.1-alpha.1");

const ver3 = ver.with({ patch: "increment", preRelease: null });
equal(ver3.toString(), "1.0.1");
```
