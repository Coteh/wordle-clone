#!/usr/bin/env node

const fs = require('fs');
const marked = require('marked');

const changelog = fs.readFileSync('CHANGELOG.md', 'utf8');

console.log(marked.parse(changelog, (err, html) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
}));
