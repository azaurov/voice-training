import { ProfileScreen } from './src/screens/profile.js';
import { HomeScreen, bindHomeCards } from './src/screens/home.js';
import { ListScreen } from './src/screens/list.js';
import { RecorderScreen } from './src/screens/recorder.js';
import { getCurrentProfile, getCurrentProfileId } from './src/auth/profiles.js';

// ── Router ─────────────────────────────────────────────────────────────────
const router = {
  _screens: {},
  _current: null,

  register(name, screen) {
    this._screens[name] = screen;
  },

  navigate(name, params = {}) {
    if (this._current) this._screens[this._current]?.hide();
    this._current = name;
    this._screens[name].show(params);
  }
};

// ── Bootstrap ──────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const profileScreen  = new ProfileScreen ($('screen-profile'),  { router });
const homeScreen     = new HomeScreen    ($('screen-home'),     { router });
const listScreen     = new ListScreen    ($('screen-list'),     { router });
const recorderScreen = new RecorderScreen($('screen-recorder'), { router });

router.register('profile',  profileScreen);
router.register('home',     homeScreen);
router.register('list',     listScreen);
router.register('recorder', recorderScreen);

bindHomeCards($('screen-home'), router);

// Start on profile picker if no current user, else go straight to home
if (getCurrentProfileId() && getCurrentProfile()) {
  router.navigate('home');
} else {
  router.navigate('profile');
}

// ── PWA install prompt ─────────────────────────────────────────────────────
let _deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  _deferredInstall = e;
  $('install-banner').classList.add('visible');
});

$('btn-install').addEventListener('click', async () => {
  if (!_deferredInstall) return;
  _deferredInstall.prompt();
  const { outcome } = await _deferredInstall.userChoice;
  if (outcome === 'accepted') $('install-banner').classList.remove('visible');
  _deferredInstall = null;
});

$('btn-install-dismiss').addEventListener('click', () => {
  $('install-banner').classList.remove('visible');
});

// ── Service Worker ─────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
}
