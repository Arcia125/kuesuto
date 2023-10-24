import fs from "fs";
import path from "path";

// Define source and destination directories
const sourceDirectory = path.join(
  'C:',
  'Users',
  'Arcia',
  'Pictures',
  'pixel art'
);
const destinationDirectory = path.join(
  'C:',
  'webdev',
  'projects',
  'node',
  'kuesuto'
);

// Define the list of sprites and their corresponding metadata files
const filesToMove = [
  { name: 'kuesuto-player.png', metadata: 'kuesuto-player.json' },
  { name: 'kuesuto-sword.png', metadata: 'kuesuto-sword.json' },
  { name: 'kuesuto-tiles.png', metadata: 'kuesuto-tiles.json' },
];

// Function to move files
function moveFile(src, dest, fileName) {
  const srcPath = path.join(src, fileName);
  const destPath = path.join(dest, fileName);

  if (fs.existsSync(srcPath)) {
    fs.copyFile(srcPath, destPath, (err) => {
      if (err) {
        console.error(`Error copying ${fileName}: ${err}`);
      } else {
        console.log(`Copied ${fileName} to ${dest}`);
      }
    });
  } else {
    console.error(`File ${fileName} not found in ${src}`);
  }
}

// Loop through the files and move them
filesToMove.forEach((file) => {
  moveFile(
    sourceDirectory,
    path.join(destinationDirectory, 'public'),
    file.name
  );
  moveFile(
    sourceDirectory,
    path.join(destinationDirectory, 'src', 'spriteJSON'),
    file.metadata
  );
});
