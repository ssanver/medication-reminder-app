#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
IOS_DIR="$ROOT_DIR/mobile-app/ios"
ARCHIVE_PATH="$IOS_DIR/build-archive/PillMind.xcarchive"
EXPORT_DIR="$IOS_DIR/build-export"
IPA_SOURCE="$EXPORT_DIR/PillMind.ipa"
IPA_TARGET="$ROOT_DIR/qr/MedicationReminder.ipa"
VERIFY_TMP="$(mktemp -d)"

cleanup() {
  rm -rf "$VERIFY_TMP"
}
trap cleanup EXIT

echo "[1/4] iOS archive (Release)"
xcodebuild \
  -workspace "$IOS_DIR/PillMind.xcworkspace" \
  -scheme PillMind \
  -configuration Release \
  -destination generic/platform=iOS \
  -archivePath "$ARCHIVE_PATH" \
  -allowProvisioningUpdates \
  archive

echo "[2/4] IPA export (debugging)"
rm -rf "$EXPORT_DIR"
xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportOptionsPlist "$IOS_DIR/ExportOptions-debugging.plist" \
  -exportPath "$EXPORT_DIR" \
  -allowProvisioningUpdates

if [[ ! -f "$IPA_SOURCE" ]]; then
  echo "HATA: IPA bulunamadı: $IPA_SOURCE" >&2
  exit 1
fi

echo "[3/4] main.jsbundle doğrulaması"
unzip -q "$IPA_SOURCE" -d "$VERIFY_TMP"
APP_DIR="$(find "$VERIFY_TMP/Payload" -maxdepth 2 -type d -name "*.app" | head -n 1)"
if [[ -z "${APP_DIR:-}" ]]; then
  echo "HATA: IPA içinde .app paketi bulunamadı." >&2
  exit 1
fi
if [[ ! -f "$APP_DIR/main.jsbundle" ]]; then
  echo "HATA: IPA içinde main.jsbundle yok. Release paket beyaz ekranda kalabilir." >&2
  exit 1
fi

echo "[4/4] QR dağıtım dosyası güncelleme"
mkdir -p "$(dirname "$IPA_TARGET")"
cp -f "$IPA_SOURCE" "$IPA_TARGET"

echo "Tamamlandı:"
echo "  Kaynak IPA : $IPA_SOURCE"
echo "  Hedef IPA  : $IPA_TARGET"
echo "  Boyut (B)  : $(stat -f '%z' "$IPA_TARGET")"
