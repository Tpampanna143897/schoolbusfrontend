# Google Maps API Key Fix for APK

The "White Screen" or "Blank Map" issue in your APK is because Google Maps blocks requests from your APK unless you add your app's **SHA-1 Fingerprint** to the Cloud Console.

## Steps to Fix

1.  **Get your SHA-1 Fingerprint**
    If you are using EAS Build, run:
    ```bash
    eas credentials
    ```
    - Select `Android`.
    - Select your build profile (e.g., `production`).
    - Look for **SHA-1 Fingerprint**. Copy it.

2.  **Update Google Cloud Console**
    - Go to [Google Cloud Console](https://console.cloud.google.com/).
    - Select your project.
    - Go to **APIs & Services > Credentials**.
    - Click on your **Android Key** (the one you used in `app.json`).
    - Under **Application restrictions**, select **Android apps**.
    - Click **ADD AN ITEM**.
    - **Package name**: `com.schoolbus.frontend` (Make sure this matches `app.json` -> `android.package`).
    - **SHA-1 certificate fingerprint**: Paste the SHA-1 you copied in Step 1.
    - Click **SAVE**.

3.  **Rebuild is NOT Required**
    - You do NOT need to rebuild the APK if you only change settings in Google Cloud. It should start working within 5-10 minutes.

## Troubleshooting
- If it still doesn't work, try adding the **SHA-1** from your local keystore as well (if you build locally).
- Ensure "Maps SDK for Android" is **ENABLED** in "APIs & Services > Library".
