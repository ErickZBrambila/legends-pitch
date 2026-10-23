import { createClient } from "next-sanity";

const config = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "build-placeholder",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2024-01-01",
  useCdn: false,
};

export const sanityClient = createClient(config);

export const sanityWriteClient = createClient({
  ...config,
  token: process.env.SANITY_WRITE_TOKEN,
});
