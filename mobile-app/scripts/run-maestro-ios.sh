#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ARTIFACT_DIR="$ROOT_DIR/artifacts"
DEBUG_ROOT="${MAESTRO_DEBUG_ROOT:-$HOME/.maestro/tests/manual-runs}"
MAESTRO_BIN="${MAESTRO_BIN:-$HOME/.maestro/bin/maestro}"
JAVA_BIN="${JAVA_BIN:-/opt/homebrew/opt/openjdk/bin}"
METRO_PORT="${METRO_PORT:-8081}"
METRO_LOG_FILE="$ARTIFACT_DIR/metro.log"
METRO_PID=""

mkdir -p "$ARTIFACT_DIR" "$DEBUG_ROOT"

cleanup() {
  if [[ -n "$METRO_PID" ]] && kill -0 "$METRO_PID" >/dev/null 2>&1; then
    kill "$METRO_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT

start_metro_if_needed() {
  if lsof -nP -iTCP:"$METRO_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "[maestro] metro already running on port $METRO_PORT"
    return
  fi

  echo "[maestro] starting metro bundler on port $METRO_PORT"
  npx expo start --dev-client --host localhost --port "$METRO_PORT" --non-interactive >"$METRO_LOG_FILE" 2>&1 &
  METRO_PID=$!

  local attempts=0
  until grep -q "Waiting on" "$METRO_LOG_FILE" 2>/dev/null; do
    attempts=$((attempts + 1))
    if [[ $attempts -gt 60 ]]; then
      echo "[maestro] metro did not become ready in time"
      tail -n 60 "$METRO_LOG_FILE" || true
      exit 1
    fi

    if ! kill -0 "$METRO_PID" >/dev/null 2>&1; then
      echo "[maestro] metro process terminated unexpectedly"
      tail -n 60 "$METRO_LOG_FILE" || true
      exit 1
    fi

    sleep 1
  done

  echo "[maestro] metro is ready"
}

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

start_metro_if_needed

run_flow "end-user-smoke"
run_flow "notification-toggle"

echo "[maestro] completed all ios flows"
