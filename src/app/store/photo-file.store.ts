import { patchState, signalStore, withMethods } from '@ngrx/signals';
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
