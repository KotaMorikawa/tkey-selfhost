import { NextResponse } from "next/server";
import { google } from "googleapis";

const BACKUP_FILE_NAME = "tkey_mnemonic_backup.txt";

export async function POST(request: Request) {
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

    let fileIdToDelete = clientFileId;

    // fileIdが指定されていない場合、ファイル名で検索
    if (!fileIdToDelete) {
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
        fileIdToDelete = resSearch.data.files[0].id;
      } else {
        return NextResponse.json(
          {
            success: true,
            message: "No backup file found to delete.",
            fileDeleted: false,
          },
          { status: 200 }
        );
      }
    }

    // ファイルを削除
    await drive.files.delete({
      fileId: fileIdToDelete,
    });

    return NextResponse.json({
      success: true,
      message: "Mnemonic backup file deleted from Google Drive.",
      fileDeleted: true,
      deletedFileId: fileIdToDelete,
    });
  } catch (error) {
    console.error("Error deleting mnemonic from Google Drive:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // 404 Not Found の場合は既に削除済みとして扱う
    if ((error as { code?: number })?.code === 404) {
      return NextResponse.json(
        {
          success: true,
          message: "File was already deleted or not found.",
          fileDeleted: false,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to delete mnemonic from Google Drive.",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
