"use client";

export const useGoogleDrive = () => {
  const saveMnemonicToDrive = async (
    accessToken: string,
    mnemonic: string,
    existingFileId?: string | null
  ) => {
    const response = await fetch("/api/googledrive/saveMnemonic", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accessToken,
        mnemonic,
        existingFileId,
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        success: true,
        message: result.message,
        fileId: result.fileId,
      };
    } else {
      throw new Error(
        `Failed to save mnemonic to Google Drive: ${result.error} ${
          result.details || ""
        }`
      );
    }
  };

  const getMnemonicFromDrive = async (
    accessToken: string,
    fileId?: string | null
  ) => {
    const response = await fetch("/api/googledrive/getMnemonic", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accessToken,
        fileId,
      }),
    });

    const result = await response.json();

    if (response.ok && result.success && result.mnemonic) {
      return {
        success: true,
        mnemonic: result.mnemonic,
        fileId: result.fileId,
      };
    } else {
      if (response.status === 404) {
        throw new Error(
          "No backup file found on Google Drive. Please create a backup first using 'Backup New Share to Google Drive'."
        );
      } else {
        throw new Error(
          `Failed to recover mnemonic from Google Drive: ${result.error} ${
            result.details || ""
          }`
        );
      }
    }
  };

  return {
    saveMnemonicToDrive,
    getMnemonicFromDrive,
  };
};
