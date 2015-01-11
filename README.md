Proofreader
===========

Proofreader takes a website, or a local file, and tries to proofread it using [write-good](https://github.com/btford/write-good) and [nodehun](https://github.com/nathanjsweet/nodehun).

Notes:
- optimized for [Chrome DevTools docs](https://github.com/GoogleChrome/devtools-docs)
- optimized for HTML and Markdown
- optimized for English
- does not process all the tags, only whitelisted ones (e.g. P, LI, H1, H2, H3)

## Installation
    npm install proofreader -g

## Examples

    proofreader -u https://raw.githubusercontent.com/GoogleChrome/devtools-docs/master/docs/memory-analysis-101.html
    proofreader -f ../devtools-docs/docs/commandline-api.md
    proofreader -l list-of-files.txt

Output:
![Console output](https://i.imgur.com/IfUw2W9.png)

- red sentences have issues, green sentences don't
- blue suggestions come from write-good
- magenta suggestions come from nodehun
