import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DriveFetch, DriveFile } from 'src/app/model/drive-fetch.model';

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  // Sample data - replace with your actual data source
  private images = signal<DriveFile[]>([]);

  readonly http = inject(HttpClient);

  readonly tags = ['tag 1', 'tag 2'];

  constructor() {
    this.http
      .get<DriveFetch>('/api/drive-upload')
      .pipe(takeUntilDestroyed())
      .subscribe((fetch) => this.images.set(fetch.files));
  }

  filterTag = signal<string>('');
  filterFolder = signal<string>('');

  // Computed properties for reactive updates
  filteredImages = computed(() => {
    const tagFilter = this.filterTag().toLowerCase().trim();
    const folderFilter = this.filterFolder().toLowerCase().trim();

    return this.images().filter((img) => {
      const matchesTag =
        !tagFilter ||
        this.tags.some((tag) => tag.toLowerCase().includes(tagFilter));
      const matchesFolder =
        !folderFilter ||
        img.parents.some((folder) =>
          folder.toLowerCase().includes(folderFilter),
        );

      return matchesTag && matchesFolder;
    });
  });

  selectedCount = computed(
    () => this.filteredImages().filter((img) => img.selected).length,
  );

  allSelected = computed(() => {
    const filtered = this.filteredImages();
    return filtered.length > 0 && filtered.every((img) => img.selected);
  });

  updateTagFilter(event: any) {
    this.filterTag.set(event.target.value);
  }

  updateFolderFilter(event: any) {
    this.filterFolder.set(event.target.value);
  }

  clearAllFilters() {
    this.filterTag.set('');
    this.filterFolder.set('');
  }

  hasActiveFilters(): boolean {
    return !!(this.filterTag() || this.filterFolder());
  }

  toggleSelection(imageId: string) {
    this.images.update((images) =>
      images.map((img) =>
        img.id === imageId ? { ...img, selected: !img.selected } : img,
      ),
    );
  }

  selectAll() {
    const shouldSelectAll = !this.allSelected();
    const filteredIds = new Set(this.filteredImages().map((img) => img.id));

    this.images.update((images) =>
      images.map((img) =>
        filteredIds.has(img.id) ? { ...img, selected: shouldSelectAll } : img,
      ),
    );
  }

  // Method to move selected images to folder (leave empty for your implementation)
  moveToFolder() {
    // Your implementation here
  }

  // Method to get selected images (for your TypeScript logic)
  getSelectedImages(): DriveFile[] {
    return this.images().filter((img) => img.selected);
  }

  // Method to update images (for your TypeScript logic)
  updateImages(newImages: DriveFile[]) {
    this.images.set(newImages);
  }
}
