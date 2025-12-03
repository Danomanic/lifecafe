# Adding DigitalOcean CA Certificate for Deployment

This guide explains how to add the DigitalOcean database CA certificate to your App Platform deployment.

## Why This Is Needed

DigitalOcean Managed Databases require SSL connections with a CA certificate for security. Since App Platform doesn't allow uploading files directly, you need to provide the certificate content as an environment variable.

## Step-by-Step Guide

### 1. Get the Certificate Content

The `db-ca-certificate.crt` file is in your project root. You need to convert it to a single-line format for the environment variable.

**Option A: View and Copy Manually**
```bash
cat db-ca-certificate.crt
```

Copy the entire output, including the `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----` lines.

**Option B: Copy to Clipboard (macOS)**
```bash
cat db-ca-certificate.crt | pbcopy
```

**Option C: Copy to Clipboard (Linux with xclip)**
```bash
cat db-ca-certificate.crt | xclip -selection clipboard
```

### 2. Add to DigitalOcean App Platform

1. Go to your App Platform app
2. Navigate to **Settings** → **App-Level Environment Variables**
3. Click **Edit** or **Add Variable**
4. Add a new environment variable:
   - **Key:** `DATABASE_CA_CERT`
   - **Value:** Paste the entire certificate content (including BEGIN/END lines)
   - **Scope:** Check both "build" and "runtime" ✓
   - **Encrypt:** ✓ (recommended)
5. Click **Save**

### 3. Verify Environment Variables

Your app should now have these environment variables set:

```
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
DATABASE_CA_CERT=-----BEGIN CERTIFICATE-----
MIIEQTCCAqmgAwIBAgIUD...
(rest of certificate content)
-----END CERTIFICATE-----
```

### 4. Deploy

1. Push your code changes to Git (if not already done)
2. DigitalOcean will automatically redeploy
3. Or manually trigger a deployment from the App Platform dashboard

### 5. Verify Connection

After deployment:

1. Check your app logs in DigitalOcean App Platform
2. Look for these log messages:
   ```
   SSL certificate loaded from environment variable
   PostgreSQL connection initialized (SSL: enabled)
   Database initialized successfully (PostgreSQL)
   ```
3. If you see these messages, your SSL connection is working correctly

## Troubleshooting

### Certificate Not Loading

**Check the logs for:**
```
Failed to load SSL certificate: [error message]
```

**Common fixes:**
- Ensure the certificate content includes BEGIN and END lines
- Check that there are no extra spaces or newlines at the beginning/end
- Verify the environment variable name is exactly `DATABASE_CA_CERT`

### Connection Still Failing

1. Verify your `DATABASE_URL` includes `?sslmode=require`
2. Check DigitalOcean database "Trusted Sources" includes your app
3. Ensure the database is running and accessible
4. Check for typos in the connection string

### Still Seeing "self-signed certificate" Errors

If you still see certificate errors after adding the CA cert:

1. Double-check the certificate content is complete
2. Try downloading the certificate again from DigitalOcean
3. Ensure there are no encoding issues (should be UTF-8)
4. Check that the certificate hasn't expired

## Alternative: No Certificate File

If you don't have the certificate file locally, you can:

1. Download it from DigitalOcean:
   - Go to your database → Connection Details
   - Click "Download CA Certificate"
2. Or use the built-in `rejectUnauthorized: false` mode:
   - The app will still connect but with less security validation
   - Not recommended for production, but works if you can't get the certificate

## Security Notes

- The certificate file (`db-ca-certificate.crt`) is excluded from git via `.gitignore`
- Never commit certificates to public repositories
- The environment variable is encrypted by DigitalOcean when you check the "Encrypt" option
- The certificate content is safe to store as an environment variable as it's a public certificate (not a private key)
