# Pilot and deployment guide

## Local evaluation

Run both development servers, use the fictional demo accounts, and review the features with ICT. Confirm that the existing ERP does not already provide an adequate equivalent workflow. Agree the device identifiers, priority targets, user responsibilities, and knowledge review process.

## Small pilot

Use a separate database without demonstration records. Create role groups with `setup_roles`, create a trusted administrator with `createsuperuser`, and provision real users through Django admin. Run a limited pilot using the company's agreed hosting and data-handling practices. Retain measurable outcomes and feedback.

## Deployment shape

Serve the built `frontend/dist` files and reverse proxy `/api/` to Django under one HTTPS origin. Serve `/admin/` for trusted administrators and collected `/static/` files for admin assets. Use a process manager and Gunicorn or a suitable Windows-compatible WSGI server; do not use Django's development server for a production service.

Build and collect assets:

```bash
cd frontend
npm ci
npm run build
cd ../backend
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py check --deploy
# Linux server example, with the hosting environment already configured:
gunicorn config.wsgi:application --bind 127.0.0.1:8000
```

Set these environment values for deployment:

- `DJANGO_DEBUG=false`
- `DJANGO_SECRET_KEY`: a unique, long random secret.
- `DJANGO_ALLOWED_HOSTS`: the exact configured hostnames.
- `DJANGO_CSRF_TRUSTED_ORIGINS`: the exact HTTPS app origin.
- `PUBLIC_APP_URL`: the HTTPS app origin used in printed QR codes.
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`: if using PostgreSQL.

This project does not automatically read `.env` files. Configure the values in the process environment or add a reviewed environment loader. Configure HTTPS redirects, secure proxy handling, backups, recovery testing, and shared rate limiting in the hosting environment. Cookie security is enabled when debug is false. Configure proxy HTTPS headers only if that proxy is trusted and strips spoofed client values.

The current login limiter is process-local and counts failures by the directly observed IP. A reverse proxy may make all callers appear as one IP, so replace this with a properly configured shared/proxy limiter before a multiuser deployment. API collections currently return all matching records; add pagination when the pilot's data volume warrants it.

## QR labels on a phone

The default URL is `http://localhost:5173`, suitable only on the computer running the app. For a supervised LAN demonstration, configure the app's reachable LAN URL, allowed hosts, trusted origin, server binding, and firewall according to ICT instructions. Restart Django after changing `PUBLIC_APP_URL`; regenerate the labels. In a deployment, use the stable HTTPS origin.

Scanning a QR code opens the app with an asset identifier. The user must sign in. The request form then selects that active asset; the QR is not a login credential and does not expose its full history publicly.

## Handover checklist

- Source repository and deployment configuration owner.
- User provisioning and password-reset procedure through trusted admin.
- Agreed priority targets and maintenance responsibilities.
- Knowledge review owner and guide update cadence.
- Database backup and tested recovery procedure.
- Named person responsible for updates and incident response.
- Documented limits and outstanding work.

## Future work after pilot feedback

Ticket attachments with authenticated storage, notifications via an approved channel, date-filtered reporting, pagination, company SSO, richer asset lifecycle fields, supported ERP integration, and a formal guide approval workflow. Do not add these solely to enlarge the project; prioritise observed needs.
