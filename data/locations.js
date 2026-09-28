// ===== SOS Stays Concierge — data layer =====
// Property, venue, and FAQ content is fetched live from Sanity (see loadSanityData
// below). The chatbot conversation tree and icon library are shared app UX and stay
// here as static code — they're identical across every property.

const SANITY_PROJECT_ID = '4xk58dqh';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = '2024-06-01';

// Populated by loadSanityData() before the app starts.
let property = null;
let restaurants = null;
let places = null;
let travel = null;
let mealIntros = null;
let stayInfo = null;
let faqCategories = null;
let faqAnswers = null;

// Decision-tree chatbot. Each node has a message and a list of suggestion
// pills; the pill bar is fully replaced (not appended to) on every click.
// A suggestion is either navigation (`next`) or a leaf action (`action`+`id`).
const chatbot = {
  start: {
    message: "Welcome! I can help you find food, things to do, and everything about your stay. What are you looking for?",
    suggestions: [
      { text: "Food & Drink", next: "food", icon: "food" },
      { text: "Attractions", next: "attractions", icon: "compass" },
      { text: "Your Stay", next: "stay", icon: "house" },
      { text: "Travel", next: "travel", icon: "plane" },
      { text: "FAQ", next: "faq", icon: "faq" },
    ],
  },
  food: {
    message: "Great choice — what sounds good?",
    suggestions: [
      { text: "Sit-in Restaurants", action: "meal", id: "sitIn", icon: "food" },
      { text: "Takeaways", action: "meal", id: "takeaway", icon: "takeaway" },
      { text: "Pubs", action: "meal", id: "pubs", icon: "beer" },
    ],
  },
  attractions: {
    message: "Popular places nearby — what are you in the mood for?",
    suggestions: [
      { text: "Other Attractions", action: "places", id: "otherAttractions", icon: "gem" },
      { text: "Walk Trails", action: "places", id: "walkTrails", icon: "leaf" },
    ],
  },
  stay: {
    message: "Here's everything about your stay:",
    suggestions: [
      { text: "Wifi", action: "info", id: "wifi", icon: "wifi" },
      { text: "Check-in / Check-out", action: "info", id: "checkinout", icon: "clock" },
      { text: "Parking", action: "info", id: "parking", icon: "parking" },
      { text: "Contact Host", action: "info", id: "contact", icon: "phone" },
    ],
  },
  travel: {
    message: "Getting to and from your stay — what do you need?",
    suggestions: [
      { text: "Train", action: "travel", id: "train", icon: "train" },
      { text: "Bus", action: "travel", id: "bus", icon: "transport" },
      { text: "Airports", action: "travel", id: "airport", icon: "plane" },
      { text: "Taxi", action: "travel", id: "taxi", icon: "transport" },
    ],
  },
};

// Icon library shared by suggestion pills — 24x24 stroke paths, no fill.
const icons = {
  food: '<path d="M7 3v7"></path><path d="M10 3v7a1 1 0 0 1-2 0V3"></path><path d="M7 10v11"></path><path d="M17 3c-1.5 0-3 2-3 5s1.5 5 3 5v8"></path>',
  compass: '<circle cx="12" cy="12" r="9"></circle><path d="M14.5 9.5l-2 5-5 2 2-5z"></path>',
  house: '<path d="M4 11l8-7 8 7"></path><path d="M6 10v9h12v-9"></path>',
  coffee: '<path d="M6 9h10v6a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4V9z"></path><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16"></path><path d="M8 3v2"></path><path d="M12 3v2"></path>',
  takeaway: '<path d="M6 8h12l-1 12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z"></path><path d="M9 8V6a3 3 0 0 1 6 0v2"></path>',
  beer: '<path d="M5 8h10v9a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V8z"></path><path d="M15 10h2a2 2 0 0 1 0 4h-2"></path><path d="M8 5c0-1 .5-2 2-2"></path>',
  leaf: '<path d="M12 22v-7"></path><path d="M12 15c-4 0-7-3-7-7 4 0 7 2 7 5 0-3 3-5 7-5 0 4-3 7-7 7z"></path>',
  gem: '<path d="M6 8l3-5h6l3 5-6 10z"></path><path d="M6 8h12"></path>',
  wifi: '<path d="M5 12.5a11 11 0 0 1 14 0"></path><path d="M8 15.8a6.5 6.5 0 0 1 8 0"></path><path d="M11 19a2.5 2.5 0 0 1 2 0"></path>',
  clock: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 3"></path>',
  parking: '<rect x="4" y="5" width="16" height="12" rx="2"></rect><path d="M8 9h5a1.5 1.5 0 0 1 0 3H8V9z"></path><path d="M8 12v5"></path>',
  transport: '<path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11"></path><rect x="3" y="11" width="18" height="6" rx="2"></rect><circle cx="7.5" cy="19" r="1.4"></circle><circle cx="16.5" cy="19" r="1.4"></circle>',
  train: '<rect x="6" y="3" width="12" height="13" rx="4"></rect><path d="M6 11h12"></path><path d="M9 20l-2-4"></path><path d="M15 20l2-4"></path>',
  plane: '<path d="M22 2L11 13"></path><path d="M22 2l-7 20-4-9-9-4 20-7z"></path>',
  phone: '<path d="M6 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 4 6a2 2 0 0 1 2-2z"></path>',
  back: '<path d="M15 18l-6-6 6-6"></path>',
  clear: '<circle cx="12" cy="12" r="9"></circle><path d="M9 9l6 6M15 9l-6 6"></path>',
  faq: '<circle cx="12" cy="12" r="9"></circle><path d="M9.5 9.2a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2-2.4 3.8"></path><circle cx="12" cy="16.7" r="0.75" fill="currentColor" stroke="none"></circle>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"></rect><path d="M8 3v4"></path><path d="M16 3v4"></path><path d="M4 10h16"></path>',
  rules: '<path d="M6 4h9l3 3v13H6z"></path><path d="M15 4v3h3"></path><path d="M9 12h6"></path><path d="M9 15.5h6"></path>',
};

// ---------- Sanity fetch + reshape ----------
function slugify(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function bucketBySubcategory(venues, keys) {
  const buckets = {};
  keys.forEach((key) => { buckets[key] = []; });
  (venues || []).forEach((venue) => {
    (venue.subcategory || []).forEach((sub) => {
      if (buckets[sub]) buckets[sub].push(venue);
    });
  });
  return buckets;
}

async function fetchPropertyId() {
  try {
    const res = await fetch('/.netlify/functions/config');
    if (!res.ok) return null;
    const { propertyId } = await res.json();
    return propertyId || null;
  } catch (e) {
    return null;
  }
}

async function fetchPropertyFromSanity() {
  const venueProjection = `
    name, subcategory, distance, rating, "reviews": reviewsCount, "desc": description,
    mapsLink, secondaryLabel, secondaryLink, phone,
    "photo": coalesce(photo.asset->url, photoUrl)
  `;
  const propertyProjection = `{
    name,
    location,
    hostPhone,
    whatsappNumber,
    pageTitle,
    checkinMessageTemplate,
    "logoUrl": logo.asset->url,
    essentials{
      "wifi": {"network": wifiNetwork, "password": wifiPassword},
      address,
      checkInOut,
      parking,
      quietHours,
      "additionalNotes": additionalNotes[]{label, text}
    },
    mealIntros,
    "foodVenues": foodVenues[]->{${venueProjection}},
    "attractionVenues": attractionVenues[]->{${venueProjection}},
    "travelVenues": travelVenues[]->{${venueProjection}},
    "faqCategories": faqCategories[]{label, icon, "questions": questions[]{question, answer}}
  }`;

  // SANITY_PROPERTY_ID (via the config function) says exactly which property
  // document this deployment is for. Without it (e.g. local dev without
  // functions running), fall back to "whichever property comes first" — fine
  // while there's only one, but ambiguous the moment a second one exists.
  const propertyId = await fetchPropertyId();
  const query = propertyId
    ? `*[_type == "property" && _id == $propertyId][0]${propertyProjection}`
    : `*[_type == "property"][0]${propertyProjection}`;

  const params = propertyId ? { propertyId } : {};
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent(query)}${Object.keys(params)
    .map((key) => `&$${key}=${encodeURIComponent(JSON.stringify(params[key]))}`)
    .join('')}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Sanity query failed: ${res.status}`);
  }
  const { result } = await res.json();
  if (!result) {
    throw new Error('No property document found in Sanity');
  }
  return result;
}

async function loadSanityData() {
  const doc = await fetchPropertyFromSanity();

  property = {
    name: doc.name,
    location: doc.location,
    hostPhone: doc.hostPhone,
    whatsappNumber: doc.whatsappNumber,
    pageTitle: doc.pageTitle,
    logoUrl: doc.logoUrl,
    checkinMessageTemplate: doc.checkinMessageTemplate,
    essentials: doc.essentials || {},
  };

  restaurants = bucketBySubcategory(doc.foodVenues, ['sitIn', 'takeaway', 'pubs']);
  places = bucketBySubcategory(doc.attractionVenues, ['otherAttractions', 'walkTrails']);
  travel = bucketBySubcategory(doc.travelVenues, ['train', 'bus', 'airport', 'taxi']);

  mealIntros = {
    sitIn: (doc.mealIntros && doc.mealIntros.sitIn) || 'Here you go:',
    takeaway: (doc.mealIntros && doc.mealIntros.takeaway) || 'Here you go:',
    pubs: (doc.mealIntros && doc.mealIntros.pubs) || 'Here you go:',
  };

  stayInfo = {
    wifi: `Network: <b>${property.essentials.wifi.network}</b> &middot; Password: <b>${property.essentials.wifi.password}</b>`,
    checkinout: property.essentials.checkInOut,
    parking: property.essentials.parking,
    contact: `Your host is real and local. <a href="tel:${property.hostPhone}">Call</a> or <a href="sms:${property.hostPhone}">message</a> anytime.`,
  };

  faqCategories = {};
  faqAnswers = {};
  (doc.faqCategories || []).forEach((cat, catIndex) => {
    const catId = slugify(cat.label) || `category-${catIndex}`;
    faqCategories[catId] = {
      label: cat.label,
      icon: cat.icon,
      questions: (cat.questions || []).map((item, qIndex) => {
        const qId = slugify(item.question) || `${catId}-${qIndex}`;
        faqAnswers[qId] = item.answer;
        return { id: qId, q: item.question };
      }),
    };
  });

  // Generate the FAQ branch of the tree from faqCategories: FAQ → categories →
  // questions → answer, each level replacing the suggestion bar (see `back`).
  chatbot.faq = {
    message: "What would you like to know?",
    suggestions: Object.keys(faqCategories).map((catId) => ({
      text: faqCategories[catId].label,
      next: `faqCat-${catId}`,
      icon: faqCategories[catId].icon,
    })),
  };

  Object.keys(faqCategories).forEach((catId) => {
    const category = faqCategories[catId];
    chatbot[`faqCat-${catId}`] = {
      message: `${category.label} — tap a question:`,
      back: "faq",
      suggestions: category.questions.map((item) => ({
        text: item.q,
        action: "faq",
        id: item.id,
      })),
    };
  });
}
