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

It blocks repository internals such as `.git/`, `docs/`, `scripts/`, `deploy/`, Markdown files, Python scripts, shell scripts, and logs.

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

If IT gives you a domain, edit this line in the config before reloading Nginx:

```nginx
server_name your-domain.example.edu.hk;
```

## Updating The Website

```bash
cd /var/www/hk-school-songs-mottos
sudo git pull origin main
sudo chown -R www-data:www-data /var/www/hk-school-songs-mottos
sudo nginx -t
sudo systemctl reload nginx
```

## HTTPS

For an institutional VM, ask IT whether HTTPS should be handled by their reverse proxy/load balancer or by the VM itself. If handled on the VM and the domain is public, use Certbot/Let's Encrypt after DNS points to the VM.
