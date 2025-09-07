import { ErrorReporting } from '@google-cloud/error-reporting';
import { google } from 'googleapis';
import {
  createError,
  defineEventHandler,
  EventHandlerRequest,
  H3Event,
  readBody,
} from 'h3';

const credentials = {
  type: process.env['GOOGLE_SERVICE_ACCOUNT_TYPE'] || 'service_account',
  project_id: process.env['GOOGLE_SERVICE_ACCOUNT_PROJECT_ID'],
  private_key_id: process.env['GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID'],
  private_key: process.env['GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY']?.replace(
    /\\n/g,
    '\n',
  ),
  client_email: process.env['GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL'],
  client_id: process.env['GOOGLE_SERVICE_ACCOUNT_CLIENT_ID'],
  auth_uri:
    process.env['GOOGLE_SERVICE_ACCOUNT_AUTH_URI'] ||
    'https://accounts.google.com/o/oauth2/auth',
  token_uri:
    process.env['GOOGLE_SERVICE_ACCOUNT_TOKEN_URI'] ||
    'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url:
    process.env['GOOGLE_SERVICE_ACCOUNT_AUTH_PROVIDER_CERT_URL'] ||
    'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: process.env['GOOGLE_SERVICE_ACCOUNT_CLIENT_CERT_URL'],
  universe_domain:
    process.env['GOOGLE_SERVICE_ACCOUNT_UNIVERSE_DOMAIN'] || 'googleapis.com',
};

// Create JWT client
const auth = new google.auth.JWT(
  credentials.client_email,
  undefined,
  credentials.private_key,
  ['https://www.googleapis.com/auth/drive'],
);

// Create Drive client
const drive = google.drive({ version: 'v3', auth });

const errorReporting = new ErrorReporting({
  credentials,
  reportMode: 'always',
});

// Folder ID where files will be uploaded
const FOLDER_ID = process.env['GOOGLE_DRIVE_FOLDER_ID'];

export default defineEventHandler(async (event) => {
  switch (event.method) {
    case 'GET':
      try {
        const foldersResponse = await drive.files.list({
          q: `'${FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
          fields: 'files(id, name, parents)',
          pageSize: 1000,
        });

        const filesResponse = await drive.files.list({
          q: `'${FOLDER_ID}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false`,
          fields:
            'nextPageToken, files(id, name, mimeType, size, parents, thumbnailVersion)',
          pageSize: 50, // Smaller page size for files
        });

        const files = (filesResponse.data.files || []).map((f) => ({
          ...f,
          thumbnailUrl: f.thumbnailVersion
            ? `/api/thumb/${f.id}?v=${f.thumbnailVersion}`
            : null,
        }));

        return {
          folders: foldersResponse.data.files || [],
          files: files,
          nextPageToken: filesResponse.data.nextPageToken,
          summary: {
            totalFolders: foldersResponse.data.files?.length || 0,
            currentPageFiles: filesResponse.data.files?.length || 0,
            hasMoreFiles: !!filesResponse.data.nextPageToken,
          },
        };
      } catch (error) {
        console.error('Error fetching files:', error);
        errorReporting.report(error);
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to fetch files from Google Drive',
        });
      }
    case 'HEAD':
    case 'PATCH':
    case 'POST':
      return await handlePost(event);
    case 'PUT':
    case 'DELETE':
    default:
      return;
  }
});

const handlePost = async (event: H3Event<EventHandlerRequest>) => {
  try {
    // Read JSON body instead of multipart form data
    const { fileName, mimeType } = await readBody(event);

    if (!fileName) {
      return {
        status: 400,
        body: { error: 'fileName is required' },
      };
    }

    if (!FOLDER_ID) {
      return { status: 500, body: { error: 'Problem with folder config' } };
    }

    const driveFile = await drive.files.create({
      requestBody: { name: fileName, parents: [FOLDER_ID] },
      fields: 'id,name',
    });

    const accessToken = await auth.getAccessToken();

    if (!accessToken.token) {
      throw new Error('Failed to get access token');
    }

    const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${driveFile.data.id}?uploadType=media`;

    return {
      status: 200,
      body: {
        success: true,
        fileId: driveFile.data.id,
        fileName: driveFile.data.name,
        uploadUrl: uploadUrl,
        accessToken: accessToken.token,
        expiresAt: Date.now() + 50 * 60 * 1000, // 50 minutes (tokens usually last 1 hour)
        mimeType: mimeType || 'application/octet-stream',
        message: 'Upload URL generated successfully',
      },
    };
  } catch (error: any) {
    console.error('Error generating upload URL:', error);
    console.error('Folder ID being used:', FOLDER_ID);
    console.error('Service account email:', auth.email);
    errorReporting.report(error);

    return {
      status: 500,
      body: {
        error: 'Failed to generate upload URL',
        details: error.message,
      },
    };
  }
};
