import { createClient } from "next-sanity";

const config = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "build-placeholder",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2024-01-01",
  useCdn: false,
};

// Reads use a server-only Viewer token so the Sanity dataset can be set to
// PRIVATE. While the dataset is public, anyone can take the project ID from the
// browser bundle and query gallery, video and photo-submission documents
// directly from Sanity's API, bypassing the family gate entirely.
// SANITY_READ_TOKEN has no NEXT_PUBLIC_ prefix, so it never reaches the browser.
export const sanityClient = createClient({
  ...config,
  token: process.env.SANITY_READ_TOKEN,
});

export const sanityWriteClient = createClient({
  ...config,
  token: process.env.SANITY_WRITE_TOKEN,
});
