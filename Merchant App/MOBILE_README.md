# Mobile Wrapper Setup (Capacitor)

This repository hosts the Merchant web app; the steps below show how to wrap it as a standalone Android/iOS application using [Capacitor](https://capacitorjs.com/).

> These instructions assume you are working from the `Merchant App` folder and have Node/npm installed.

## 1. Install Capacitor

```bash
cd "d:/Vibing/Food Suite/Merchant App"
npm install --save @capacitor/core @capacitor/cli
```

You may also install the command-line tools globally if desired:

```bash
npm install -g @capacitor/cli
```

## 2. Initialize Capacitor config

Run the helper script or execute manually:

```bash
npm run cap:init
```

The command above will prompt for an app name and package id (e.g. `com.yourdomain.merchantapp`).
It also sets the web directory to the Vite `dist` output.

Alternatively:

```bash
npx cap init MerchantApp com.yourdomain.merchantapp --web-dir=dist
```

## 3. Build the web content

Every time you make changes to the React/TypeScript code, rebuild for production:

```bash
npm run build:web     # creates `dist/` folder
```

## 4. Add platforms

Add Android (and iOS if you have a Mac):

```bash
npm run cap:add-android
# npm run cap:add-ios   # Mac only
```

## 5. Sync after each web build

Copy the latest web assets into the native project:

```bash
npm run cap:sync
```

## 6. Open the native project

```bash
npm run cap:open-android
# opens Android Studio; you can build/emulate/assemble APK from there
```

For iOS use `npm run cap:open-ios` (requires Xcode).

## 7. Side‑load on a device

In Android Studio choose **Build > Build Bundle(s) / APK(s) > Build APK(s)**. The resulting `.apk` can be transferred to your phone and installed (enable `Install unknown apps` under Settings).

For iOS you must sign with a provisioning profile; use Xcode to deploy to a registered device.

## 8. Rebuilding workflow

- Edit web code
- `npm run build:web`
- `npm run cap:sync`
- `npm run cap:open-android` (or use `npx cap open android` once and then use `Gradle` if preferred)

### Web debugging

During development you can run `npm run cap:serve` which launches a local web server inside the native wrapper. Useful for quick testing without rebuilding every time.

---

### Alternative: Progressive Web App (PWA)

If you only need a "downloadable" app without native features, consider converting the web project into a PWA. Vite can generate a service worker via `@vitejs/plugin-pwa`. The merchant site can then be added to a home screen directly from the browser.

This README is intentionally kept simple; consult the [Capacitor documentation](https://capacitorjs.com/docs) for advanced topics (plugins, permissions, push notifications, etc.).