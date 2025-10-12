#!/usr/bin/env node

const chokidar = require("chokidar");
const { exec } = require("child_process");
const fs = require("fs");

const DEPLOY_ENV = process.argv[2];

chokidar.watch('index.html').on("change", (path) => {
    console.log(`Transforming ${path}...`);
    exec(`sh ./scripts/transform_index_html.sh ./build ${DEPLOY_ENV}`, (exec, stdout, stderr) => {
        if (stderr) {
            console.error(stderr);
        }
        process.stdout.write(stdout);
        console.log(`Successfully transformed ${path} and saved to ./build/${path}`);
    });
});

chokidar.watch('CHANGELOG.md').on("change", (path) => {
    console.log(`Generating ${path} as HTML...`);
    exec("node ./scripts/gen_changelog_html.js", (exec, stdout, stderr) => {
        if (stderr) {
            console.error(stderr);
            return;
        }
        fs.writeFileSync("./build/CHANGELOG.html", stdout);
        console.log(`Successfully generated ${path} as HTML and saved to ./build/${path.replace(".md", ".html")}`);
    });
});
