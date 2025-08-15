export type PhotoFile = {
  file: File;
  src: string;
  state?: 'uploading' | 'success' | 'error';
};
