import { useDiskStore } from '@/store/modules/disk';
import { UploaderEngine } from './uploader-engine';

let engineInstance: UploaderEngine | null = null;

function getEngine(): UploaderEngine {
  if (!engineInstance) {
    engineInstance = new UploaderEngine({ maxConcurrent: 3 });
  }
  return engineInstance;
}

export function useUploader() {
  const engine = getEngine();
  const diskStore = useDiskStore();

  function upload(files: File[], parentId?: number) {
    const targetParentId = parentId ?? diskStore.currentParentId ?? 0;
    engine.addFiles(files, targetParentId);
  }

  function triggerFile(parentId?: number) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        upload(Array.from(files), parentId);
      }
    };
    input.click();
  }

  function triggerFolder(parentId?: number) {
    const input = document.createElement('input');
    input.type = 'file';
    input.setAttribute('webkitdirectory', '');
    input.setAttribute('directory', '');
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        upload(Array.from(files), parentId);
      }
    };
    input.click();
  }

  function pause(taskId: string) { engine.pause(taskId); }
  function resume(taskId: string) { engine.resume(taskId); }
  function cancel(taskId: string) { engine.cancel(taskId); }
  function retry(taskId: string) { engine.retry(taskId); }
  function pauseAll() { engine.pauseAll(); }
  function resumeAll() {
    const tasks = engine.getAllTasks();
    for (const task of tasks) {
      if (task.status === 'paused') {
        engine.resume(task.taskId);
      }
    }
  }

  return { upload, triggerFile, triggerFolder, pause, resume, cancel, retry, pauseAll, resumeAll };
}
