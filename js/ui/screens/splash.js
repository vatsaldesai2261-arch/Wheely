// Splash — brand moment + "Tap to begin" (doubles as the audio-unlock gesture).
import { el } from '../../core/dom.js';
import router from '../../core/router.js';
import audio from '../../core/audio.js';
import poseLoader from '../../data/pose-loader.js';
import settings from '../../core/settings.js';
import { t } from '../../core/strings.js';

export default {
  id: 'splash',
  async mount(container) {
    const view = el('div.splash', {}, [
      el('img.splash-mark', { src: './assets/brand/kaya-haus-mark.png', alt: '', 'aria-hidden': 'true' }),
      el('img.splash-word', { src: './assets/brand/kaya-haus-word.png', alt: t('appName') }),
      el('p.splash-product', {}, t('productName')),
      el('p.splash-tagline', {}, t('tagline')),
      el('button.btn.btn-primary.btn-xl.splash-begin', { type: 'button' }, t('tapToBegin')),
      el('p.splash-hint', {}, 'Best on an iPad, sideways 📱'),
    ]);
    container.append(view);

    const begin = view.querySelector('.splash-begin');
    const go = async () => {
      audio.unlock();
      audio.play('select');
      begin.disabled = true;
      begin.textContent = 'Loading poses…';
      try { await poseLoader.load(); } catch {}
      // First-ever launch → show How to Play; afterwards go Home.
      router.go(settings.tutorialSeen() ? 'home' : 'tutorial');
    };
    begin.addEventListener('click', go);
  },
};
