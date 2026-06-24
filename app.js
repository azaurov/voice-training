import { ProfileScreen } from './src/screens/profile.js';
import { HomeScreen, bindHomeCards } from './src/screens/home.js';
import { ListScreen } from './src/screens/list.js';
import { RecorderScreen } from './src/screens/recorder.js';
import { SettingsScreen } from './src/screens/settings.js';
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
const settingsScreen = new SettingsScreen($('screen-settings'), { router });

router.register('profile',  profileScreen);
router.register('home',     homeScreen);
router.register('list',     listScreen);
router.register('recorder', recorderScreen);
router.register('settings', settingsScreen);

bindHomeCards($('screen-home'), router);

// Settings button in home header
$('btn-settings').addEventListener('click', () => {
  router.navigate('settings', { from: 'home' });
});

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

// ── Service Worker + Update Button ────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js', { scope: './' }).then(reg => {
    const updateBtn = $('btn-update');

    function showUpdateButton(waitingSW) {
      updateBtn.classList.add('visible');
      updateBtn.addEventListener('click', () => {
        waitingSW.postMessage('SKIP_WAITING');
        updateBtn.classList.remove('visible');
      }, { once: true });
    }

    // SW was already waiting when page loaded (e.g. after a hard refresh)
    if (reg.waiting && navigator.serviceWorker.controller) {
      showUpdateButton(reg.waiting);
    }

    // New SW found during this session
    reg.addEventListener('updatefound', () => {
      const newSW = reg.installing;
      newSW.addEventListener('statechange', () => {
        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateButton(newSW);
        }
      });
    });

    // When new SW takes control, reload to get fresh assets
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }).catch(() => {});
}
