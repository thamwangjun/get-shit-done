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

  // 2. Check if the latest git commit message is already "chore(config): refactor rules and configuration files (Batch 1)".
  // If so, print "Batch 1 already committed" and exit 0.
  let latestCommit = '';
  try {
    latestCommit = execFileSync('git', ['log', '-n', '1', '--pretty=format:%s'], { encoding: 'utf8', cwd: repoRoot }).trim();
  } catch (err) {
    console.warn('Warning: Could not get latest commit message:', err.message);
  }

  if (latestCommit === 'chore(config): refactor rules and configuration files (Batch 1)') {
    console.log('Batch 1 already committed');
    process.exit(0);
  }

  // 3. Initialize a Set of expected files containing 'CATALOGUE.json', 'mise.toml', and '.planning/config.json'.
  const expectedFiles = new Set(['CATALOGUE.json', 'mise.toml', '.planning/config.json']);

  // 4. Dynamically scan `.planning/references/` for markdown files (`.md`) and add their relative paths to the expected files Set.
  const referencesDir = path.join(repoRoot, '.planning', 'references');
  if (fs.existsSync(referencesDir)) {
    const files = fs.readdirSync(referencesDir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        expectedFiles.add(`.planning/references/${file}`);
      }
    }
  }

  // 5. Run `git reset` using `execFileSync` to unstage any pre-existing staged files.
  console.log('Unstaging any pre-existing staged changes...');
  try {
    execFileSync('git', ['reset'], { cwd: repoRoot, stdio: 'ignore' });
  } catch (err) {
    console.error('Failed to run git reset:', err.message);
    process.exit(1);
  }

  // 6. Iterate through the expected files list. For each file, check if it exists on disk and has changes since `v1.41.2`
  // If the file has no changes or does not exist, skip staging and log output for it entirely silently.
  // Otherwise, execute `git add -f` using `execFileSync`.
  for (const file of expectedFiles) {
    if (hasChangesSinceV1_41_2(file, repoRoot)) {
      console.log(`Staging modified Batch 1 file: ${file}`);
      try {
        execFileSync('git', ['add', '-f', file], { cwd: repoRoot });
      } catch (err) {
        console.error(`Failed to git add ${file}:`, err.message);
        process.exit(1);
      }
    }
  }

  // 7. Execute `git diff --cached --name-only` using `execFileSync` to list all currently staged files.
  let stagedFiles = [];
  try {
    const stagedOutput = execFileSync('git', ['diff', '--cached', '--name-only'], { encoding: 'utf8', cwd: repoRoot });
    stagedFiles = stagedOutput.split('\n').map(line => line.trim()).filter(Boolean);
  } catch (err) {
    console.error('Failed to list staged files:', err.message);
    process.exit(1);
  }

  // 8. Verify that all staged files are a subset of the expected files Set.
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

  // 9. If there are no staged files at all, log "No modifications to stage for Batch 1" and exit 0.
  if (stagedFiles.length === 0) {
    console.log('No modifications to stage for Batch 1');
    process.exit(0);
  }

  // 10. If the validation passes and files are staged, execute `git commit -m "chore(config): refactor rules and configuration files (Batch 1)"`
  console.log('Committing staged Batch 1 files...');
  try {
    execFileSync('git', ['commit', '-m', 'chore(config): refactor rules and configuration files (Batch 1)'], { cwd: repoRoot, stdio: 'inherit' });
    console.log('Batch 1 commit successful.');
  } catch (err) {
    console.error('Failed to commit Batch 1 changes:', err.message);
    process.exit(1);
  }
}

run();
