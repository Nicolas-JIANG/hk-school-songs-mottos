# Nginx Deployment

This project is a static website and can be served directly by Nginx. It does not require Node, Python, a database, or a backend application server at runtime.

## Recommended VM Layout

Use the repository root as the web root only with the provided restrictive Nginx config:

```text
/var/www/hk-school-songs-mottos
```

The config allows these public paths:

- `/index.html`
- `/schools.html`
- `/detail.html`
- `/project-report.html`
- `/publications.html`
- `/seminar-videos.html`
- `/about.html`
- `/assets/`
- `/css/`
- `/js/`
- `/data/`

It blocks repository internals such as `.git/`, `docs/`, `scripts/`, `deploy/`, `IT_report/`, Markdown files, Python scripts, shell scripts, and logs.

## First-Time Setup On Ubuntu

```bash
sudo apt update
sudo apt install nginx git -y
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/Nicolas-JIANG/hk-school-songs-mottos.git
sudo chown -R www-data:www-data /var/www/hk-school-songs-mottos
```

Install the Nginx site config:

```bash
sudo cp /var/www/hk-school-songs-mottos/deploy/nginx/hk-school-songs-mottos.conf /etc/nginx/sites-available/hk-school-songs-mottos
sudo ln -sfn /etc/nginx/sites-available/hk-school-songs-mottos /etc/nginx/sites-enabled/hk-school-songs-mottos
sudo nginx -t
sudo systemctl reload nginx
```

The config is prepared for:

```nginx
server_name mottoanthem.eduhk.hk mottoanthem.ied.edu.hk;
```

If IT uses a different domain, update `server_name` before reloading Nginx.

## HTTPS Certificate Paths

The IT email exchange confirms that the SSL certificate and private key were generated/imported into:

```text
/etc/nginx/ssl
```

The exact filenames were not stated in the email. Check them on the VM before reloading Nginx:

```bash
sudo ls -l /etc/nginx/ssl
```

The config currently expects:

```nginx
ssl_certificate /etc/nginx/ssl/mottoanthem.eduhk.hk.crt;
ssl_certificate_key /etc/nginx/ssl/mottoanthem.eduhk.hk.key;
```

If the filenames differ, update only the filenames in the config and run:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Security Scan Remediation

The Nginx config remediates these scanner findings by configuration:

- HSTS missing: adds `Strict-Transport-Security: max-age=31536000` on HTTPS responses.
- Weak TLS cipher suites: allows TLS 1.2/1.3 and only AEAD cipher suites for TLS 1.2.
- CSP missing: adds a restrictive `Content-Security-Policy` compatible with local static files and Google Drive video preview iframes.
- COOP missing: adds `Cross-Origin-Opener-Policy: same-origin`.
- COEP missing: adds `Cross-Origin-Embedder-Policy: credentialless` to reduce breakage risk for Google Drive embeds.
- Permissions-Policy missing: disables unnecessary browser APIs.
- X-Content-Type-Options missing: adds `X-Content-Type-Options: nosniff`.

The Nessus finding `nginx 1.3.0 < 1.28.2 / 1.29.x < 1.29.5 SSL Upstream Injection` cannot be fixed by website files alone. IT must upgrade the VM's Nginx package to a fixed version, at least:

```text
nginx 1.28.2 or later, or nginx 1.29.5 or later
```

After upgrading, verify:

```bash
nginx -v
sudo nginx -t
sudo systemctl reload nginx
```

## Header Verification

From a machine that can reach the internal site:

```bash
curl -I https://mottoanthem.eduhk.hk/
curl -I https://mottoanthem.eduhk.hk/schools.html
curl -I https://mottoanthem.eduhk.hk/data/schools.js
```

Expected important headers include:

```text
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: ...
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: credentialless
Permissions-Policy: ...
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
```

## Updating The Website

```bash
cd /var/www/hk-school-songs-mottos
sudo git pull origin main
sudo chown -R www-data:www-data /var/www/hk-school-songs-mottos
sudo nginx -t
sudo systemctl reload nginx
```

## Re-Scan Request

After applying the config and upgrading Nginx, ask IT to re-run the vulnerability scan for:

```text
https://mottoanthem.eduhk.hk/
```
