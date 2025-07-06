#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Simple build script for the Chrome extension
console.log("Building Site Watch Time Tracker Chrome Extension...");

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, "dist");
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Copy static files
const staticFiles = [
    "manifest.json",
    "popup.html",
    "popup.js",
    "detailed.html",
    "detailed.js",
    "content.js",
    "background.js",
];

staticFiles.forEach((file) => {
    const sourcePath = path.join(__dirname, file);
    const destPath = path.join(distDir, file);

    if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✓ Copied ${file}`);
    } else {
        console.log(`⚠ Warning: ${file} not found`);
    }
});

// Copy icons directory
const iconsSourceDir = path.join(__dirname, "icons");
const iconsDestDir = path.join(distDir, "icons");

if (fs.existsSync(iconsSourceDir)) {
    if (!fs.existsSync(iconsDestDir)) {
        fs.mkdirSync(iconsDestDir, { recursive: true });
    }

    const iconFiles = fs.readdirSync(iconsSourceDir);
    iconFiles.forEach((file) => {
        const sourcePath = path.join(iconsSourceDir, file);
        const destPath = path.join(iconsDestDir, file);
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✓ Copied icons/${file}`);
    });
}

// Copy src directory (for TypeScript files)
const srcSourceDir = path.join(__dirname, "src");
const srcDestDir = path.join(distDir, "src");

if (fs.existsSync(srcSourceDir)) {
    if (!fs.existsSync(srcDestDir)) {
        fs.mkdirSync(srcDestDir, { recursive: true });
    }

    function copyDirectory(source, destination) {
        const items = fs.readdirSync(source);

        items.forEach((item) => {
            const sourcePath = path.join(source, item);
            const destPath = path.join(destination, item);

            if (fs.statSync(sourcePath).isDirectory()) {
                if (!fs.existsSync(destPath)) {
                    fs.mkdirSync(destPath, { recursive: true });
                }
                copyDirectory(sourcePath, destPath);
            } else {
                fs.copyFileSync(sourcePath, destPath);
                console.log(
                    `✓ Copied src/${path.relative(srcSourceDir, sourcePath)}`
                );
            }
        });
    }

    copyDirectory(srcSourceDir, srcDestDir);
}

// Copy README
if (fs.existsSync("README.md")) {
    fs.copyFileSync("README.md", path.join(distDir, "README.md"));
    console.log("✓ Copied README.md");
}

console.log("\n🎉 Build completed successfully!");
console.log(`📁 Extension files are in: ${distDir}`);
console.log("\nTo install the extension:");
console.log("1. Open Chrome and go to chrome://extensions/");
console.log('2. Enable "Developer mode"');
console.log('3. Click "Load unpacked" and select the dist folder');
