import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { addUi, takeMagnetFromUrl } from './lib/state/addui.svelte';

const magnet = takeMagnetFromUrl(location, (url) => history.replaceState(null, '', url));
if (magnet) addUi.show(magnet);

mount(App, { target: document.getElementById('app')! });

// the service worker needs a secure context (https or localhost); skip silently elsewhere
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
