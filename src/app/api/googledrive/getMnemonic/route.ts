import { NextResponse } from "next/server";
import { google } from "googleapis";
import CryptoJS from "crypto-js";

const ENCRYPTION_PASSWORD = process.env.MNEMONIC_ENCRYPTION_PASSWORD;
const BACKUP_FILE_NAME = "tkey_mnemonic_backup.txt";

export async function POST(request: Request) {
  if (!ENCRYPTION_PASSWORD) {
    console.error(
      "MNEMONIC_ENCRYPTION_PASSWORD is not set in environment variables."
    );
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  try {
    const { accessToken, fileId: clientFileId } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Missing accessToken" },
        { status: 400 }
      );
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    let fileIdToRead = clientFileId;

    if (!fileIdToRead) {
      const resSearch = await drive.files.list({
        q: `name='${BACKUP_FILE_NAME}' and trashed=false`,
        spaces: "drive",
        fields: "files(id, name)",
      });
      if (
        resSearch.data.files &&
        resSearch.data.files.length > 0 &&
        resSearch.data.files[0].id
      ) {
        fileIdToRead = resSearch.data.files[0].id;
      } else {
        return NextResponse.json(
          { error: "No backup file found on Google Drive." },
          { status: 404 }
        );
      }
    }

    const res = await drive.files.get(
      { fileId: fileIdToRead, alt: "media" },
      { responseType: "text" }
    );

    const encryptedMnemonic = res.data as string;
    const bytes = CryptoJS.AES.decrypt(encryptedMnemonic, ENCRYPTION_PASSWORD);
    const decryptedMnemonic = bytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedMnemonic) {
      return NextResponse.json(
        { error: "Failed to decrypt mnemonic." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mnemonic: decryptedMnemonic,
      fileId: fileIdToRead,
    });
  } catch (error) {
    console.error("Error getting mnemonic from Google Drive:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    // 404 Not Found のような特定のエラーをクライアントに返すことも検討

    if ((error as { code?: number })?.code === 404) {
      return NextResponse.json(
        {
          error: "Backup file not found on Google Drive.",
          details: errorMessage,
        },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        error: "Failed to get mnemonic from Google Drive.",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
