# geovisor-backend

## SOS email configuration

SOS alerts send an email notification to `leonsuarez24@gmail.com` by default.

Set these environment variables on the backend before using email notifications:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SOS_ALERT_FROM` optional override for the sender address
- `SOS_ALERT_TO` optional override for the recipient address
- `SOS_ALERT_TIMEZONE` optional, defaults to `America/Bogota`
