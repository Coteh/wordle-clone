#!/usr/bin/env node

const chokidar = require("chokidar");
const { execFile } = require("child_process");
const fs = require("fs");

const DEPLOY_ENV = process.argv[2];

chokidar.watch('index.html').on("change", (path) => {
    console.log(`Transforming ${path}...`);
    execFile("./scripts/transform_index_html.sh", ["./build", DEPLOY_ENV], (exec, stdout, stderr) => {
        if (stderr) {
            console.error(stderr);
        }
        process.stdout.write(stdout);
        console.log(`Successfully transformed ${path}.`);
    });
});

chokidar.watch('CHANGELOG.md').on("change", (path) => {
    console.log(`Generating ${path} as HTML...`);
    execFile("./scripts/gen_changelog_html.js", (exec, stdout, stderr) => {
        if (stderr) {
            console.error(stderr);
            return;
        }
        fs.writeFileSync("./build/CHANGELOG.html", stdout);
        console.log(`Successfully generated ${path} as HTML.`);
    });
});
