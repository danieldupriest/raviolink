# Raviolink

Raviolink is an open source web application for generating short URLS for longer addresses, which forward the user to the linked address, and it also can share text, code, images and other files smaller than 10MB.

## Current Features

-   Support for persistent and temporary on-disk sqlite databases, as well as in-memory
-   Shorten long URLs
-   Share plain text or source code with syntax highlighting
-   Share images, which are displayed, or files, which can be downloaded
-   QR code generated for each link
-   Optional expiration date
-   Optional delete on first view/download
-   Optional direct download of content
-   Copy text/code to clipboard
-   Uploader IP tracking
-   IP-based Rate-limiting of successive posts to prevent abuse
-   Scanning files for viruses with ClamAV
-   Cached image resizing

## Planned Features

-   Bandwidth monitoring and management on a per-link basis.
-   Conversion to TypeScript

## Setup

1. Clone repository: `git clone https://github.com/danieldupriest/raviolink.git`
2. Change into new directory `cd raviolink`
3. Install ClamAV on the server. On Debian this can be done with `sudo apt-get install clamav`. Note that ClamAV will not run on Google's smallest VM with 512MB of memory. They recommend at least 2 GB of memory, though I am currently running it on a 1.7 GB machine with no problems.
4. Ensure npm is installed and run `npm i` in the root directory of the project
5. Copy `.env.sample` to `.env` and edit to configure. Note that linux will not allow node to run the app on a port number lower than 1024, so you must choose a higher number, like 8080.

## Development

1. Edit `.env` and set `NODE_ENV` to `development`.
2. Run `npm run dev` to start the app.

## Deployment

Ensure the above Setup steps are complete.

### Setting up nginx for reverse proxy

In order to connect our internal node app running on a high port to a typical http/https port, we will need to set up a reverse proxy. The following are steps for using nginx to accomplish this.

1. Ensure your VM has port 80 open to connections.
2. Install nginx `sudo apt-get install nginx`
3. Edit `/etc/nginx/sites-available/default` to create proxy server. Adjust `client_max_body_size` to limit file upload size, and change port to match your application's port:

```
server {
    server_name mydomain.com;
    client_max_body_size 10M;
    location / {
        proxy_set_header    X-Forwarded-For $remote_addr;
        proxy_set_header    Host $http_host;
        proxy_pass  "http://127.0.0.1:8080"
    }
}
```

4. Restart nginx `sudo service nginx restart`;

Your application should now be available at the external address, port 80. The following steps are necessary if you wish to serve via https.

### Using certbot to configure https

You can take the following steps to create a custom https certificate for your domain using Let's Encrypt's certbot.

1. Ensure your MV has port 443 open to connections.
2. Install certbot and nginx plugin `sudo apt-get install certbot python3-certbot-nginx`.
3. Run certbot `sudo certbot --nginx`.
4. Follow instructions.

Your application should now be accessible via https.

### Running the app

1. Edit `.env` to set NODE_ENV to `production`.
2. Run `npm run serve` to start the app.
