import { readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';
import * as path from 'path'; // For path.relative

async function run() {
  const projectRoot = process.cwd(); // Assuming npm run sets this to package.json location
  console.log(`Script CWD (should be project root): ${projectRoot}`);

  const files = await glob('{app,components,lib,models}/**/*.ts', {
    nodir: true,
    cwd: projectRoot,
    absolute: true,
  });

  if (!files || files.length === 0) {
    console.log("No .ts files found in the specified directories. Searched in:");
    console.log(`- ${path.join(projectRoot, 'app')}`);
    console.log(`- ${path.join(projectRoot, 'components')}`);
    console.log(`- ${path.join(projectRoot, 'lib')}`);
    console.log(`- ${path.join(projectRoot, 'models')}`);
    return;
  }

  console.log(`Found ${files.length} .ts files to process.`);
  let modifiedCount = 0;

  for (const filePath of files) {
    const relativePath = path.relative(projectRoot, filePath);
    try {
      const originalText = await readFile(filePath, 'utf8');
      const newText = originalText
        .split('\n')
        .filter(line => {
          // Filter out (remove) lines that are exclusively comments
          return !line.trim().startsWith('//');
        })
        .map(line => {
          // For the remaining lines, remove any inline comments and trailing whitespace
          return line.replace(/\/\/.*$/, '').trimEnd();
        })
        .join('\n');

      if (newText !== originalText) {
        await writeFile(filePath, newText, 'utf8');
        console.log(`MODIFIED: ${relativePath}`);
        modifiedCount++;
      } else {
        // You can uncomment the next line for very verbose debugging:
        // console.log(`NO CHANGE: ${relativePath}`);
      }
    } catch (error: any) {
      console.error(`ERROR processing ${relativePath}: ${error.message}`);
    }
  }

  if (files.length > 0) {
      console.log(`Processing complete. ${modifiedCount} out of ${files.length} files were modified.`);
  }
}

run().catch(err => {
  console.error('FATAL SCRIPT ERROR:', err);
  process.exit(1);
});