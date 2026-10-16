// Absolute base URL of this deployment, used for share images and their links.
// SITE_URL wins when set; otherwise Vercel previews point at their own branch URL and
// production at the project's production domain, so each fork gets its own address.
const vercel = process.env.VERCEL_ENV === 'preview' ? process.env.VERCEL_BRANCH_URL : process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const SITE_URL = (process.env.SITE_URL || (vercel ? `https://${vercel}` : 'http://localhost:3000')).replace(/\/+$/, '');
export const SITE_HOST = new URL(SITE_URL).host;
