import { type App } from 'vue';
import VueSimpleUploader from 'vue-simple-uploader'

export function setupUploader(app: App) {
  app.use(VueSimpleUploader);
}
