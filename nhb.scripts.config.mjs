// @ts-check

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineScriptConfig } from 'nhb-scripts';

export default defineScriptConfig({
    commit: {
        runFormatter: false,
        emojiBeforePrefix: true,
        wrapPrefixWith: '`',
        runBefore: syncPackageVersions,
        commitTypes: {
            custom: [{ emoji: '🚀', type: 'init' }],
        },
    },
    count: {
        defaultPath: '.',
        excludePaths: ['node_modules', 'dist'],
    },
});

/**
 * @returns {string[]}
 */
function findPackageJsonFiles() {
    /** @type {string[]} */
    const files = [];

    for (const entry of readdirSync('packages', { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;

        files.push(join('packages', entry.name, 'package.json'));
    }

    return files;
}

/**
 * Synchronizes all workspace package versions with the root package version.
 *
 * @returns {void}
 */
function syncPackageVersions() {
    /** @type {{ version: string }} */
    const rootPackage = JSON.parse(readFileSync('package.json', 'utf8'));

    const version = rootPackage.version;

    for (const file of findPackageJsonFiles()) {
        /** @type {{ version: string }} */
        const pkg = JSON.parse(readFileSync(file, 'utf8'));

        pkg.version = version;

        writeFileSync(file, `${JSON.stringify(pkg, null, '\t')}\n`);
    }
}
