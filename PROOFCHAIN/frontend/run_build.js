const { execSync } = require('child_process');
const fs = require('fs');

try {
  console.log('Running npm run build inside frontend...');
  const output = execSync('npm run build', {
    cwd: 'c:\\Users\\chira\\OneDrive\\Desktop\\METABLOCK\\METABLOCK\\PROOFCHAIN\\frontend',
    encoding: 'utf8',
    stdio: 'pipe'
  });
  fs.writeFileSync('c:\\Users\\chira\\OneDrive\\Desktop\\METABLOCK\\METABLOCK\\PROOFCHAIN\\frontend\\build_output.txt', 'BUILD SUCCESSFUL:\n' + output);
  console.log('Build succeeded!');
} catch (error) {
  const errorMsg = `BUILD FAILED:\nStdout:\n${error.stdout}\nStderr:\n${error.stderr}\nError:\n${error.message}`;
  fs.writeFileSync('c:\\Users\\chira\\OneDrive\\Desktop\\METABLOCK\\METABLOCK\\PROOFCHAIN\\frontend\\build_output.txt', errorMsg);
  console.log('Build failed! Check build_output.txt');
}
