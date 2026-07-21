// Splash — brand moment + "Tap to begin" (doubles as the audio-unlock gesture).
import { el } from '../../core/dom.js';
import router from '../../core/router.js';
import audio from '../../core/audio.js';
import poseLoader from '../../data/pose-loader.js';
import { t } from '../../core/strings.js';

export default {
  id: 'splash',
  async mount(container) {
    const view = el('div.splash', {}, [
      el('div.splash-wheel', { 'aria-hidden': 'true' }, [
        el('div.splash-wheel-inner'),
        el('div.splash-yogi', {}, '🧘'),
      ]),
      el('h1.splash-title', {}, t('appName')),
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
      router.go('home');
    };
    begin.addEventListener('click', go);
  },
};
