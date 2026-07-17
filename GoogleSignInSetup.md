# Google Sign-In — one-time setup (10 minutes)

All the code is already wired (app button → native Google picker → id token →
`POST /api/auth/google` → account created/signed in). It stays dormant until you
create OAuth client IDs and paste them in — these are tied to YOUR Google account,
so only you can do this part.

## 1. Google Cloud console

1. Go to https://console.cloud.google.com → create (or pick) a project, e.g. `HealingSathi`.
2. **APIs & Services → OAuth consent screen** → External → fill in app name + your
   email → add yourself as a test user → save. (Publishing can wait.)
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**, three times:

   | Type | Fields | Used by |
   |---|---|---|
   | **Web application** | no redirect URIs needed | app's `webClientId` **and** the backend's token audience |
   | **iOS** | Bundle ID: `org.reactjs.native.example.AwesomeProject` (check in Xcode → target → General) | iOS native flow |
   | **Android** | Package name: `com.awesomeproject` (see `android/app/build.gradle`) + SHA-1 | Android native flow |

   Get the debug SHA-1 for the Android one:
   ```bash
   keytool -list -v -alias androiddebugkey -keystore ~/.android/debug.keystore -storepass android | grep SHA1
   ```

## 2. Paste the IDs

- **App** — `src/api/config.ts`:
  ```ts
  export const GOOGLE_WEB_CLIENT_ID = "1234…xyz.apps.googleusercontent.com";  // the WEB one
  export const GOOGLE_IOS_CLIENT_ID = "1234…abc.apps.googleusercontent.com";  // the iOS one
  ```
- **Backend** — `HealingSathiBackend/.env`:
  ```
  GOOGLE_CLIENT_IDS=<web-client-id>,<ios-client-id>
  ```

## 3. iOS URL scheme

Xcode → AwesomeProject target → Info → URL Types → add one with the **reversed iOS
client ID** as the scheme (it looks like `com.googleusercontent.apps.1234-abc`).
Or add to `ios/AwesomeProject/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.googleusercontent.apps.REVERSED-IOS-CLIENT-ID</string>
    </array>
  </dict>
</array>
```

## 4. Rebuild & test

```bash
# pods are already installed; native modules need a full rebuild (not just Metro reload)
npm run ios      # or: npm run android
```

Tap **Google** on the auth screen → pick your account → you're in. First-time Google
users get an account created automatically (they can add a password later via
"Forgot password" if they ever want email+password sign-in).

Until step 2 is done, the Google button shows "Google sign-in isn't set up yet" and
the backend answers 501 — nothing crashes.
