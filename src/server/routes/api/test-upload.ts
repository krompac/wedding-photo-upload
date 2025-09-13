import { google } from 'googleapis';
import { defineEventHandler, getHeader, getQuery, readBody } from 'h3';

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
  token_uri:
    process.env['GOOGLE_SERVICE_ACCOUNT_TOKEN_URI'] ||
    'https://oauth2.googleapis.com/token',
};

const auth = new google.auth.JWT(
  credentials.client_email,
  undefined,
  credentials.private_key,
  ['https://www.googleapis.com/auth/drive'],
);

const FOLDER_ID = process.env['GOOGLE_DRIVE_FOLDER_ID'];

export default defineEventHandler(async (event) => {
  if (event.node.req.method === 'PUT') {
    try {
      const { fileType, offset, end, fileSize } = getQuery(event) as any;

      const sessionUrl =
        getHeader(event, 'X-Session-URL') || getHeader(event, 'x-session-url');

      if (!sessionUrl) {
        return { status: 400, ok: false, error: 'Session URL required' };
      }

      // Manual stream reading to avoid asyncIterator issue
      const chunk = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];

        event.node.req.on('data', (data: Buffer) => {
          chunks.push(data);
        });

        event.node.req.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        event.node.req.on('error', (error) => {
          reject(error);
        });
      });

      const headers = {
        'Content-Type': fileType,
        'Content-Range': `bytes ${offset}-${end - 1}/${fileSize}`,
        'Content-Length': chunk.length.toString(),
      };

      const resp = await fetch(sessionUrl, {
        method: 'PUT',
        headers,
        body: chunk,
      });

      return { status: resp.status, ok: resp.ok };
    } catch (error: any) {
      console.error('Error durgin upload session:', error.message);
      event.node.res.statusCode = 500;
      return {
        error: 'Failed to upload image',
        details: error.message,
      };
    }
  }

  if (event.node.req.method === 'POST') {
    try {
      const { fileName, mimeType } = await readBody(event);
      if (!fileName || !mimeType) {
        event.node.res.statusCode = 400;
        return { error: 'fileName and mimeType are required' };
      }

      // Get access token from service account
      const accessTokenResp = await auth.getAccessToken();
      if (!accessTokenResp.token) throw new Error('Failed to get access token');

      // Create resumable session using fetch
      const url =
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessTokenResp.token}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify({
          name: fileName,
          parents: [FOLDER_ID],
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Failed to create resumable session: ${res.status} ${text}`,
        );
      }

      const sessionUrl = res.headers.get('location');
      if (!sessionUrl) throw new Error('No resumable session URL returned');

      return {
        status: 200,
        body: {
          fileName,
          sessionUrl,
        },
      };
    } catch (error: any) {
      console.error('Error creating resumable upload session:', error.message);
      event.node.res.statusCode = 500;
      return {
        error: 'Failed to create resumable upload session',
        details: error.message,
      };
    }
  }

  return 'sjeb';
});
