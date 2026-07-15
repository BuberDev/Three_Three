#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-three-three-480815}"
REGION="${REGION:-europe-west1}"
SERVICE_NAME="${SERVICE_NAME:-three-three-api}"
ENV_FILE="${ENV_FILE:-api/cloudrun.env.yaml}"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud CLI is not installed." >&2
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}." >&2
  echo "Create it from api/cloudrun.env.example.yaml and fill production values first." >&2
  exit 1
fi

if ! gcloud projects describe "${PROJECT_ID}" >/dev/null 2>&1; then
  echo "Cannot access Google Cloud project: ${PROJECT_ID}" >&2
  exit 1
fi

BILLING_ENABLED="$(
  gcloud billing projects describe "${PROJECT_ID}" \
    --format='value(billingEnabled)' 2>/dev/null || true
)"

if [[ "${BILLING_ENABLED}" != "True" && "${BILLING_ENABLED}" != "true" ]]; then
  echo "Billing is not enabled for project ${PROJECT_ID}." >&2
  echo "Cloud Run requires an active billing account even when usage stays inside the free tier." >&2
  exit 1
fi

gcloud config set project "${PROJECT_ID}"
gcloud config set run/region "${REGION}"

gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  --project "${PROJECT_ID}"

gcloud run deploy "${SERVICE_NAME}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --source api \
  --allow-unauthenticated \
  --port 3000 \
  --cpu 1 \
  --memory 1Gi \
  --concurrency 20 \
  --timeout 300 \
  --min-instances 0 \
  --max-instances 2 \
  --env-vars-file "${ENV_FILE}"

