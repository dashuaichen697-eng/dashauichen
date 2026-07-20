#!/usr/bin/env bash
set -uo pipefail

usage() {
  echo "Usage: $0 <project-directory> [development|preview|production]" >&2
  exit 2
}

[[ $# -ge 1 && $# -le 2 ]] || usage

project_dir="$1"
deploy_env="${2:-development}"
case "$deploy_env" in
  development|preview|production) ;;
  *) echo "FAIL environment: $deploy_env" >&2; exit 2 ;;
esac

[[ -d "$project_dir" ]] || { echo "FAIL directory: $project_dir" >&2; exit 1; }
project_dir="$(cd "$project_dir" && pwd -P)"
contract="$project_dir/.project-contract.env"

[[ -f "$contract" ]] || { echo "FAIL missing: .project-contract.env" >&2; exit 1; }

PROJECT_NAME=""
GITHUB_REPOSITORY=""
VERCEL_PROJECT=""
PRODUCTION_DOMAIN=""

while IFS='=' read -r key value; do
  case "$key" in
    PROJECT_NAME) PROJECT_NAME="$value" ;;
    GITHUB_REPOSITORY) GITHUB_REPOSITORY="$value" ;;
    VERCEL_PROJECT) VERCEL_PROJECT="$value" ;;
    PRODUCTION_DOMAIN) PRODUCTION_DOMAIN="$value" ;;
  esac
done < "$contract"

failures=0
pass() { echo "PASS $1: $2"; }
fail() { echo "FAIL $1: $2" >&2; failures=$((failures + 1)); }

for key in PROJECT_NAME GITHUB_REPOSITORY VERCEL_PROJECT PRODUCTION_DOMAIN; do
  value="${!key}"
  [[ -n "$value" ]] || fail contract "missing $key"
done

directory_name="$(basename "$project_dir")"
[[ "$directory_name" == "$PROJECT_NAME" ]] \
  && pass directory "$directory_name" \
  || fail directory "expected $PROJECT_NAME, found $directory_name"

for required in src public package.json README.md .env.example deployment.md changelog.md; do
  [[ -e "$project_dir/$required" ]] \
    && pass required "$required" \
    || fail required "missing $required"
done

if [[ -f "$project_dir/package.json" ]]; then
  package_name="$(node -e 'const p=require(process.argv[1]); process.stdout.write(p.name || "")' "$project_dir/package.json" 2>/dev/null || true)"
  [[ "$package_name" == "$PROJECT_NAME" ]] \
    && pass package "$package_name" \
    || fail package "expected $PROJECT_NAME, found ${package_name:-<empty>}"
fi

if git -C "$project_dir" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git_root="$(git -C "$project_dir" rev-parse --show-toplevel 2>/dev/null || true)"
  if [[ "$git_root" != "$project_dir" ]]; then
    fail git-root "expected $project_dir, found $git_root"
  else
    pass git-root "$directory_name"
  fi
  remote_url="$(git -C "$project_dir" remote get-url origin 2>/dev/null || true)"
  remote_repo="${remote_url##*/}"
  remote_repo="${remote_repo%.git}"
  [[ "$remote_repo" == "$GITHUB_REPOSITORY" ]] \
    && pass github "$remote_repo" \
    || fail github "expected $GITHUB_REPOSITORY, found ${remote_repo:-<missing>}"
else
  fail git-root "not a Git repository"
fi

vercel_file="$project_dir/.vercel/project.json"
if [[ -f "$vercel_file" ]]; then
  vercel_name="$(node -e 'const p=require(process.argv[1]); process.stdout.write(p.projectName || "")' "$vercel_file" 2>/dev/null || true)"
  [[ "$vercel_name" == "$VERCEL_PROJECT" ]] \
    && pass vercel "$vercel_name" \
    || fail vercel "expected $VERCEL_PROJECT, found ${vercel_name:-<empty>}"
else
  fail vercel "project is not linked"
fi

pass environment "$deploy_env"
[[ $failures -eq 0 ]]
