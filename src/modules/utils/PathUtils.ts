import { existsSync } from "fs";
import path from "path";

class PathUtils {
  static getLocalDownloadDir = () => {
    const LOCAL_DOWNLOAD_DIR = path.resolve(
      process.env.USERPROFILE || "",
      "Downloads"
    );
    if (!existsSync(LOCAL_DOWNLOAD_DIR)) {
      throw new Error("❌ Cannot find the download directory on your system");
    }
    return LOCAL_DOWNLOAD_DIR;
  };

  static getSavedUserMediaDirPath = (username: string) => {
    const LOCAL_DOWNLOAD_DIR = path.resolve(
      process.env.USERPROFILE || "",
      "Downloads"
    );
    if (!existsSync(LOCAL_DOWNLOAD_DIR)) {
      throw new Error("❌ Cannot find the download directory on your system");
    }
    const BASE_DIR = path.resolve(
      LOCAL_DOWNLOAD_DIR,
      "instagram_downloader",
      username
    );
    return {
      POSTS_SAVED_DIR: path.resolve(BASE_DIR, "posts"),
      REELS_SAVED_DIR: path.resolve(BASE_DIR, "reels"),
      HIGHLIGHT_SAVED_DIR: path.resolve(BASE_DIR, "highlights"),
      STORY_SAVED_DIR: path.resolve(BASE_DIR, "stories"),
    };
  };
}

export default PathUtils;
