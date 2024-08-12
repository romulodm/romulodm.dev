
import { createClient } from '@sanity/client';

export const sanityClient = createClient({
  dataset: import.meta.env.VITE_SANITY_DATASET_NAME,
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
  useCdn: import.meta.env.VITE_SANITY_ENV === 'production',
  token: import.meta.env.VITE_SANITY_API_TOKEN
})

export default sanityClient;