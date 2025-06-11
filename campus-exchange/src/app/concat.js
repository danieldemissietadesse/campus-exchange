const fs = require('fs');
const path = require('path');

async function getAllFiles(dir, fileList = []) {
  const files = await fs.promises.readdir(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await fs.promises.stat(filePath);
    if (stats.isDirectory()) {
      await getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

async function concatenateFiles(inputDir, outputFile) {
  try {
    const files = await getAllFiles(inputDir);
    const fileContents = await Promise.all(
      files.map(async (file) => {
        const content = await fs.promises.readFile(file, 'utf8');
        return `\n\n// Content of ${file}\n\n${content}`;
      })
    );
    const allContent = fileContents.join('\n');
    await fs.promises.writeFile(outputFile, allContent, 'utf8');
    console.log(`All content written to ${outputFile}`);
  } catch (err) {
    console.error('Error:', err);
  }
}

const sourceDirectory = '/Users/danieldemissie/Downloads/Development/campus exchange/campus-exchange/campus-exchange/src';
const outputFile = 'all_sources.txt';

concatenateFiles(sourceDirectory, outputFile);