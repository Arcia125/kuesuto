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
  { type: 'sprite', name: 'kuesuto-player.png', metadata: 'kuesuto-player.json' },
  { type: 'sprite', name: 'kuesuto-sword.png', metadata: 'kuesuto-sword.json' },
  { type: 'sprite', name: 'ks-dark-wizard.png', metadata: 'ks-dark-wizard.json' },
  { type: 'sprite', name: 'ks-slime2.png', metadata: 'ks-slime2.json' },
  { type: 'sprite', name: 'ks-level-up-animation.png', metadata: 'ks-level-up-animation.json' },
  { type: 'tilemap', name: 'collision.png', metadata: 'collision.json', tilesetData: 'collision.json' },
  { type: 'tilemap', name: 'kuesuto-tilemap.png', metadata: 'kuesuto-tilemap.json', tilesetData: 'ks-forrest-tileset.json' },
  { type: 'map', name: 'kuesuto-world.json' },
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
  if (file.type === 'sprite') {
    moveFile(
      sourceDirectory,
      path.join(destinationDirectory, 'public'),
      file.name
    );
    moveFile(
      sourceDirectory,
      path.join(destinationDirectory, 'src', 'data', 'spriteJSON'),
      file.metadata
    );
  }
  if (file.type === 'tilemap') {
    moveFile(
      sourceDirectory,
      path.join(destinationDirectory, 'public'),
      file.name
    );
    moveFile(
      sourceDirectory,
      path.join(destinationDirectory, 'src', 'data', 'spriteJSON'),
      file.metadata
    );
    moveFile(
      sourceDirectory,
      path.join(destinationDirectory, 'src', 'data', 'tilesets'),
      file.tilesetData
    );
  }
  if (file.type === 'map') {
    moveFile(
      sourceDirectory,
      path.join(destinationDirectory, 'src', 'data', 'maps'),
      file.name
    );
  }
});
