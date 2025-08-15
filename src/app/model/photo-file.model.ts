export type PhotoFile = {
  id: string;
  file: File;
  src: string;
  state?: 'uploading' | 'success' | 'error';
};
