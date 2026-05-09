# HWC Photo Log — Mobile (Expo)

Field capture companion for the HWC Photo Log system.

## Quick start

```bash
cd apps/mobile
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone.

## Environment

Copy `.env` and set your API URL:

```
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8000
```

Use your machine's LAN IP — `localhost` won't work on a physical device.

## Screens

| Route | Purpose |
|-------|---------|
| `/` | Photo list with tag filtering, pull-to-refresh |
| `/capture` | Camera / gallery → add notes → upload |
| `/photo/[id]` | View full photo, edit description & tags |
