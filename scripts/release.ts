import { logger } from '@umijs/utils';
import getGitRepoInfo from 'git-repo-info';
import { join } from 'path';
import rimraf from 'rimraf';
import 'zx/globals';
import { PATHS } from './.internal/constants';
import { assert, eachPkg, getPkgs } from './.internal/utils';

(async () => {
  const { branch } = getGitRepoInfo();
  logger.info(`branch: ${branch}`);
  const pkgs = getPkgs();
  logger.info(`pkgs: ${pkgs.join(', ')}`);

  // check git status
  logger.event('check git status');
  const isGitClean = (await $`git status --porcelain`).stdout.trim().length;
  assert(!isGitClean, 'git status is not clean');

  // check git remote update
  logger.event('check git remote update');
  await $`git fetch`;
  const gitStatus = (await $`git status --short --branch`).stdout.trim();
  assert(!gitStatus.includes('behind'), `git status is behind remote`);

  // check npm registry
  logger.event('check npm registry');
  const registry = (await $`npm config get registry`).stdout.trim();
  assert(registry === 'https://registry.npmjs.org/', 'npm registry is not https://registry.npmjs.org/');

  // clean
  logger.event('clean');
  eachPkg(pkgs, ({ dir, name }) => {
    logger.info(`clean dist of ${name}`);
    rimraf.sync(join(dir, 'dist'));
  });

  // build packages
  logger.event('build packages');
  await $`npm run build:release`;

  // bump version
  // logger.event('bump version');
  const version = require(PATHS.ROOT_CONFIG).version;
  let tag = 'latest';
  if (version.includes('-alpha.') || version.includes('-beta.') || version.includes('-rc.')) {
    tag = 'next';
  }
  if (version.includes('-canary.')) tag = 'canary';

  // update pnpm lockfile
  // logger.event('update pnpm lockfile');
  // $.verbose = false;
  // await $`pnpm i`;
  // $.verbose = true;

  // // commit
  // logger.event('commit');
  // await $`git commit --all --message "release: ${version}"`;

  // git tag
  if (tag !== 'canary') {
    logger.event('git tag');
    await $`git tag ${version}`;
  }

  // // git push
  logger.event('git push');
  await $`git push origin ${branch} --tags`;

  // pnpm publish
  logger.event('pnpm publish');
  $.verbose = false;
  const innerPkgs = pkgs.filter((pkg) => !['poros'].includes(pkg));

  // check 2fa config
  let otpArg: string[] = [];
  if ((await $`npm profile get "two-factor auth"`).toString().includes('writes')) {
    let code = '';
    do {
      // get otp from user
      code = await question('This operation requires a one-time password: ');
      // generate arg for zx command
      // why use array? https://github.com/google/zx/blob/main/docs/quotes.md
      otpArg = ['--otp', code];
    } while (code.length !== 6);
  }

  await Promise.all(
    innerPkgs.map(async (pkg) => {
      await $`cd packages/${pkg} && pnpm publish --no-git-checks --tag ${tag} ${otpArg}`;
      logger.info(`+ ${pkg}`);
    }),
  );
  await $`cd packages/poros && pnpm publish --no-git-checks --tag ${tag} ${otpArg}`;
  logger.info(`+ poros`);
  $.verbose = true;
})();
