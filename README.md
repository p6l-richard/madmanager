# Next.js + GCP Storage Upload

This is an example of a Next.js application allowing you to upload photos to a GCP storage bucket.

## Getting Started

**Option 1: Use an existing storage bucket.**

Retrieve your existing project ID, bucket name, and service account email and private key. Provide those values after clicking "Deploy" to automatically set the environment variables.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2Fleerob%2Fnextjs-gcp-storage&env=PROJECT_ID,CLIENT_EMAIL,PRIVATE_KEY,BUCKET_NAME&envDescription=GCP%20bucket%20information%20and%20service%20account.)

**Option 2: Create a new bucket.**

1. Download the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) so you can use the `gcloud` CLI.
1. Inside Google Cloud, create a new project `vision-api-ocr-371414`.
2. Create a new [service account](https://console.cloud.google.com/iam-admin/serviceaccounts) with a role of `Storage Admin`.
   -  Click "Create Key" and save the JSON file.
   - Note: Copy the e-mail of the service account and under `IAM` > `Manage Roles` grant the role `Storage Admin` to the principal with the email of the service account.
3. Create a new Cloud Storage bucket (you need to enable the API first)
4. Run `pnpm i` to install all deps
5.  Run `pnpm dev` to start the Next app at `localhost:3000`.
6.  Choose a `.png` or `.jpg` file.
7.  You should see your file successfully uploaded to the bucket.

## Commands

- `pnpm i` – Installs all deps
- `pnpm dev` – Starts the Next.js app at `localhost:3000`.
