import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface ImageItem {
  id: string;
  url: string;
  name: string;
  selected: boolean;
  tags: string[];
  folders: string[];
  description: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  // Sample data - replace with your actual data source
  private images = signal<ImageItem[]>([
    {
      id: '1',
      url: 'https://letsenhance.io/static/73136da51c245e80edc6ccfe44888a99/396e9/MainBefore.jpg',
      name: 'Summer Sunset',
      selected: false,
      tags: ['nature', 'sunset', 'outdoor'],
      folders: ['Vacation 2024', 'Summer'],
      description:
        'Beautiful sunset captured during our summer vacation at the beach',
    },
    {
      id: '2',
      url: 'https://img.freepik.com/free-photo/closeup-scarlet-macaw-from-side-view-scarlet-macaw-closeup-head_488145-3540.jpg',
      name: 'Mountain View',
      selected: false,
      tags: ['nature', 'mountain', 'landscape'],
      folders: ['Hiking Trip'],
      description: 'Stunning mountain landscape from our hiking adventure',
    },
    {
      id: '3',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Jpeg_thumb_artifacts_test.jpg/1200px-Jpeg_thumb_artifacts_test.jpg',
      name: 'City Lights',
      selected: false,
      tags: ['city', 'night', 'urban'],
      folders: ['Work Travel', 'Business'],
      description: 'City skyline at night during business trip',
    },
    {
      id: '4',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Jpeg_thumb_artifacts_test.jpg/1200px-Jpeg_thumb_artifacts_test.jpg',
      name: 'Beach Walk',
      selected: false,
      tags: ['beach', 'sunset', 'ocean'],
      folders: ['Vacation 2024'],
      description: 'Peaceful evening walk along the shore',
    },
    {
      id: '5',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Jpeg_thumb_artifacts_test.jpg/1200px-Jpeg_thumb_artifacts_test.jpg',
      name: 'Forest Path',
      selected: false,
      tags: ['nature', 'forest', 'hiking'],
      folders: ['Hiking Trip', 'Nature'],
      description: 'Winding path through the dense forest',
    },
    {
      id: '6',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Jpeg_thumb_artifacts_test.jpg/1200px-Jpeg_thumb_artifacts_test.jpg',
      name: 'Urban Architecture',
      selected: false,
      tags: ['city', 'architecture', 'urban'],
      folders: ['Work Travel'],
      description: 'Modern architectural design in downtown area',
    },
  ]);

  filterTag = signal<string>('');
  filterFolder = signal<string>('');
  filterDescription = signal<string>('');

  // Computed properties for reactive updates
  filteredImages = computed(() => {
    const tagFilter = this.filterTag().toLowerCase().trim();
    const folderFilter = this.filterFolder().toLowerCase().trim();
    const descFilter = this.filterDescription().toLowerCase().trim();

    return this.images().filter((img) => {
      const matchesTag =
        !tagFilter ||
        img.tags.some((tag) => tag.toLowerCase().includes(tagFilter));
      const matchesFolder =
        !folderFilter ||
        img.folders.some((folder) =>
          folder.toLowerCase().includes(folderFilter),
        );
      const matchesDesc =
        !descFilter || img.description.toLowerCase().includes(descFilter);

      return matchesTag && matchesFolder && matchesDesc;
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

  updateDescriptionFilter(event: any) {
    this.filterDescription.set(event.target.value);
  }

  clearAllFilters() {
    this.filterTag.set('');
    this.filterFolder.set('');
    this.filterDescription.set('');
  }

  hasActiveFilters(): boolean {
    return !!(
      this.filterTag() ||
      this.filterFolder() ||
      this.filterDescription()
    );
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
  getSelectedImages(): ImageItem[] {
    return this.images().filter((img) => img.selected);
  }

  // Method to update images (for your TypeScript logic)
  updateImages(newImages: ImageItem[]) {
    this.images.set(newImages);
  }
}
