export interface DriveFetch {
  folders: DriveFolder[];
  files: DriveFile[];
  summary: FetchSummary;
  nextPageToken?: string;
}

export interface DriveFolder {
  parents: string[];
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
}

export interface DriveFile {
  parents: string[];
  id: string;
  name: string;
  mimeType: string;
  thumbnailUrl: string;
  createdTime: string;
  modifiedTime: string;
  size: string;
  selected?: boolean;
  thumbnailVersion: string;
  approved: boolean;
  tags: string[];
}

export interface FetchSummary {
  totalFolders: number;
  currentPageFiles: number;
  hasMoreFiles: boolean;
}
