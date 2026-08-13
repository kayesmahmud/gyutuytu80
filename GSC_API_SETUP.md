# Google Search Console API Setup Guide

## ⚡ Quick Setup (5 minutes)

### Step 1: Create Google Cloud Project & Service Account

1. **Go to Google Cloud Console:**
   ```
   https://console.cloud.google.com/
   ```

2. **Create a new project:**
   - Click project dropdown (top left)
   - Click "NEW PROJECT"
   - Name: `Thulobazaar GSC`
   - Click "CREATE"
   - Wait 30 seconds for project to initialize

3. **Enable Indexing API:**
   - Go to: https://console.cloud.google.com/apis/library/indexing.googleapis.com
   - Click "ENABLE"
   - Wait for API to enable (30 seconds)

4. **Create Service Account:**
   - Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
   - Click "CREATE SERVICE ACCOUNT"
   - **Service account name:** `thulobazaar-gsc`
   - **Description:** `Bulk URL indexing for Thulobazaar`
   - Click "CREATE AND CONTINUE"

5. **Grant Permissions:**
   - **Role:** Select "Editor" (or see advanced below)
   - Click "CONTINUE"
   - Click "CREATE KEY" → "JSON"
   - A JSON file will download automatically
   - Save it as: `~/thulobazaar-gsc-key.json`

### Step 2: Set Environment Variable

```bash
# Add to your shell profile (~/.zshrc or ~/.bash_profile)
export GOOGLE_APPLICATION_CREDENTIALS=~/thulobazaar-gsc-key.json

# Apply immediately
source ~/.zshrc
```

### Step 3: Install Dependencies

```bash
cd /Users/elw/Documents/Web/thulobazaar/monorepo
npm install google-auth-library axios
```

### Step 4: Run the Script

```bash
node scripts/gsc-bulk-indexing.js
```

---

## 🔍 Advanced: Custom IAM Role (More Secure)

If you want to restrict permissions to ONLY indexing (instead of full Editor):

1. Go to: https://console.cloud.google.com/iam-admin/roles
2. Click "CREATE ROLE"
3. **Title:** `GSC Bulk Indexing`
4. **Description:** `Can only submit URLs for indexing`
5. Click "ADD PERMISSIONS"
6. Search for: `indexing.urlNotifications.publish`
7. Select it and click "ADD PERMISSIONS"
8. Click "CREATE"
9. Go back to service account → Edit → Add this custom role

---

## ✅ Verification Checklist

- [ ] Indexing API is enabled in Google Cloud
- [ ] Service account created
- [ ] JSON key downloaded and saved to `~/thulobazaar-gsc-key.json`
- [ ] `GOOGLE_APPLICATION_CREDENTIALS` environment variable set
- [ ] Dependencies installed (`npm install google-auth-library axios`)
- [ ] Script runs without errors

---

## 🚀 What This Script Does

```
1. Reads all 54 URLs from the list
2. Authenticates with Google using service account
3. Submits each URL to Google Indexing API
4. Batches requests (10 at a time) to avoid rate limiting
5. Shows progress in real-time
6. Provides summary report
```

**Result:** All 54 URLs submitted in ~1 minute ⚡

---

## 📊 Expected Timeline

| Time | What Happens |
|------|--------------|
| Now | URLs submitted via API |
| 24 hours | Google begins re-crawling |
| 7 days | Index updates visible in GSC |
| 30 days | Full impact observed |

---

## 🐛 Troubleshooting

### Error: "GOOGLE_APPLICATION_CREDENTIALS not set"
```bash
# Check if variable is set
echo $GOOGLE_APPLICATION_CREDENTIALS

# If empty, run:
export GOOGLE_APPLICATION_CREDENTIALS=~/thulobazaar-gsc-key.json

# Verify
echo $GOOGLE_APPLICATION_CREDENTIALS  # should show path
```

### Error: "Indexing API not enabled"
- Go to: https://console.cloud.google.com/apis/library/indexing.googleapis.com
- Click "ENABLE"

### Error: "Permission denied"
- Go to service account → Edit
- Verify role is "Editor" or has `indexing.urlNotifications.publish` permission

### Error: "URL_UNCHANGED"
- This is expected for URLs already indexed
- Google returns 200 OK — it's a success, not an error

---

## 📚 Documentation

- [Google Indexing API](https://developers.google.com/search/apis/indexing-api/v1/overview)
- [Service Account Setup](https://cloud.google.com/iam/docs/service-accounts-create)
- [Indexing API Quotas](https://developers.google.com/search/apis/indexing-api/v1/quota-pricing)

---

## Next Steps

1. **Complete setup** (5 minutes)
2. **Run script** (1 minute)
3. **Verify in GSC** (24 hours) → Go to Coverage report

**Questions?** Run: `node scripts/gsc-bulk-indexing.js --help`
