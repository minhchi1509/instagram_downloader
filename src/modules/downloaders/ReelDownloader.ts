import path from "path";
import { IReel } from "src/interfaces";
import CacheCursor from "src/modules/utils/CacheCursor";
import InstagramRequest from "src/modules/InstagramRequest";
import DownloadUtils from "src/modules/utils/DownloadUtils";
import FileUtils from "src/modules/utils/FileUtils";
import PathUtils from "src/modules/utils/PathUtils";

class ReelsDownloader {
  private instagramRequest: InstagramRequest;
  private username: string;

  constructor(instagramRequest: InstagramRequest, username: string) {
    this.instagramRequest = instagramRequest;
    this.username = username;
  }

  private writeReelsStatisticToCsv = async (
    data: IReel[],
    totalFetchedReels: number
  ) => {
    const { REELS_SAVED_DIR } = PathUtils.getSavedUserMediaDirPath(
      this.username
    );
    const formattedData = data.map((item, index) => ({
      ordinal_number: index + totalFetchedReels + 1,
      reel_url: `https://instagram.com/reel/${item.code}`,
      taken_at: item.takenAt,
      view_count: item.viewCount,
      like_count: item.likeCount,
      comment_count: item.commentCount,
    }));
    const fileName = "reels_statistic.csv";
    FileUtils.appendUserDataToCsv(
      path.resolve(REELS_SAVED_DIR, fileName),
      formattedData
    );
  };

  private downloadReelsMedia = async (
    reels: IReel[],
    totalFetchedReels: number
  ) => {
    console.log(`🚀 Start downloading reels...`);
    const { REELS_SAVED_DIR } = PathUtils.getSavedUserMediaDirPath(
      this.username
    );
    await DownloadUtils.downloadByBatch(
      reels,
      async (reel: IReel, index: number) => {
        await DownloadUtils.downloadMedia(
          reel.downloadUrl,
          path.resolve(REELS_SAVED_DIR, `${index + totalFetchedReels}.mp4`)
        );
      },
      true
    );
    console.log(
      `✅ Downloaded reels successfully and saved to ${REELS_SAVED_DIR}!`
    );
  };

  downloadAllUserReels = async (
    writeStatisticFile: boolean = true,
    downloadMedia: boolean = false,
    limit: number = Infinity
  ) => {
    if (limit !== Infinity && limit % 12 !== 0) {
      throw new Error("❌ Limit must be a multiple of 12");
    }
    const cursor = CacheCursor.getCacheCursor(this.username, "REELS");
    const startCursor = cursor?.nextCursor || "";
    const totalFetchedReels = cursor?.totalFetchedItems || 0;
    const reelsData = await this.instagramRequest.getUserReels(
      this.username,
      startCursor,
      totalFetchedReels,
      limit
    );
    if (!reelsData.length) {
      console.log(`👀 No reels found for ${this.username}`);
      return;
    }
    if (writeStatisticFile) {
      await this.writeReelsStatisticToCsv(reelsData, totalFetchedReels);
    }
    if (downloadMedia) {
      await this.downloadReelsMedia(reelsData, totalFetchedReels);
    }
  };
}

export default ReelsDownloader;
