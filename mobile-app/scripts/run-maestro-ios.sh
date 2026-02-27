#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ARTIFACT_DIR="$ROOT_DIR/artifacts"
DEBUG_ROOT="${MAESTRO_DEBUG_ROOT:-$HOME/.maestro/tests/manual-runs}"
MAESTRO_BIN="${MAESTRO_BIN:-$HOME/.maestro/bin/maestro}"
JAVA_BIN="${JAVA_BIN:-/opt/homebrew/opt/openjdk/bin}"

mkdir -p "$ARTIFACT_DIR" "$DEBUG_ROOT"

run_flow() {
  local flow_name="$1"
  local flow_file="$ROOT_DIR/maestro/$flow_name.yaml"
  local timestamp
  timestamp="$(date +%Y%m%d-%H%M%S)"
  local debug_dir="$DEBUG_ROOT/${flow_name}-${timestamp}"
  local output_file="$ARTIFACT_DIR/maestro-${flow_name}.xml"

  mkdir -p "$debug_dir"

  echo "[maestro] running $flow_name"
  PATH="$JAVA_BIN:$PATH" "$MAESTRO_BIN" test "$flow_file" \
    --debug-output "$debug_dir" \
    --format junit \
    --output "$output_file"
}

run_flow "end-user-smoke"
run_flow "notification-toggle"

echo "[maestro] completed all ios flows"
