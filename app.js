/* ═══════════════════════════════════════════════════════════════
   CEBUPARADISE — app.js
   Modules: DB · Auth · Cursor · Particles · Spots · Modal ·
            Bookings · Admin · Helpers · Boot
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/* ══════════════════════════════════════════════
   DATABASE MODULE
   All data persisted in localStorage / sessionStorage.
   In a production app, replace these methods with
   real API calls to a backend database (e.g. Firebase,
   Supabase, or your own REST server).
   ══════════════════════════════════════════════ */
const DB = {

  /* ── USERS ── */
  getUsers() {
    try { return JSON.parse(localStorage.getItem('cp_users') || '[]'); }
    catch { return []; }
  },
  saveUsers(users) {
    localStorage.setItem('cp_users', JSON.stringify(users));
  },
  findUser(email) {
    return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  addUser(user) {
    const users = this.getUsers();
    users.push(user);
    this.saveUsers(users);
  },

  /* ── SESSION ── */
  getSession()   { try { return JSON.parse(sessionStorage.getItem('cp_session') || 'null'); } catch { return null; } },
  setSession(u)  { sessionStorage.setItem('cp_session', JSON.stringify(u)); },
  clearSession() { sessionStorage.removeItem('cp_session'); },

  /* ── BOOKINGS (per-user key) ── */
  getBookings(userId) {
    try { return JSON.parse(localStorage.getItem('cp_bk_' + userId) || '[]'); }
    catch { return []; }
  },
  saveBookings(userId, bks) {
    localStorage.setItem('cp_bk_' + userId, JSON.stringify(bks));
  },
  countBookings(userId) {
    return this.getBookings(userId).length;
  }
};

/* ── Seed default admin account on first load ── */
(function seedAdmin() {
  if (DB.getUsers().length === 0) {
    DB.addUser({
      id:     'admin_001',
      name:   'Admin',
      email:  'admin@cebuparadise.com',
      password: 'admin123',   /* NOTE: hash passwords in production */
      role:   'admin',
      joined: new Date().toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' })
    });
  }
})();


/* ══════════════════════════════════════════════
   TOURIST SPOTS DATA
   Images: Wikimedia Commons (CC-BY-SA / Public Domain)
   ══════════════════════════════════════════════ */
const SPOTS = [
  {
    id: 1, name: "Oslob Whale Shark Watching",
    location: "Oslob, Southern Cebu", badge: "Must-Try",
    price: "From ₱500/person", rating: 4.9,
    desc: "Experience the once-in-a-lifetime thrill of swimming alongside the world's largest fish in the crystal-clear waters of Oslob. The whale sharks, locally called butanding, gracefully glide through the sea just meters from you.",
    tags: ["Water Activity", "Wildlife", "Adventure"],
    cardImg: "images/oslob/wsw.jpg",
    galleryImgs: [
      { url: "images/oslob/giants.jpg", label: "Whale Shark Close-up" },
      { url: "images/oslob/openWoslob.jpg", label: "Open Water" },
      { url: "images/oslob/waters.jpg", label: "Swimming With Giants" },
      { url: "images/oslob/openWoslob.jpg", label: "Oslob Waters" },
      { url: "images/oslob/feeding.jpg", label: "Feeding Time" }
    ],
    accommodations: [
      { name: "Whale Shark Inn",    type: "Budget Hotel",  price: "₱800/night",   stars: 3, amenities: ["WiFi","AC","Breakfast"], img: "images/oslob/acco/inn.jpg" },
      { name: "Oslob Bay Resort",   type: "Beach Resort",  price: "₱2,500/night", stars: 4, amenities: ["Pool","WiFi","Beach","Restaurant"], img: "images/oslob/acco/bay.avif" },
      { name: "Tumalog Dive Lodge", type: "Dive Lodge",    price: "₱1,200/night", stars: 3, amenities: ["Dive Shop","WiFi","Gear Rental"], img: "images/oslob/acco/divelodge.jpg" }
    ]
  },
  {
    id: 2, name: "Kawasan Falls",
    location: "Badian, Southern Cebu", badge: "Top Pick",
    price: "From ₱150/person", rating: 4.8,
    desc: "A breathtaking multi-tiered turquoise waterfall hidden in the lush jungles of Badian. Kawasan Falls is the crown jewel of Cebu's natural wonders — crystal-clear glacial-blue water plunges into perfect natural pools.",
    tags: ["Nature", "Waterfall", "Canyoneering"],
    cardImg: "images/kawasan/kawafalls.jpg",
    galleryImgs: [
      { url: "images/kawasan/kamain.jpg", label: "The Main Falls" },
      { url: "images/kawasan/katurqois.jpg", label: "Turquoise Pool" },
      { url: "images/kawasan/kaAerial.jpg", label: "Aerial View" },
      { url: "images/kawasan/kaBamboo.jpg", label: "Bamboo Raft" },
      { url: "images/kawasan/kalower.webp", label: "Lower Pool" }
    ],
    accommodations: [
      { name: "Kawasan Eco Lodge",            type: "Eco Resort",     price: "₱1,800/night", stars: 4, amenities: ["Pool","Garden","WiFi","Tours"],    img: "images/kawasan/acc/eco.jpg" },
      { name: "Badian Island Wellness Resort", type: "Luxury Resort",  price: "₱8,500/night", stars: 5, amenities: ["Spa","Beach","Pool","Dive"],       img: "images/kawasan/acc/badian.avif" },
      { name: "Falls View Hostel",             type: "Hostel",         price: "₱400/night",   stars: 2, amenities: ["WiFi","Kitchen","Lockers"],        img: "images/kawasan/acc/falls.webp" }
    ]
  },
  {
    id: 3, name: "Magellan's Cross",
    location: "Cebu City, Metro Cebu", badge: "Historic",
    price: "Free Entry", rating: 4.7,
    desc: "Standing in the heart of Cebu City since 1521, Magellan's Cross marks where Ferdinand Magellan planted the first Christian cross in Southeast Asia. Housed near the Basilica Minore del Santo Niño, it is one of the Philippines' most sacred historical sites.",
    tags: ["History", "Culture", "Heritage"],
    cardImg: "images/magellancross/magcross.jpg",
    galleryImgs: [
      { url: "images/magellancross/mc.webp", label: "Magellan's Cross" },
      { url: "images/magellancross/sto.nin.jpg", label: "Basilica Santo Niño" },
      { url: "images/magellancross/Mhistoric.webp", label: "Historic District" },
      { url: "images/magellancross/inside-magellancross.jpg", label: "Chapel Interior" },
      { url: "images/magellancross/mC fD.jpg", label: "Facade Detail" }
    ],
    accommodations: [
      { name: "Sugbu Hotel Cebu",   type: "Heritage Hotel", price: "₱2,200/night", stars: 4, amenities: ["WiFi","Pool","Restaurant","Tours"], img: "images/magellancross/acc/sugbu.jpg" },
      { name: "Cebu City Marriott", type: "Luxury Hotel",   price: "₱6,800/night", stars: 5, amenities: ["Pool","Gym","Spa","Concierge"],      img: "images/magellancross/acc/marriot.jpg" },
      { name: "Be Hotel Cebu",      type: "Boutique Hotel", price: "₱3,500/night", stars: 4, amenities: ["Rooftop","WiFi","Bar"],               img: "images/magellancross/acc/be.jpg" }
    ]
  },
  {
    id: 4, name: "Chocolate Hills (Bohol Day Trip)",
    location: "Bohol (via Cebu Ferry)", badge: "UNESCO Site",
    price: "From ₱800/person", rating: 4.9,
    desc: "Take a scenic ferry trip to witness Bohol's Chocolate Hills — over 1,268 perfectly cone-shaped limestone hills that turn chocolate brown in dry season. Combined with Philippine tarsiers and the Loboc River cruise, this is an unmissable adventure.",
    tags: ["Day Trip", "Nature", "UNESCO"],
    cardImg: "images/chocohills/panoV.jpg",
    galleryImgs: [
      { url: "images/chocohills/dry.png", label: "Panoramic View" },
      { url: "images/chocohills/tarsier.webp", label: "Philippine Tarsier" },
      { url: "images/chocohills/aaerial.jpg", label: "Aerial View" },
      { url: "images/chocohills/CH.jpg", label: "Dry Season" },
      { url: "images/chocohills/wild.png", label: "Wildlife Sanctuary" }
    ],
    accommodations: [
      { name: "Bohol Bee Farm Resort",  type: "Eco Resort",      price: "₱4,200/night", stars: 4, amenities: ["Organic Farm","Pool","Spa"],      img: "images/chocohills/acc/bee.jpeg" },
      { name: "Amorita Resort Panglao", type: "Luxury Clifftop", price: "₱9,500/night", stars: 5, amenities: ["Infinity Pool","Spa","Beach"],    img: "images/chocohills/acc/amorita.webp" },
      { name: "Dao Diamond Hotel",      type: "Business Hotel",  price: "₱2,800/night", stars: 4, amenities: ["WiFi","Pool","Conference"],       img: "images/chocohills/acc/amorita.webp" }
    ]
  },
  {
    id: 5, name: "Bantayan Island",
    location: "Bantayan, Northern Cebu", badge: "Hidden Gem",
    price: "From ₱1,200/person", rating: 4.8,
    desc: "Pristine powdery white sand beaches, swaying palms, and some of the most brilliant azure water in the Philippines. Bantayan Island is Cebu's ultimate paradise escape, offering legendary sunsets and genuine Filipino island life.",
    tags: ["Beach", "Island", "Relaxation"],
    cardImg: "images/bantayan/Bantayan-Island.webp",
    galleryImgs: [
      { url: "images/bantayan/santa-Fe-Beach.jpg", label: "Santa Fe Beach" },
      { url: "images/bantayan/crystal.webp",  label: "Crystal Waters" },
      { url: "images/bantayan/palm.jpg",  label: "Palm-Lined Shore" },
      { url: "images/bantayan/Sunset_in_Bantayan.jpg", label: "Sunset View" },
      { url: "images/bantayan/ISLANDLIFE.jpg",  label: "Island Life" }
    ],
    accommodations: [
      { name: "Bantayan Island Nature Resort", type: "Beach Resort",   price: "₱3,200/night", stars: 4, amenities: ["Beach","Pool","Snorkeling","WiFi"],  img: "images/bantayan/acc/nature.jpg" },
      { name: "Kota Beach Resort",             type: "Beach Resort",   price: "₱2,500/night", stars: 4, amenities: ["Beachfront","Restaurant","WiFi"],     img: "images/bantayan/acc/kota.webp" },
      { name: "Santa Fe Beach Club",           type: "Boutique Hotel", price: "₱4,800/night", stars: 5, amenities: ["Private Beach","Spa","Yoga","Pool"],  img: "images/bantayan/acc/santa.jpg" }
    ]
  },
  {
    id: 6, name: "Taoist Temple",
    location: "Beverly Hills, Cebu City", badge: "Iconic",
    price: "Free Entry", rating: 4.6,
    desc: "Perched atop Beverly Hills subdivision, Cebu's Chinese Taoist Temple offers breathtaking 360° views of the city. Built in 1972, it features 81 steps (one per chapter of the Tao Te Ching) and intricate dragon motifs throughout.",
    tags: ["Culture", "Panoramic View", "Architecture"],
    cardImg: "images/temple/taoist-temple.jpg",
    galleryImgs: [
      { url: "images/temple/taoistt.jpg", label: "Main Temple" },
      { url: "images/temple/taoist-temple-2-dragons-1024x683.jpg",  label: "Dragon Gates" },
      { url: "images/temple/81.jpg",  label: "81 Steps" },
      { url: "images/temple/city.jpg", label: "City Panorama" },
      { url: "images/temple/grounds.avif",  label: "Temple Grounds" }
    ],
    accommodations: [
      { name: "The Henry Hotel Cebu", type: "Design Hotel",        price: "₱5,500/night", stars: 4, amenities: ["Pool","Art Gallery","Restaurant","WiFi"], img: "images/temple/acc/henry.jpg" },
      { name: "Radisson Blu Cebu",    type: "5-Star Hotel",        price: "₱8,200/night", stars: 5, amenities: ["Pool","Gym","Spa","Business"],             img: "images/temple/acc/rad.jpg" },
      { name: "Citadines Cebu City",  type: "Serviced Apartments", price: "₱3,800/night", stars: 4, amenities: ["Kitchenette","Pool","Gym"],                img: "images/temple/acc/cita.jpg" }
    ]
  },
  {
    id: 7, name: "Fort San Pedro",
    location: "Cebu City, Metro Cebu", badge: "Oldest Fort",
    price: "₱75/person", rating: 4.5,
    desc: "The oldest and smallest triangular bastion fort in the Philippines, built by Miguel López de Legazpi in 1565. This beautifully restored Spanish colonial fortress houses a museum, lush garden, and cannons along its sea-facing walls.",
    tags: ["History", "Museum", "Colonial"],
    cardImg: "images/fort/fort.jpg",
    galleryImgs: [
      { url: "images/fort/fort-san-pedro.avif", label: "Fort Entrance" },
      { url: "images/fort/fort-san-pedro-statue.jpg",  label: "Bastion Walls" },
      { url: "images/fort/garden.jpg",  label: "Fort Garden" },
      { url: "images/fort/canon.jpg", label: "Cannon Display" },
      { url: "images/fort/museum.jpg",  label: "Museum Interior" }
    ],
    accommodations: [
      { name: "Waterfront Cebu City Hotel", type: "Luxury Hotel",  price: "₱5,800/night", stars: 5, amenities: ["Casino","Pool","Spa","Restaurants"], img: "images/fort/acc/waterfront.webp" },
      { name: "Cebu R Hotel Mabolo",        type: "Business Hotel",price: "₱2,200/night", stars: 4, amenities: ["WiFi","Pool","Gym","Restaurant"],     img: "images/fort/acc/rhot.jpg" },
      { name: "The Pad Cebu",               type: "Boutique Hotel",price: "₱3,500/night", stars: 4, amenities: ["Rooftop Bar","WiFi","Pool"],           img: "images/fort/acc/pad.avif" }
    ]
  },
  {
    id: 8, name: "Sumilon Island",
    location: "Oslob, Southern Cebu", badge: "Sandbar",
    price: "From ₱600/person", rating: 4.9,
    desc: "A tiny gem of paradise just 20 minutes from Oslob. Sumilon Island boasts a spectacular shifting white sandbar, a world-class marine sanctuary, and pristine coral reefs teeming with vibrant marine life.",
    tags: ["Island", "Snorkeling", "Sandbar"],
    cardImg: "images/sumilon/sumilon-main-photo.jpg",
    galleryImgs: [
      { url: "images/sumilon/sandbar.jpg", label: "Sumilon Sandbar" },
      { url: "images/sumilon/aerialview.webp",  label: "Aerial View" },
      { url: "images/sumilon/lagoon.avif",  label: "Crystal Lagoon" },
      { url: "images/sumilon/coral.webp", label: "Coral Gardens" },
      { url: "images/sumilon/beach.jpg",  label: "Beach View" }
    ],
    accommodations: [
      { name: "Bluewater Sumilon Island Resort", type: "Luxury Island Resort", price: "₱12,000/night", stars: 5, amenities: ["Private Beach","Infinity Pool","Spa","Snorkeling"], img: "images/sumilon/acc/blue.jpg" },
      { name: "Oslob Port Inn",                  type: "Budget Hotel",         price: "₱900/night",    stars: 3, amenities: ["WiFi","AC","Island Shuttle"],                       img: "images/sumilon/acc/luna.jpg" }
    ]
  },
  {
    id: 9, name: "Tops Lookout",
    location: "Busay, Cebu City", badge: "Best View",
    price: "₱50/person", rating: 4.6,
    desc: "Cebu's most iconic viewpoint, 600 meters above sea level in Busay, offering a sweeping 360° panorama of Cebu City, Mactan Island, and the Visayan Sea. The sunset views are legendary — and after dark, the city glitters below like stars.",
    tags: ["Viewpoint", "Sunset", "City View"],
    cardImg: "images/tops/Tops-Lookout.jpg",
    galleryImgs: [
      { url: "images/tops/tops.avif", label: "City Skyline" },
      { url: "images/tops/topss.jpg",  label: "Panoramic View" },
      { url: "images/tops/sunset.jpg",  label: "Sunset Colors" },
      { url: "images/tops/night.webp", label: "Night Lights" },
      { url: "images/tops/mactan.webp",  label: "Mactan Channel" }
    ],
    accommodations: [
      { name: "Crimson Resort & Spa Mactan", type: "Luxury Resort",  price: "₱11,500/night", stars: 5, amenities: ["Beach","Infinity Pool","Spa","Fine Dining"], img: "images/tops/acc/crim.jpg" },
      { name: "Sky Garden Suites",           type: "Boutique Hotel", price: "₱4,200/night",  stars: 4, amenities: ["Terrace","Pool","Panoramic View"],            img: "images/tops/acc/sky.jpg" },
      { name: "Tops Mountain Inn",           type: "Mountain Lodge", price: "₱1,800/night",  stars: 3, amenities: ["Cool Air","WiFi","Breakfast"],                img: "images/tops/acc/Innn.jpg" }
    ]
  },
  {
    id: 10, name: "Nalusuan Island",
    location: "Cordova, Mactan", badge: "Marine Park",
    price: "From ₱400/person", rating: 4.7,
    desc: "A private marine sanctuary 30 minutes by boat from Mactan. Nalusuan Island's protected reef teems with coral gardens, sea turtles, and tropical fish. Crystal-clear waters and swaying palms make it the perfect escape from city life.",
    tags: ["Marine Sanctuary", "Diving", "Private Island"],
    cardImg: "images/nalusuan/islannd.jpg",
    galleryImgs: [
      { url: "images/nalusuan/nisland.avif", label: "Island Overview" },
      { url: "images/nalusuan/corall.webp",  label: "Coral Reef" },
      { url: "images/nalusuan/deck.jpg",  label: "Beach Deck" },
      { url: "images/nalusuan/snork.jpg", label: "Snorkeling Spot" },
      { url: "images/nalusuan/marine.jpg",  label: "Marine Life" }
    ],
    accommodations: [
      { name: "Nalusuan Island Resort", type: "Island Resort",  price: "₱5,200/night",  stars: 4, amenities: ["Private Beach","Dive Shop","Restaurant","WiFi"], img: "images/nalusuan/acc/nalusuann.jpg" },
      { name: "Shangri-La Mactan",      type: "Luxury Resort",  price: "₱14,000/night", stars: 5, amenities: ["3 Pools","Private Cove","Spa","Dive Center"],    img: "images/nalusuan/acc/shangri.jpg" },
      { name: "Crimson Resort Mactan",  type: "5-Star Resort",  price: "₱11,500/night", stars: 5, amenities: ["Beach","Spa","Kids Club","Snorkeling"],           img: "images/nalusuan/acc/crimson.webp" }
    ]
  }
];


/* ══════════════════════════════════════════════
   APP STATE
   ══════════════════════════════════════════════ */
let currentUser  = null;
let currentSpot  = null;
let activeFilter = 'all';
let isGuest      = false;


/* ══════════════════════════════════════════════
   CURSOR
   ══════════════════════════════════════════════ */
const $cursor    = document.getElementById('cursor');
const $cursorDot = document.getElementById('cursorDot');

document.addEventListener('mousemove', e => {
  $cursor.style.left    = e.clientX + 'px';
  $cursor.style.top     = e.clientY + 'px';
  setTimeout(() => {
    $cursorDot.style.left = e.clientX + 'px';
    $cursorDot.style.top  = e.clientY + 'px';
  }, 55);
});
document.addEventListener('mousedown', () => $cursor.style.transform = 'translate(-50%,-50%) scale(.65)');
document.addEventListener('mouseup',   () => $cursor.style.transform = 'translate(-50%,-50%) scale(1)');
document.addEventListener('mouseover', e => {
  const over = !!e.target.closest('button, a, .spot-card, .accomm-card, .photo-item, .booking-row, .auth-input');
  $cursor.classList.toggle('hov', over);
});


/* ══════════════════════════════════════════════
   PARTICLES
   ══════════════════════════════════════════════ */
function spawnParticles(containerId, count) {
  const container = document.getElementById(containerId);
  if (!container) return;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 22 + 5;
    p.style.cssText = [
      `width:${size}px`,
      `height:${size}px`,
      `left:${Math.random() * 100}%`,
      `animation-duration:${Math.random() * 12 + 8}s`,
      `animation-delay:${Math.random() * 10}s`,
      `opacity:${(Math.random() * .3 + .06).toFixed(2)}`
    ].join(';');
    container.appendChild(p);
  }
}


/* ══════════════════════════════════════════════
   AUTH — Sign In / Register / Guest
   ══════════════════════════════════════════════ */
function showAuthTab(tab) {
  document.getElementById('loginForm').style.display    = tab === 'login'    ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('tabLogin').classList.toggle('active',    tab === 'login');
  document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
}

function authError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 4000);
}

function doLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) { authError('loginError', 'Please enter your email and password.'); return; }
  const user = DB.findUser(email);
  if (!user)                    { authError('loginError', 'No account found with that email.'); return; }
  if (user.password !== password) { authError('loginError', 'Incorrect password. Please try again.'); return; }
  startSession(user, false);
}

function doRegister() {
  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm  = document.getElementById('regConfirm').value;
  if (!name)                           { authError('registerError', 'Please enter your full name.'); return; }
  if (!email || !email.includes('@'))  { authError('registerError', 'Please enter a valid email address.'); return; }
  if (password.length < 6)             { authError('registerError', 'Password must be at least 6 characters.'); return; }
  if (password !== confirm)            { authError('registerError', 'Passwords do not match.'); return; }
  if (DB.findUser(email))              { authError('registerError', 'An account with that email already exists.'); return; }
  const newUser = {
    id:       'usr_' + Date.now(),
    name, email, password,
    role:     'user',
    joined:   new Date().toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' })
  };
  DB.addUser(newUser);
  startSession(newUser, false);
}

function doGuest() {
  const guestUser = {
    id: 'guest_' + Date.now(), name: 'Guest Explorer',
    email: '', role: 'guest', joined: 'Today'
  };
  startSession(guestUser, true);
}

function startSession(user, guest) {
  currentUser = user;
  isGuest     = guest;
  if (!guest) DB.setSession(user);

  /* Hide auth overlay → show app */
  document.getElementById('authOverlay').style.display = 'none';
  document.getElementById('app').classList.add('visible');

  /* Navbar */
  const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('navAvatar').textContent   = initials;
  document.getElementById('navUsername').textContent = user.name.split(' ')[0];

  /* Admin panel */
  if (user.role === 'admin') {
    document.getElementById('navAdminLink').style.display = 'block';
    document.getElementById('admin').style.display        = 'block';
    renderUsersTable();
  }

  /* Hero welcome */
  document.getElementById('heroWelcome').textContent = guest
    ? '🌊 Browsing as Guest — Sign up to save bookings!'
    : `Welcome back, ${user.name.split(' ')[0]}! 🌺`;

  /* Prefill booking form */
  if (!guest) {
    document.getElementById('bkName').value  = user.name;
    document.getElementById('bkEmail').value = user.email;
  }

  spawnParticles('heroParticles', 20);
  renderSpots();
  renderBookings();
  updateStats();
  setMinDates();
  showToast('🌴 Welcome!',
    guest ? 'Browsing as Guest.' : `Signed in as ${user.name}.`, '#2d6a4f');
}

function doLogout() {
  DB.clearSession();
  currentUser = null;
  isGuest     = false;
  document.getElementById('app').classList.remove('visible');
  document.getElementById('authOverlay').style.display = 'flex';
  document.getElementById('navAdminLink').style.display = 'none';
  document.getElementById('admin').style.display        = 'none';
  /* Clear login inputs */
  document.getElementById('loginEmail').value    = '';
  document.getElementById('loginPassword').value = '';
  showToast('👋 Logged Out', 'Come back soon!', '#0077b6');
}


/* ══════════════════════════════════════════════
   NAVBAR SCROLL EFFECT
   ══════════════════════════════════════════════ */
window.addEventListener('scroll', () =>
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 70));


/* ══════════════════════════════════════════════
   SPOT CARDS
   ══════════════════════════════════════════════ */
function renderSpots() {
  document.getElementById('spotsGrid').innerHTML = SPOTS.map((s, i) => `
    <div class="spot-card reveal" style="transition-delay:${i * .07}s">
      <img class="spot-img" src="${s.cardImg}" alt="${s.name}" loading="lazy"
        onerror="this.style.cssText='width:100%;height:100%;background:linear-gradient(135deg,#0077b6,#00b4d8)';this.src=''">
      <div class="spot-overlay"></div>
      <div class="spot-badge">${s.badge}</div>
      <div class="spot-info">
        <div class="spot-number">0${i + 1} · ${s.tags[0]}</div>
        <div class="spot-name">${s.name}</div>
        <div class="spot-location">📍 ${s.location}</div>
        <div class="spot-price">${s.price}</div>
        <div class="spot-actions">
          <button class="btn-view" onclick="event.stopPropagation(); openView(${s.id})">View Details</button>
          <button class="btn-book" onclick="event.stopPropagation(); openBooking(${s.id})">Book Now</button>
        </div>
      </div>
    </div>`).join('');
  initReveal();
}

function initReveal() {
  const obs = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
    { threshold: .08 }
  );
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}


/* ══════════════════════════════════════════════
   MODAL — View Spot Details
   ══════════════════════════════════════════════ */
function openView(id) {
  const s = SPOTS.find(x => x.id === id);
  if (!s) return;
  currentSpot = s;

  /* Hero image */
  const hi = document.getElementById('modalHeroImg');
  hi.src = s.cardImg; hi.alt = s.name;
  hi.onerror = () => { hi.style.background = 'linear-gradient(135deg,#0077b6,#00b4d8)'; hi.src = ''; };

  /* Text */
  document.getElementById('modalTitle').textContent = s.name;
  document.getElementById('modalLoc').textContent   = '📍 ' + s.location + '  ·  ⭐ ' + s.rating;
  document.getElementById('modalTags').innerHTML    = s.tags.map(t => `<span class="tag">${t}</span>`).join('');
  document.getElementById('modalDesc').textContent  = s.desc;

  /* Gallery */
  document.getElementById('photoGrid').innerHTML = s.galleryImgs.map((img, i) => `
    <div class="photo-item${i === 0 ? ' featured' : ''}">
      <img src="${img.url}" alt="${img.label}" loading="lazy"
        onerror="this.style.background='linear-gradient(135deg,#0077b6,#00b4d8)';this.src=''">
      <div class="photo-label">${img.label}</div>
    </div>`).join('');

  /* Accommodations */
  document.getElementById('accommGrid').innerHTML = s.accommodations.map(a => `
    <div class="accomm-card">
      <img class="accomm-img" src="${a.img}" alt="${a.name}" loading="lazy"
        onerror="this.style.background='linear-gradient(135deg,#0077b6,#00b4d8)';this.src=''">
      <div class="accomm-info">
        <div class="accomm-name">${a.name}</div>
        <div class="accomm-type">${a.type}</div>
        <div class="accomm-stars">${'★'.repeat(a.stars)}${'☆'.repeat(5 - a.stars)}</div>
        <div class="accomm-price">${a.price}</div>
        <div class="accomm-amen">${a.amenities.map(am => `<span class="tag">${am}</span>`).join('')}</div>
      </div>
    </div>`).join('');

  /* Booking dropdown */
  document.getElementById('bkAccomm').innerHTML = s.accommodations
    .map(a => `<option>${a.name} — ${a.price}</option>`).join('');

  switchTab('gallery');
  document.getElementById('viewModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function openBooking(id) {
  if (isGuest) { showToast('🔑 Login Required', 'Please create an account to book.', '#f77f00'); return; }
  openView(id);
  setTimeout(() => switchTab('booking'), 120);
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  document.body.style.overflow = '';
}

function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  const idx = ['gallery', 'accommodations', 'booking'].indexOf(tab);
  document.querySelectorAll('.tab-btn')[idx].classList.add('active');
}

/* Close modal on backdrop click or Escape */
document.getElementById('viewModal').addEventListener('click', function(e) {
  if (e.target === this) closeModal('viewModal');
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal('viewModal'); });


/* ══════════════════════════════════════════════
   BOOKING SUBMISSION
   ══════════════════════════════════════════════ */
function submitBooking() {
  if (isGuest) { showToast('🔑 Login Required', 'Please create an account to book.', '#f77f00'); return; }

  const name     = document.getElementById('bkName').value.trim();
  const email    = document.getElementById('bkEmail').value.trim();
  const checkin  = document.getElementById('bkCheckin').value;
  const checkout = document.getElementById('bkCheckout').value;
  const guests   = document.getElementById('bkGuests').value;
  const accomm   = document.getElementById('bkAccomm').value;
  const notes    = document.getElementById('bkNotes').value.trim();

  if (!name)                           { showToast('⚠️ Required',     'Enter your full name.',                        '#f77f00'); return; }
  if (!email || !email.includes('@'))  { showToast('⚠️ Invalid Email','Enter a valid email.',                         '#f77f00'); return; }
  if (!checkin || !checkout)           { showToast('⚠️ Missing Dates','Select check-in and check-out dates.',         '#f77f00'); return; }
  if (new Date(checkout) <= new Date(checkin)) { showToast('⚠️ Invalid Dates','Check-out must be after check-in.',   '#f77f00'); return; }

  const nights = Math.ceil((new Date(checkout) - new Date(checkin)) / 86400000);
  const ref    = 'CP' + Date.now().toString(36).toUpperCase().slice(-6);
  const bks    = DB.getBookings(currentUser.id);

  bks.unshift({
    id: Date.now(), ref,
    spotId:   currentSpot.id,
    spotName: currentSpot.name,
    spotImg:  currentSpot.cardImg,
    name, email, checkin, checkout, guests, accomm, notes, nights,
    status:  'confirmed',
    created: new Date().toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' })
  });

  DB.saveBookings(currentUser.id, bks);
  renderBookings(); updateStats();
  closeModal('viewModal');
  showToast('🌴 Booking Confirmed!', `${currentSpot.name} — Ref: ${ref}`, '#2d6a4f');

  /* Reset date & notes fields (keep name/email pre-filled) */
  ['bkCheckin', 'bkCheckout', 'bkNotes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}


/* ══════════════════════════════════════════════
   BOOKINGS DASHBOARD
   ══════════════════════════════════════════════ */
function renderBookings(filter, status) {
  filter = filter !== undefined ? filter : (document.getElementById('searchInput')?.value || '');
  status = status !== undefined ? status : activeFilter;
  const list = document.getElementById('bookingsList');

  if (!currentUser || isGuest) {
    list.innerHTML = `<div class="empty-state"><span class="empty-icon">🔑</span><p>Sign in to view and manage your bookings.</p></div>`;
    return;
  }

  const bks      = DB.getBookings(currentUser.id);
  const filtered = bks.filter(b => {
    const q         = filter.toLowerCase();
    const matchText = !q || b.spotName.toLowerCase().includes(q)
      || b.name.toLowerCase().includes(q) || b.ref.toLowerCase().includes(q);
    return matchText && (status === 'all' || b.status === status);
  });

  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state"><span class="empty-icon">🌊</span>
      <p>${filter || status !== 'all'
        ? 'No bookings match your search.'
        : 'No bookings yet.\nStart exploring Cebu!'}</p></div>`;
    return;
  }

  list.innerHTML = filtered.map(b => `
    <div class="booking-row">
      <img class="booking-thumb" src="${b.spotImg}" alt="${b.spotName}" loading="lazy"
        onerror="this.style.background='linear-gradient(135deg,#0077b6,#00b4d8)';this.src=''">
      <div>
        <div class="booking-spot">${b.spotName}</div>
        <div class="booking-meta">${b.name} · ${b.guests}</div>
        <div class="booking-ref">Ref: ${b.ref}</div>
        <div class="mini-btns">
          <button class="mini-btn vm"  onclick="openView(${b.spotId})">View Spot</button>
          <button class="mini-btn"     onclick="cancelBooking(${b.id})">Cancel</button>
        </div>
      </div>
      <div class="booking-dates">
        <strong>${fmtDate(b.checkin)} → ${fmtDate(b.checkout)}</strong>
        ${b.nights} night${b.nights !== 1 ? 's' : ''} · ${b.created}
      </div>
      <div class="booking-status s-${b.status}">${b.status}</div>
    </div>`).join('');
}

function cancelBooking(id) {
  const bks = DB.getBookings(currentUser.id);
  const idx = bks.findIndex(b => b.id === id);
  if (idx === -1) return;
  bks[idx].status = 'cancelled';
  DB.saveBookings(currentUser.id, bks);
  renderBookings(); updateStats();
  showToast('🗑️ Cancelled', 'Booking has been cancelled.', '#d62828');
}

function filterBookings() {
  renderBookings(document.getElementById('searchInput')?.value || '', activeFilter);
}

function setFilter(status, btn) {
  activeFilter = status;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('act'));
  if (btn) btn.classList.add('act');
  filterBookings();
}

function updateStats() {
  if (!currentUser || isGuest) return;
  const bks       = DB.getBookings(currentUser.id);
  const confirmed = bks.filter(b => b.status === 'confirmed').length;
  const upcoming  = bks.filter(b => b.status === 'confirmed' && new Date(b.checkin) >= new Date()).length;
  const spots     = new Set(bks.map(b => b.spotId)).size;
  document.getElementById('stTotal').textContent     = bks.length;
  document.getElementById('stConfirmed').textContent = confirmed;
  document.getElementById('stUpcoming').textContent  = upcoming;
  document.getElementById('stSpots').textContent     = spots;
}


/* ══════════════════════════════════════════════
   ADMIN — Users Table
   ══════════════════════════════════════════════ */
function renderUsersTable() {
  const users = DB.getUsers();
  document.getElementById('usersTableBody').innerHTML = users.map(u => `
    <tr>
      <td>
        <span class="user-avatar-sm">
          ${u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
        </span>
        ${u.name}
      </td>
      <td>${u.email}</td>
      <td><span class="role-badge role-${u.role}">${u.role}</span></td>
      <td>${u.joined}</td>
      <td>${DB.countBookings(u.id)}</td>
    </tr>`).join('');
}


/* ══════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════ */
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-PH', { month:'short', day:'numeric' });
}

function goTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior:'smooth' });
}

function setMinDates() {
  const today = new Date().toISOString().split('T')[0];
  const ci    = document.getElementById('bkCheckin');
  const co    = document.getElementById('bkCheckout');
  if (ci) { ci.min = today; ci.addEventListener('change', () => { if (co) co.min = ci.value; }); }
  if (co)   co.min = today;
}


/* ══════════════════════════════════════════════
   TOAST NOTIFICATION
   ══════════════════════════════════════════════ */
function showToast(title, msg, color) {
  const t = document.getElementById('toast');
  t.style.borderLeftColor = color || '#2d6a4f';
  document.getElementById('toastTitle').textContent = title;
  document.getElementById('toastMsg').textContent   = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 4500);
}


/* ══════════════════════════════════════════════
   KEYBOARD SHORTCUTS
   ══════════════════════════════════════════════ */
document.getElementById('loginPassword').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
document.getElementById('regConfirm').addEventListener('keydown',   e => { if (e.key === 'Enter') doRegister(); });


/* ══════════════════════════════════════════════
   BOOT — runs immediately on page load
   ══════════════════════════════════════════════ */
(function boot() {
  spawnParticles('authParticles', 18);

  /* Try to resume an existing session */
  const saved = DB.getSession();
  if (saved) {
    const freshUser = DB.findUser(saved.email);
    if (freshUser) { startSession(freshUser, false); return; }
  }

  /* Otherwise show the auth overlay */
  document.getElementById('authOverlay').style.display = 'flex';
})();