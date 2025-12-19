import { createApp } from 'vue';
import './plugins/assets';
import {
  setupAppVersionNotification,
  setupCaptcha,
  setupDayjs,
  setupIconifyOffline,
  setupLoading,
  setupNProgress,
  setupUploader
} from './plugins';
import { setupStore } from './store';
import { setupRouter } from './router';
import { setupI18n } from './locales';
import App from './App.vue';

async function setupApp() {
  setupLoading();

  setupNProgress();

  setupIconifyOffline();

  setupDayjs();

  const app = createApp(App);

  setupStore(app);

  await setupRouter(app);

  setupI18n(app);

  setupCaptcha(app);

  setupUploader(app);

  setupAppVersionNotification();

  app.mount('#app');
}

setupApp();
