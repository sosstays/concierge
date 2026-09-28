// ===== SOS Stays Concierge — chatbot engine, rendering =====

document.addEventListener('DOMContentLoaded', () => {
  const essentialsContainer = document.getElementById('essentials-container');
  const checkinContainer = document.getElementById('checkin-container');
  const threadEl = document.getElementById('results-container');
  const suggestionsBar = document.getElementById('suggestions-container');

  // Kicked off immediately so it's resolved (or close to it) by the time the
  // guest gate is submitted. Any element that depends on Sanity data is only
  // touched after this resolves — see enterApp(). Referencing `gateOverlay`
  // here is safe even though it's declared further down: this catch handler
  // only ever runs asynchronously, after the whole synchronous function body
  // (and its const declarations) has already executed.
  const dataReadyPromise = loadSanityData().catch((err) => {
    console.error('Failed to load property data from Sanity', err);
    gateOverlay.innerHTML = '<div class="sos-gate-card"><p>Sorry, we couldn\'t load this property right now. Please refresh the page or try again shortly.</p></div>';
    throw err;
  });

  function applyPropertyMeta() {
    document.getElementById('propertyTitle').textContent = `Your stay at ${property.name}`;
    document.getElementById('propertyLocation').textContent = property.location;
    if (property.pageTitle) {
      document.title = property.pageTitle;
    }
    if (property.logoUrl) {
      document.querySelectorAll('.sos-gate-card .sos-logo, .sos-topbar .sos-logo').forEach((img) => {
        img.src = property.logoUrl;
      });
    }
  }

  let currentNode = 'start';
  let guestName = '';
  let checkinInfo = null;
  let appStarted = false;

  // ---------- Essentials collapsible panel ----------
  // Collapsed by default on phone screens (limited space); open on tablet/desktop.
  let essentialsOpen = !window.matchMedia('(max-width: 699px)').matches;

  function renderEssentials() {
    essentialsContainer.innerHTML = `
      <div class="sos-essentials-box">
        <button class="sos-essentials-toggle" type="button" id="essentialsToggle">
          <span>The essentials</span>
          <svg class="sos-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="transform:${essentialsOpen ? 'rotate(180deg)' : 'rotate(0deg)'}"><path d="M6 9l6 6 6-6"></path></svg>
        </button>
        ${essentialsOpen ? `
        <div class="sos-essentials-body">
          <div class="sos-essential-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5a11 11 0 0 1 14 0"></path><path d="M8 15.8a6.5 6.5 0 0 1 8 0"></path><path d="M11 19a2.5 2.5 0 0 1 2 0"></path></svg>
            <div>
              <div class="label">Wifi</div>
              <div class="value">Network: <b>${property.essentials.wifi.network}</b> &middot; Password: <b>${property.essentials.wifi.password}</b></div>
            </div>
          </div>
          <div class="sos-essential-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21c-4-4.5-7-8-7-11a7 7 0 0 1 14 0c0 3-3 6.5-7 11z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <div>
              <div class="label">Location</div>
              <div class="value">${property.essentials.address}</div>
            </div>
          </div>
          <div class="sos-essential-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 3"></path></svg>
            <div>
              <div class="label">Check-in / check-out</div>
              <div class="value">${property.essentials.checkInOut}</div>
            </div>
          </div>
          <div class="sos-essential-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="12" rx="2"></rect><path d="M8 9h5a1.5 1.5 0 0 1 0 3H8V9z"></path><path d="M8 12v5"></path></svg>
            <div>
              <div class="label">Parking</div>
              <div class="value">${property.essentials.parking}</div>
            </div>
          </div>
          <div class="sos-essential-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.5A9 9 0 1 1 11.5 3a7 7 0 0 0 9.5 9.5z"></path></svg>
            <div>
              <div class="label">Quiet Hours</div>
              <div class="value">${property.essentials.quietHours}</div>
            </div>
          </div>
          <div class="sos-essential-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 4 6a2 2 0 0 1 2-2z"></path></svg>
            <div>
              <div class="label">Message us</div>
              ${(property.essentials.additionalNotes || []).map((note) => `<div class="value" style="margin-top:6px">${note.text}</div>`).join('')}
              ${property.whatsappNumber ? `<a class="sos-message-btn" href="https://wa.me/${property.whatsappNumber}">Message us</a>` : ''}
            </div>
          </div>
        </div>` : ''}
      </div>
    `;
    document.getElementById('essentialsToggle').addEventListener('click', () => {
      essentialsOpen = !essentialsOpen;
      renderEssentials();
    });
  }

  // ---------- Check-in panel (open by default) — live from Uplisting ----------
  let checkinPanelOpen = true;
  function formatCheckinDate(dateStr) {
    if (!dateStr) return null;
    const parsed = new Date(`${dateStr}T00:00:00`);
    if (isNaN(parsed)) return dateStr;
    return parsed.toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  function formatCheckinTime(timeStr) {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':');
    if (hours === undefined) return timeStr;
    const parsed = new Date();
    parsed.setHours(Number(hours), Number(minutes || 0));
    return parsed.toLocaleTimeString('en-IE', { hour: 'numeric', minute: '2-digit' });
  }

  function renderCheckinPanel() {
    if (!checkinContainer) return;

    // No booking id on this visit — nothing to show, no panel at all.
    if (!bookingId) {
      checkinContainer.innerHTML = '';
      return;
    }

    // checkinInfo starts null and is filled in by linkBookingInSupabase() once
    // the gate is submitted (or immediately from cache on repeat visits) — so
    // "not yet linked" reads as "still preparing", not an error.
    if (!checkinInfo || (!checkinInfo.roomNumber && !checkinInfo.checkIn && !checkinInfo.checkOut)) {
      checkinContainer.innerHTML = `
        <div class="sos-essentials-box">
          <div class="sos-essentials-toggle"><span>Your check-in</span></div>
          <div class="sos-essentials-body"><div class="value">Still preparing your check-in details — message us if you need your room before this updates.</div></div>
        </div>`;
      return;
    }

    // room_number/nickname values look like "Room 2" — {{1}} in the template
    // just wants the number itself, so pull that out where possible.
    const roomDigits = checkinInfo.roomNumber ? (checkinInfo.roomNumber.match(/\d+/) || [])[0] : null;
    const roomMessage = property.checkinMessageTemplate && checkinInfo.roomNumber
      ? property.checkinMessageTemplate.replace('{{1}}', roomDigits || checkinInfo.roomNumber)
      : (checkinInfo.roomNumber ? `You're in ${checkinInfo.roomNumber}` : '');

    const checkInDate = formatCheckinDate(checkinInfo.checkIn);
    const checkOutDate = formatCheckinDate(checkinInfo.checkOut);
    const arrivalTime = formatCheckinTime(checkinInfo.arrivalTime);

    checkinContainer.innerHTML = `
      <div class="sos-essentials-box">
        <button class="sos-essentials-toggle" type="button" id="checkinToggle">
          <span>Your check-in</span>
          <svg class="sos-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="transform:${checkinPanelOpen ? 'rotate(180deg)' : 'rotate(0deg)'}"><path d="M6 9l6 6 6-6"></path></svg>
        </button>
        ${checkinPanelOpen ? `
        <div class="sos-essentials-body">
          ${roomMessage ? `
          <div class="sos-essential-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11l8-7 8 7"></path><path d="M6 10v9h12v-9"></path></svg>
            <div>
              <div class="label">Your room</div>
              <div class="value">
                ${roomMessage}
                ${checkinInfo.lockCode ? ` &middot; Door code: <b>${checkinInfo.lockCode}</b>` : ''}
              </div>
            </div>
          </div>` : ''}
          <div class="sos-essential-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 3"></path></svg>
            <div>
              <div class="label">Check-in</div>
              <div class="value">${checkInDate || 'To be confirmed'}${arrivalTime ? ` from ${arrivalTime}` : ''}</div>
            </div>
          </div>
          <div class="sos-essential-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 3"></path></svg>
            <div>
              <div class="label">Check-out</div>
              <div class="value">${checkOutDate || 'To be confirmed'}</div>
            </div>
          </div>
        </div>` : ''}
      </div>
    `;

    const toggle = document.getElementById('checkinToggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        checkinPanelOpen = !checkinPanelOpen;
        renderCheckinPanel();
      });
    }
  }

  // ---------- Chat thread rendering ----------
  function addBotBubble(text) {
    const row = document.createElement('div');
    row.className = 'sos-msg-row bot';
    row.innerHTML = `<div class="sos-bubble bot">${text}</div>`;
    threadEl.appendChild(row);
  }

  function addUserBubble(text) {
    const row = document.createElement('div');
    row.className = 'sos-msg-row user';
    row.innerHTML = `<div class="sos-bubble user">${text}</div>`;
    threadEl.appendChild(row);
  }

  function cardMedia(item) {
    if (item.photo) {
      return `<div class="sos-card-media has-photo"><img src="${item.photo}" alt="${item.name}" loading="lazy"></div>`;
    }
    return `<div class="sos-card-media">Photo</div>`;
  }

  function renderRestaurantCard(item) {
    const secondaryAction = item.secondaryLink
      ? `<a class="secondary" href="${item.secondaryLink}" target="_blank" rel="noopener">${item.secondaryLabel}</a>`
      : '';
    const phoneAction = item.phone
      ? `<a class="secondary" href="tel:${item.phone}">Call · ${item.phone}</a>`
      : '';
    const descBlock = item.desc ? `<div class="sos-card-desc">${item.desc}</div>` : '';
    return `
      <div class="sos-card">
        ${cardMedia(item)}
        <div class="sos-card-body">
          <div class="sos-card-name">${item.name}</div>
          <div class="sos-card-tags">
            <span class="sos-tag">⭐ ${item.rating} (${item.reviews})</span>
            <span class="sos-tag">📍 ${item.distance}</span>
          </div>
          ${descBlock}
          <div class="sos-card-actions">
            <a class="primary" href="${item.mapsLink}" target="_blank" rel="noopener">Google Maps</a>
            ${secondaryAction}
            ${phoneAction}
          </div>
        </div>
      </div>
    `;
  }


  function addCardsTurn(text, items, renderFn) {
    const turn = document.createElement('div');
    turn.className = 'sos-turn';
    const bubble = document.createElement('div');
    bubble.className = 'sos-bubble bot';
    bubble.textContent = text;
    const cardsWrap = document.createElement('div');
    cardsWrap.className = 'sos-cards';
    cardsWrap.innerHTML = items.map(renderFn).join('');
    turn.appendChild(bubble);
    turn.appendChild(cardsWrap);
    threadEl.appendChild(turn);
  }

  function scrollThreadToBottom() {
    threadEl.scrollTop = threadEl.scrollHeight;
  }

  // ---------- Suggestion pill bar (fully replaced on every click) ----------
  function pillIconSvg(iconKey) {
    if (!iconKey || !icons[iconKey]) return '';
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${icons[iconKey]}</svg>`;
  }

  function makePill(sug, extraClass) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sos-pill' + (extraClass ? ` ${extraClass}` : '');
    btn.innerHTML = `${pillIconSvg(sug.icon)}<span>${sug.text}</span>`;
    btn.addEventListener('click', () => handleSuggestionClick(sug));
    return btn;
  }

  function renderSuggestionBar(nodeKey) {
    suggestionsBar.innerHTML = '';
    chatbot[nodeKey].suggestions.forEach((sug) => {
      suggestionsBar.appendChild(makePill(sug));
    });

    // Back + Clear always render together, inline, as their own row —
    // shown on every node except the start screen. Back returns to whatever
    // node this one was reached from (its `back`), defaulting to start.
    if (nodeKey !== 'start') {
      const backTarget = chatbot[nodeKey].back || 'start';
      const utilityRow = document.createElement('div');
      utilityRow.className = 'sos-bar-utility';
      utilityRow.appendChild(makePill({ text: 'Back', next: backTarget, icon: 'back' }, 'back'));
      utilityRow.appendChild(makePill({ text: 'Clear', action: 'clear', icon: 'clear' }, 'clear'));
      suggestionsBar.appendChild(utilityRow);
    }
  }

  function goToNode(nodeKey) {
    const node = chatbot[nodeKey];
    currentNode = nodeKey;
    const message = nodeKey === 'start' && guestName
      ? `Welcome, ${guestName} 👋 ${node.message.replace(/^Welcome!\s*/, '')}`
      : node.message;
    addBotBubble(message);
    renderSuggestionBar(nodeKey);
    scrollThreadToBottom();
  }

  function runAction(sug) {
    if (sug.action === 'meal') {
      addCardsTurn(mealIntros[sug.id] || 'Here you go:', restaurants[sug.id], renderRestaurantCard);
    } else if (sug.action === 'places') {
      addCardsTurn("Here's what we found:", places[sug.id], renderRestaurantCard);
    } else if (sug.action === 'info') {
      addBotBubble(stayInfo[sug.id]);
    } else if (sug.action === 'faq') {
      addBotBubble(faqAnswers[sug.id]);
    } else if (sug.action === 'travel') {
      addCardsTurn('Here you go:', travel[sug.id], renderRestaurantCard);
    }
    // Same suggestion set stays available so the guest can pick another item.
    renderSuggestionBar(currentNode);
    scrollThreadToBottom();
  }

  function clearThread() {
    threadEl.innerHTML = '';
    goToNode('start');
  }

  function handleSuggestionClick(sug) {
    if (sug.action === 'clear') {
      clearThread();
      return;
    }
    addUserBubble(sug.text);
    if (sug.next) {
      goToNode(sug.next);
    } else if (sug.action) {
      runAction(sug);
    }
  }

  // ---------- App startup (called once the guest gate is passed) ----------
  function startApp() {
    appStarted = true;
    renderEssentials();
    renderCheckinPanel();
    goToNode('start');
  }

  // ---------- Guest gate: collect + validate name and email ----------
  const gateOverlay = document.getElementById('gate-overlay');
  const appRoot = document.getElementById('app-root');
  const gateForm = document.getElementById('gate-form');
  const nameInput = document.getElementById('gate-name');
  const emailInput = document.getElementById('gate-email');
  const marketingInput = document.getElementById('gate-marketing');
  const bookingInput = document.getElementById('gate-booking');
  const nameError = document.getElementById('gate-name-error');
  const emailError = document.getElementById('gate-email-error');

  // ---------- Booking ID: read from the URL (?bookingid=...), remembered across visits ----------
  const BOOKING_STORAGE_KEY = 'sosBookingId';

  function saveBookingId(id) {
    try {
      localStorage.setItem(BOOKING_STORAGE_KEY, id);
    } catch (e) {
      // localStorage unavailable — booking ID just won't persist across visits.
    }
  }

  function loadBookingId() {
    try {
      return localStorage.getItem(BOOKING_STORAGE_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  const CHECKIN_STORAGE_KEY = 'sosCheckinInfo';

  function saveCheckinInfo(bookingId, checkin) {
    try {
      localStorage.setItem(CHECKIN_STORAGE_KEY, JSON.stringify({ bookingId, checkin }));
    } catch (e) {
      // localStorage unavailable — checkin info just won't persist across visits.
    }
  }

  function loadCheckinInfo(bookingId) {
    try {
      const raw = localStorage.getItem(CHECKIN_STORAGE_KEY);
      const cached = raw ? JSON.parse(raw) : null;
      return cached && cached.bookingId === bookingId ? cached.checkin : null;
    } catch (e) {
      return null;
    }
  }

  const urlBookingId = new URLSearchParams(window.location.search).get('bookingid');
  if (urlBookingId) saveBookingId(urlBookingId);
  const bookingId = urlBookingId || loadBookingId();
  bookingInput.value = bookingId;
  checkinInfo = loadCheckinInfo(bookingId);

  const NAME_PATTERN = /^[A-Za-z][A-Za-z' -]{1,49}$/;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setFieldError(input, errorEl, message) {
    input.classList.toggle('invalid', !!message);
    errorEl.textContent = message || '';
  }

  function validateName() {
    const value = nameInput.value.trim();
    if (!value) {
      setFieldError(nameInput, nameError, 'Please enter your full name.');
      return null;
    }
    if (!NAME_PATTERN.test(value)) {
      setFieldError(nameInput, nameError, 'Name should only contain letters, spaces and hyphens.');
      return null;
    }
    setFieldError(nameInput, nameError, '');
    return value;
  }

  function validateEmail() {
    const value = emailInput.value.trim();
    if (!value) {
      setFieldError(emailInput, emailError, 'Please enter your email address.');
      return null;
    }
    if (!EMAIL_PATTERN.test(value)) {
      setFieldError(emailInput, emailError, 'Please enter a valid email address.');
      return null;
    }
    setFieldError(emailInput, emailError, '');
    return value;
  }

  nameInput.addEventListener('blur', validateName);
  emailInput.addEventListener('blur', validateEmail);

  // ---------- Remember the guest so the gate is skipped next visit ----------
  const GUEST_STORAGE_KEY = 'sosGuest';

  function saveGuest(name, email, marketingConsent, bookingId) {
    try {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({ name, email, marketingConsent, bookingId }));
    } catch (e) {
      // localStorage unavailable (private browsing, etc.) — just skip persisting.
    }
  }

  function loadGuest() {
    try {
      const raw = localStorage.getItem(GUEST_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  async function enterApp() {
    await dataReadyPromise;
    applyPropertyMeta();
    gateOverlay.classList.add('sos-hidden');
    appRoot.classList.remove('sos-hidden');
    startApp();
  }

  // ---------- Submit to Netlify Forms (AJAX, so the page never navigates) ----------
  function encodeFormData(data) {
    return Object.keys(data)
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
      .join('&');
  }

  function submitToNetlify(name, email, marketingConsent, bookingId) {
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encodeFormData({ 'form-name': 'gate-form', name, email, marketing: marketingConsent ? 'yes' : 'no', booking: bookingId || '' }),
    }).catch(() => {
      // Don't block the guest experience if the Netlify submission fails.
    });
  }

  // ---------- Subscribe to MailerLite via a Netlify Function (keeps the API key server-side) ----------
  function submitToMailerLite(name, email, marketingConsent, bookingId) {
    if (!marketingConsent) return;
    fetch('/.netlify/functions/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, marketingConsent, bookingId }),
    }).catch(() => {
      // Don't block the guest experience if the MailerLite submission fails.
    });
  }

  // ---------- Link this guest's email to their booking in Supabase (keeps the service key server-side) ----------
  // Also pulls back check-in details (room number, lock code) to show the guest.
  const LINK_BOOKING_URL = 'https://xqqkofbpqntdtfrvxdzo.supabase.co/functions/v1/link-booking';

  function linkBookingInSupabase(name, email, bookingId) {
    if (!bookingId) return;
    fetch(LINK_BOOKING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, bookingId }),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result && result.checkin) {
          checkinInfo = result.checkin;
          saveCheckinInfo(bookingId, result.checkin);
          if (appStarted) {
            renderEssentials();
            renderCheckinPanel();
          }
        }
      })
      .catch(() => {
        // Don't block the guest experience if the Supabase link fails.
      });
  }

  gateForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const validName = validateName();
    const validEmail = validateEmail();
    if (!validName || !validEmail) {
      (validName ? emailInput : nameInput).focus();
      return;
    }
    // Honeypot: if a bot filled the hidden field, quietly drop the submission.
    if (gateForm.elements['bot-field'] && gateForm.elements['bot-field'].value) {
      return;
    }

    const marketingConsent = marketingInput.checked;

    guestName = validName.split(' ')[0];
    saveGuest(validName, validEmail, marketingConsent, bookingId);
    submitToNetlify(validName, validEmail, marketingConsent, bookingId);
    submitToMailerLite(validName, validEmail, marketingConsent, bookingId);
    linkBookingInSupabase(validName, validEmail, bookingId);
    enterApp();
  });

  // ---------- Init: skip the gate entirely if we already know this guest ----------
  const savedGuest = loadGuest();
  if (savedGuest && savedGuest.name) {
    guestName = savedGuest.name.split(' ')[0];
    // A booking ID freshly read from the URL this visit takes precedence over
    // whatever was stored with the original gate submission.
    saveGuest(savedGuest.name, savedGuest.email, savedGuest.marketingConsent, bookingId || savedGuest.bookingId);
    // Only re-link Supabase when this visit actually carried a fresh URL booking id.
    if (urlBookingId) linkBookingInSupabase(savedGuest.name, savedGuest.email, urlBookingId);
    enterApp();
  }
});
