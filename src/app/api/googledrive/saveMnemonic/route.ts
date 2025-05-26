import { NextResponse } from "next/server";
import { google } from "googleapis";
import CryptoJS from "crypto-js";

// 環境変数から暗号化パスワードを取得
const ENCRYPTION_PASSWORD = process.env.MNEMONIC_ENCRYPTION_PASSWORD;
// Google Driveに保存するファイル名
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
    const { accessToken, mnemonic, existingFileId } = await request.json();

    if (!accessToken || !mnemonic) {
      return NextResponse.json(
        { error: "Missing accessToken or mnemonic" },
        { status: 400 }
      );
    }

    // ニーモニックを暗号化
    const encryptedMnemonic = CryptoJS.AES.encrypt(
      mnemonic,
      ENCRYPTION_PASSWORD
    ).toString();

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const fileMetadata = {
      name: BACKUP_FILE_NAME,
    };
    const media = {
      mimeType: "text/plain",
      body: encryptedMnemonic,
    };

    let fileIdToUpdate = existingFileId;

    // もしクライアントから既存ファイルIDが渡されなかった場合、検索する
    // (より堅牢にするには、ユーザーIDに紐付けてファイルIDをDB等で管理することを推奨)
    if (!fileIdToUpdate) {
      const resSearch = await drive.files.list({
        q: `name='${BACKUP_FILE_NAME}' and trashed=false`, // ゴミ箱に入っていないファイルのみ検索
        spaces: "drive",
        fields: "files(id, name)",
      });
      if (
        resSearch.data.files &&
        resSearch.data.files.length > 0 &&
        resSearch.data.files[0].id
      ) {
        fileIdToUpdate = resSearch.data.files[0].id;
      }
    }

    if (fileIdToUpdate) {
      const res = await drive.files.update({
        fileId: fileIdToUpdate,
        media: media,
        fields: "id", // 更新されたファイルのIDを取得
      });
      return NextResponse.json({
        success: true,
        fileId: res.data.id,
        message: "Mnemonic backup updated on Google Drive.",
      });
    } else {
      const res = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: "id",
      });
      return NextResponse.json({
        success: true,
        fileId: res.data.id,
        message: "Mnemonic backup saved to Google Drive.",
      });
    }
  } catch (error) {
    console.error("Error saving mnemonic to Google Drive:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Failed to save mnemonic to Google Drive.",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
