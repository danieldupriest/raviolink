# Raviolink

Raviolink is an open source web application for generating short URLS for longer addresses, which forward the user to the linked address, and it also can share text, code, images and other files smaller than 10MB.

## Current Features

-   Shorten long URLs
-   Share plain text or source code with syntax highlighting
-   Share images, which are displayed, or files, which can be downloaded
-   QR code generated for each link
-   Optional expiration date
-   Optional delete on first view/download
-   Optional direct download of content
-   Copy text/code to clipboard
-   IP-based Rate-limiting of successive posts to prevent abuse
-   Scanning files for viruses with ClamAV

## Planned Features

-   Bandwidth monitoring and management on a per-link basis.

## Setup

1. Install ClamAV on the server. On Debian this can be done with `sudo apt-get install clamav`. Note that ClamAV will not run on Google's smallest VM with 512MB of memory. They recommend at least 2 GB of memory, though I am currently running it on a 1.7 GB machine with no problems.
2. Ensure npm is installed and run `npm i` in the root directory of the project
3. Copy `.env.sample` to `.env` and edit to configure

## Development

Run `npm run dev`

## Deployment

Run `node index.js`
