Proofreader
===========

Proofreader takes a website, or a local file, and tries to proofread it using [write-good](https://github.com/btford/write-good) and [nodehun](https://github.com/nathanjsweet/nodehun).

## Installation
    npm install proofreader -g

## Examples

    proofreader -u https://raw.githubusercontent.com/GoogleChrome/devtools-docs/master/docs/memory-analysis-101.html
    proofreader -f ../devtools-docs/docs/commandline-api.md
    proofreader -l list-of-files.txt
    proofreader -c custom-config.json -f file.html

Output:
![Console output](https://i.imgur.com/IfUw2W9.png)

- blue suggestions come from write-good
- magenta suggestions come from nodehun

## Options
Proofreader can handle both HTML and Markdown files. It distinguishes between these two using MIME types.

### --url (-u)
Downloads and processes single remote file from given URL.

### --file (-f)
Processes single local file from given path.

### --file-list (-l)
Processes all sources listed in the provided file. Sample list file:

```
../docs/file.html
/home/developer/otherfile.md
http://localhost/remote-file.md
```

### --config-file (-c)
Path to a custom configuration file (default one is in `settings.json`). This file has to be a valid JSON. Sample configuration:

```
{
  "dictionaries": {
    "build-in": ["en_US", "en_GB"],
    "custom": ["devtools-docs.dic"]
  },
  "selectors": {
    "whitelist": "p, li, h1, h2, h3, h4, th, td, dl, figcaption",
    "blacklist": "pre, code"
  }
}
```

- **dictionaries**
  - **build-in** - one or two of build in dictionaries (`eng_GB`, `eng_US`). E.g. when both American English and British English are allowed, `["en_US", "en_GB"]` should be specified.
  - **custom** - list of custom dictionaries
- **selectors**
  - **whitelist** - CSS selector that specifies all elements that should be processed. This also applies to Markdown which is compiled to HTML before processing.
  - **blacklist** - All elements that match this CSS selector will be *removed* before proofreading.

## Notes
Please note that this project was:

- optimized for [Chrome DevTools docs](https://github.com/GoogleChrome/devtools-docs)
- optimized for HTML and Markdown
- optimized for English
- by default does not process all the tags, only whitelisted ones (e.g. P, LI, H1, H2, H3)
