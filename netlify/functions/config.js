// Hands the frontend the Sanity property document _id to query, from a
// Netlify env var. Not a secret — a Sanity document _id — so it's fine to
// expose to the browser this way; this just avoids hardcoding it in source
// so the same codebase can be deployed per-property by setting one env var.
//
// Required environment variable (set in Netlify site settings):
//   SANITY_PROPERTY_ID — the _id of this deployment's property document in Sanity

exports.handler = async () => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
  body: JSON.stringify({ propertyId: process.env.SANITY_PROPERTY_ID || '' }),
});
