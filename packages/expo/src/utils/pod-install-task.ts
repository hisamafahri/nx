import { exec } from 'child_process';
import { platform } from 'os';
import * as chalk from 'chalk';
import { GeneratorCallback, logger } from '@nx/devkit';
import { rmdirSync, existsSync } from 'fs-extra';
import { join } from 'path';

const podInstallErrorMessage = `
Running ${chalk.bold('pod install')} failed, see above.
Do you have CocoaPods (https://cocoapods.org/) installed?

Check that your XCode path is correct:
${chalk.bold('sudo xcode-select --print-path')}

If the path is wrong, switch the path: (your path may be different)
${chalk.bold('sudo xcode-select --switch /Applications/Xcode.app')}
`;

/**
 * Run pod install on ios directory
 * @param iosDirectory ios directory that contains Podfile
 * @returns resolve with 0 if not error, reject with error otherwise
 */
export function runPodInstall(
  iosDirectory: string,
  install: boolean = true,
  buildFolder?: string
): GeneratorCallback {
  return () => {
    if (platform() !== 'darwin') {
      logger.info('Skipping `pod install` on non-darwin platform');
      return;
    }

    if (!install || existsSync(join(iosDirectory, 'Podfile'))) {
      logger.info('Skipping `pod install`');
      return;
    }

    logger.info(`Running \`pod install\` from "${iosDirectory}"`);

    return podInstall(iosDirectory, buildFolder);
  };
}

export function podInstall(
  iosDirectory: string,
  buildFolder?: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(
      'pod install',
      {
        cwd: iosDirectory,
      },
      (error, stdout, stderr) => {
        if (error) {
          logger.error(error.message);
          reject(new Error(podInstallErrorMessage));
        }
        if (stderr) {
          logger.error(stderr);
          reject(new Error(podInstallErrorMessage));
        }
        logger.info(stdout);
        if (stdout.includes('Pod installation complete')) {
          // Remove build folder after pod install
          if (buildFolder) {
            buildFolder = join(iosDirectory, buildFolder);
            if (existsSync(buildFolder)) {
              rmdirSync(buildFolder, { recursive: true });
            }
          }
          resolve();
        } else {
          reject(new Error(podInstallErrorMessage));
        }
      }
    );
  });
}
