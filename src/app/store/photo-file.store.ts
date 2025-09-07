import { computed } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
} from '@ngrx/signals';
import {
  addEntity,
  EntityId,
  removeEntity,
  setAllEntities,
  updateEntity,
  withEntities,
} from '@ngrx/signals/entities';
import { PhotoFile } from '../model/photo-file.model';

const PhotoFileStore = signalStore(
  withEntities<PhotoFile>(),
  withComputed(({ entities }) => ({
    uploading: computed(() =>
      entities().some((file) => file.status === 'uploading'),
    ),
    uploadSuccess: computed(() => {
      const files = entities();

      return (
        files.length > 0 && files.every((file) => file.status === 'success')
      );
    }),
    fileCount: computed(() => entities().length),
  })),
  withMethods((store) => ({
    addPhotoFile(photoFile: PhotoFile): void {
      patchState(store, addEntity(photoFile));
    },
    removePhotoFile(id: EntityId): void {
      patchState(store, removeEntity(id));
    },
    updateStatus(id: EntityId, status: PhotoFile['status']): void {
      patchState(store, updateEntity({ id, changes: { status } }));
    },
    resetPhotos(): void {
      patchState(store, setAllEntities([] as PhotoFile[]));
    },
  })),
);

export default PhotoFileStore;
