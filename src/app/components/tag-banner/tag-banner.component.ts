import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tag-banner',
  template: `
    <div
      class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg px-4 py-3 z-50 w-[100vw]"
    >
      <div class="flex items-center justify-between gap-3 max-w-md mx-auto">
        <!-- File count -->
        <div class="flex items-center gap-2 text-[#8d6e63]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="w-4 h-4"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
          <span class="text-sm font-medium">{{ fileCount }} slika</span>
        </div>

        <!-- Input field -->
        <input
          type="text"
          class="flex-1 px-3 py-2 border border-[#d7ccc8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8d6e63] focus:border-transparent"
          placeholder="Dodaj komentar..."
        />

        <!-- Upload button -->
        <button
          class="px-4 py-2 bg-[#8d6e63] text-white text-sm font-medium rounded-lg hover:bg-[#6d4c41] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          [disabled]="fileCount === 0"
          (click)="onUpload()"
        >
          Prenesi
        </button>
      </div>
    </div>
  `,
})
export class TagBannerComponent implements OnInit {
  fileCount = 0;

  constructor() {}

  ngOnInit() {}

  onUpload(): void {}
}
