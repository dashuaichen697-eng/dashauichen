#!/usr/bin/env bash
set -euo pipefail

governance_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
preflight="$governance_root/governance/preflight.sh"
fixture_root="$(mktemp -d "${TMPDIR:-/tmp}/project-preflight.XXXXXX")"
trap 'rm -rf "$fixture_root"' EXIT

make_fixture() {
  local project_dir="$1"
  local package_name="$2"
  local remote_name="$3"
  local vercel_name="$4"

  mkdir -p "$project_dir/src" "$project_dir/public" "$project_dir/.vercel"
  printf '{"name":"%s"}\n' "$package_name" > "$project_dir/package.json"
  touch "$project_dir/README.md" "$project_dir/.env.example" \
    "$project_dir/deployment.md" "$project_dir/changelog.md"
  printf '{"projectName":"%s","projectId":"test-id","orgId":"test-org"}\n' \
    "$vercel_name" > "$project_dir/.vercel/project.json"
  cat > "$project_dir/.project-contract.env" <<EOF
PROJECT_NAME=michael-valid-app
GITHUB_REPOSITORY=michael-valid-app
VERCEL_PROJECT=michael-valid-app
PRODUCTION_DOMAIN=michael-valid-app.vercel.app
EOF
  git -C "$project_dir" init -q -b main
  git -C "$project_dir" remote add origin "https://github.com/example/$remote_name.git"
}

expect_success() {
  local label="$1"
  shift
  if ! "$@" > "$fixture_root/output.log" 2>&1; then
    echo "FAIL: $label should succeed"
    cat "$fixture_root/output.log"
    exit 1
  fi
}

expect_failure() {
  local label="$1"
  shift
  if "$@" > "$fixture_root/output.log" 2>&1; then
    echo "FAIL: $label should fail"
    cat "$fixture_root/output.log"
    exit 1
  fi
}

valid="$fixture_root/valid/michael-valid-app"
make_fixture "$valid" michael-valid-app michael-valid-app michael-valid-app
expect_success "matching identities" bash "$preflight" "$valid" production

bad_package="$fixture_root/bad-package/michael-valid-app"
make_fixture "$bad_package" wrong-package michael-valid-app michael-valid-app
expect_failure "package mismatch" bash "$preflight" "$bad_package" development

bad_remote="$fixture_root/bad-remote/michael-valid-app"
make_fixture "$bad_remote" michael-valid-app wrong-remote michael-valid-app
expect_failure "remote mismatch" bash "$preflight" "$bad_remote" preview

bad_vercel="$fixture_root/bad-vercel/michael-valid-app"
make_fixture "$bad_vercel" michael-valid-app michael-valid-app wrong-vercel
expect_failure "Vercel mismatch" bash "$preflight" "$bad_vercel" production

if rg -n 'SECRET|TOKEN|PASSWORD|KEY=' "$fixture_root/output.log" >/dev/null 2>&1; then
  echo "FAIL: preflight output exposed a secret-like value"
  exit 1
fi

echo "PASS: project preflight validation"
