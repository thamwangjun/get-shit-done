const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function hasChangesSinceV1_41_2(file, repoRoot) {
  const fullPath = path.join(repoRoot, file);
  if (!fs.existsSync(fullPath)) {
    return false;
  }

  // Check if it exists in v1.41.2
  let existsInV1_41_2 = true;
  try {
    execFileSync('git', ['cat-file', '-e', `v1.41.2:${file}`], { cwd: repoRoot, stdio: 'ignore' });
  } catch (err) {
    existsInV1_41_2 = false;
  }

  if (!existsInV1_41_2) {
    // If it doesn't exist in v1.41.2, it is a new file since v1.41.2!
    return true;
  }

  // If it exists in v1.41.2, check if there are differences between v1.41.2 and the working tree.
  try {
    execFileSync('git', ['diff', '--quiet', 'v1.41.2', '--', file], { cwd: repoRoot });
    return false;
  } catch (err) {
    // Exit code non-zero means there are differences.
    return true;
  }
}

function run() {
  const repoRoot = path.join(__dirname, '..');

  // Check the active branch guard: if process.env.ALLOW_ANY_BRANCH !== '1',
  // retrieve current branch using git, and if it is not "main", log error and abort with exit code 1.
  let currentBranch = '';
  try {
    currentBranch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8', cwd: repoRoot }).trim();
  } catch (err) {
    console.error('Failed to retrieve current branch:', err.message);
    process.exit(1);
  }

  if (process.env.ALLOW_ANY_BRANCH !== '1' && currentBranch !== 'main') {
    console.error(`Error: Current branch is "${currentBranch}", but "main" is required to run this script. Set ALLOW_ANY_BRANCH=1 to override.`);
    process.exit(1);
  }

  // Check if the latest git commit message is already "feat(scanner): refactor scanner logic and audit scripts (Batch 2)".
  // If so, print "Batch 2 already committed" and exit 0.
  let latestCommit = '';
  try {
    latestCommit = execFileSync('git', ['log', '-n', '1', '--pretty=format:%s'], { encoding: 'utf8', cwd: repoRoot }).trim();
  } catch (err) {
    console.warn('Warning: Could not get latest commit message:', err.message);
  }

  if (latestCommit === 'feat(scanner): refactor scanner logic and audit scripts (Batch 2)') {
    console.log('Batch 2 already committed');
    process.exit(0);
  }

  // Initialize a Set of expected files.
  const expectedFiles = new Set([
    'hooks/gsd-read-injection-scanner.js',
    'scripts/audit-tags.js',
    'hooks/gsd-check-update.js'
  ]);

  // Perform file existence checks on disk: for each expected file, if it is missing on disk,
  // log validation failed and exit 1.
  for (const file of expectedFiles) {
    const fullPath = path.join(repoRoot, file);
    if (!fs.existsSync(fullPath)) {
      console.error(`Validation failed: Expected file is missing on disk: ${file}`);
      process.exit(1);
    }
  }

  // Run git reset to unstage any pre-existing staged changes.
  console.log('Unstaging any pre-existing staged changes...');
  try {
    execFileSync('git', ['reset'], { cwd: repoRoot, stdio: 'ignore' });
  } catch (err) {
    console.error('Failed to run git reset:', err.message);
    process.exit(1);
  }

  // Iterate through the expected files list. For each file, check if it has changes since v1.41.2.
  // If the file has no changes, skip staging and log output for it silently.
  // Otherwise, execute git add -f <file> using execFileSync.
  for (const file of expectedFiles) {
    if (hasChangesSinceV1_41_2(file, repoRoot)) {
      console.log(`Staging modified Batch 2 file: ${file}`);
      try {
        execFileSync('git', ['add', '-f', file], { cwd: repoRoot });
      } catch (err) {
        console.error(`Failed to git add ${file}:`, err.message);
        process.exit(1);
      }
    }
  }

  // Execute git diff --cached --name-only to list all currently staged files.
  let stagedFiles = [];
  try {
    const stagedOutput = execFileSync('git', ['diff', '--cached', '--name-only'], { encoding: 'utf8', cwd: repoRoot });
    stagedFiles = stagedOutput.split('\n').map(line => line.trim()).filter(Boolean);
  } catch (err) {
    console.error('Failed to list staged files:', err.message);
    process.exit(1);
  }

  // Verify that all staged files are a subset of the expected files Set.
  const unauthorized = [];
  for (const file of stagedFiles) {
    if (!expectedFiles.has(file)) {
      unauthorized.push(file);
    }
  }

  if (unauthorized.length > 0) {
    console.error('Validation failed: Unauthorized files staged:', unauthorized);
    console.log('Aborting staging and resetting repository index...');
    try {
      execFileSync('git', ['reset'], { cwd: repoRoot, stdio: 'ignore' });
    } catch (err) {
      console.error('Failed to reset after abort:', err.message);
    }
    process.exit(1);
  }

  // If there are no staged files at all, log "No modifications to stage for Batch 2" and exit 0.
  if (stagedFiles.length === 0) {
    console.log('No modifications to stage for Batch 2');
    process.exit(0);
  }

  // If validation passes and files are staged, execute git commit -m "feat(scanner): refactor scanner logic and audit scripts (Batch 2)"
  console.log('Committing staged Batch 2 files...');
  try {
    execFileSync('git', ['commit', '-m', 'feat(scanner): refactor scanner logic and audit scripts (Batch 2)'], { cwd: repoRoot, stdio: 'inherit' });
    console.log('Batch 2 commit successful.');
  } catch (err) {
    console.error('Failed to commit Batch 2 changes:', err.message);
    process.exit(1);
  }
}

run();
