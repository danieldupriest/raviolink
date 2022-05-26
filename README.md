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

## Planned Features

-   Bandwidth monitoring and management on a per-link basis.

## Setup

1. Run `npm i`
2. Copy `.env.sample` to `.env` and edit to configure

## Development

Run `npm run dev`

## Deployment

Run `node index.js`
