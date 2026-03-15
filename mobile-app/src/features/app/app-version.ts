import Constants from 'expo-constants';

function readNativeBuildNumber(): string | null {
  const nativeBuildVersion = Constants.nativeBuildVersion;
  if (typeof nativeBuildVersion === 'string' && nativeBuildVersion.trim().length > 0) {
    return nativeBuildVersion.trim();
  }

  const iosBuildNumber = Constants.expoConfig?.ios?.buildNumber;
  if (typeof iosBuildNumber === 'string' && iosBuildNumber.trim().length > 0) {
    return iosBuildNumber.trim();
  }

  const androidVersionCode = Constants.expoConfig?.android?.versionCode;
  if (typeof androidVersionCode === 'number' && Number.isFinite(androidVersionCode)) {
    return `${androidVersionCode}`;
  }

  return null;
}

export function readAppVersion(): { version: string | null; buildNumber: string | null } {
  const nativeVersion = Constants.nativeApplicationVersion;
  const configVersion = Constants.expoConfig?.version;
  const version = (typeof nativeVersion === 'string' && nativeVersion.trim().length > 0
    ? nativeVersion
    : typeof configVersion === 'string' && configVersion.trim().length > 0
      ? configVersion
      : null);

  return {
    version,
    buildNumber: readNativeBuildNumber(),
  };
}

export function getDisplayAppVersion(): string {
  const { version, buildNumber } = readAppVersion();

  if (version && buildNumber) {
    return `Version ${version} (${buildNumber})`;
  }

  if (version) {
    return `Version ${version}`;
  }

  return 'Version unavailable';
}

export function getAppVersionForPayload(): string {
  const { version, buildNumber } = readAppVersion();

  if (version && buildNumber) {
    return `${version} (${buildNumber})`;
  }

  return version ?? 'unknown';
}
