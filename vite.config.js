# 🏙️ Kohat City Streets — GTA-Style Android Game

A top-down open-world GTA-style game set in **Kohat City**, Pakistan. Built with React + Canvas, packaged as an Android APK via Capacitor.

---

## 📱 How to Get the APK

### Option A — Automatic via GitHub Actions (Recommended)

1. **Fork or push this repo to GitHub**
2. Go to your repo → **Actions** tab
3. Click `Build Kohat GTA APK` → **Run workflow**
4. Wait ~5 minutes for the build
5. Download the APK from **Artifacts** section at the bottom of the run

### Option B — Tag a Release

```bash
git tag v1.0.0
git push origin v1.0.0
```
GitHub Actions will build and attach the APK to a GitHub Release automatically.

---

## 🛠️ Local Development

### Prerequisites
- Node.js 20+
- Android Studio (for local builds)
- Java 17+

### Run in browser
```bash
npm install
npm run dev
```

### Build APK locally
```bash
npm install
npm run build
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
# APK → android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🎮 Game Features

| Feature | Detail |
|---|---|
| 🗺️ Map | 3200×2400 Kohat City layout |
| 🏰 Landmarks | Kohat Fort, Jama Masjid, DHQ Hospital, Airport, Cadet College, Cantt |
| 🚗 Vehicles | 70 NPC cars + 2 police cars |
| ⭐ Wanted System | 5-star police chase |
| 💰 Economy | Earn ₨ Rupees by driving |
| 📱 Touch | On-screen D-pad + F button |

### Controls
| Input | Action |
|---|---|
| D-pad / WASD | Move on foot / Steer car |
| F button | Enter / Exit vehicle |
| Drive fast | Earn money |

---

## 🏗️ Tech Stack

- **React 18** + Canvas API — game rendering
- **Vite** — bundler
- **Capacitor 6** — web → native Android bridge
- **GitHub Actions** — automated APK builds

---

## 📲 Install on Android Phone

1. Download `app-debug.apk` from Actions → Artifacts
2. Transfer to phone (or open download link on phone)
3. Go to **Settings → Security → Install unknown apps** → allow your browser
4. Tap the APK to install
5. Launch **Kohat City Streets** 🎮
