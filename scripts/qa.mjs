import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const jobs = [
    ['Frontend tests', 'apka-shoper-apilo', ['test']],
    ['Backend tests', 'shopsync-backend', ['test', '--', '--runInBand']],
    ['Frontend build', 'apka-shoper-apilo', ['run', 'build']],
    ['Backend build', 'shopsync-backend', ['run', 'build']],
];

for (const [label, directory, args] of jobs) {
    process.stdout.write(`\n[QA] ${label}\n`);
    const result = spawnSync('npm', args, {
        cwd: fileURLToPath(new URL(`../${directory}/`, import.meta.url)),
        stdio: 'inherit',
        shell: process.platform === 'win32',
    });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
}

process.stdout.write(`\n[QA] All checks passed in ${root}\n`);
