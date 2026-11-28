import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';
import { registerSW } from 'virtual:pwa-register';

// 更新が見つかったら、次回表示時に確実に新しい版へ切り替える。
// （インストール済み PWA が古いまま固まるのを防ぐ）
const hadController = !!navigator.serviceWorker?.controller;
let refreshing = false;
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  if (!hadController || refreshing) return;
  refreshing = true;
  window.location.reload();
});

registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    const check = () => registration.update().catch(() => {});
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check();
    });
    setInterval(check, 30 * 60 * 1000);
  },
});

const app = mount(App, { target: document.getElementById('app')! });

export default app;
