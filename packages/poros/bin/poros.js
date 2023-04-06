#!/usr/bin/env node
// setNodeTitle
process.title = 'poros';
// Use magic to suppress node deprecation warnings
// See: https://github.com/nodejs/node/blob/master/lib/internal/process/warning.js#L77
// @ts-ignore
process.noDeprecation = '1';
process.env.DID_YOU_KNOW = 'none';
// disable since it's conflicted with typescript cjs + dynamic import
// require('v8-compile-cache');
// @ts-ignore
require('../dist/cli')
    .run()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
