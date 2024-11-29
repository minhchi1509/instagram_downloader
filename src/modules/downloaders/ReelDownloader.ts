import path from "path";
import { IReel } from "src/interfaces";
import CacheCursor from "src/modules/utils/CacheCursor";
import InstagramRequest from "src/modules/InstagramRequest";
import DownloadUtils from "src/modules/utils/DownloadUtils";
import FileUtils from "src/modules/utils/FileUtils";
import PathUtils from "src/modules/utils/PathUtils";

class ReelsDownloader {
  private instagramRequest: InstagramRequest;

  constructor(instagramRequest: InstagramRequest) {
    this.instagramRequest = instagramRequest;
  }

  private writeReelsStatisticToCsv = async (
    username: string,
    data: IReel[],
    totalFetchedReels: number
  ) => {
    const { REELS_SAVED_DIR } = PathUtils.getSavedUserMediaDirPath(username);
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
    username: string,
    reels: IReel[],
    totalFetchedReels: number
  ) => {
    console.log(`🚀 Start downloading reels...`);
    const { REELS_SAVED_DIR } = PathUtils.getSavedUserMediaDirPath(username);
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
    username: string,
    writeStatisticFile: boolean = true,
    downloadMedia: boolean = false,
    limit: number = Infinity
  ) => {
    if (limit !== Infinity && limit % 12 !== 0) {
      throw new Error("❌ Limit must be a multiple of 12");
    }
    const cursor = CacheCursor.getCacheCursor(username, "REELS");
    const startCursor = cursor?.nextCursor || "";
    const totalFetchedReels = cursor?.totalFetchedItems || 0;
    const reelsData = await this.instagramRequest.getUserReels(
      username,
      startCursor,
      totalFetchedReels,
      limit
    );
    if (!reelsData.length) {
      console.log(`👀 No reels found for ${username}`);
      return;
    }
    if (writeStatisticFile) {
      await this.writeReelsStatisticToCsv(
        username,
        reelsData,
        totalFetchedReels
      );
    }
    if (downloadMedia) {
      await this.downloadReelsMedia(username, reelsData, totalFetchedReels);
    }
  };

  downloadReelByCode = async (reelCode: string) => {
    console.log(`🚀 Start downloading reel with code ${reelCode}...`);
    const reelData = await this.instagramRequest.getReelDataByCode(reelCode);
    const downloadDir = PathUtils.getLocalDownloadDir();
    await DownloadUtils.downloadMedia(
      reelData.downloadUrl,
      path.resolve(downloadDir, `${reelCode}.mp4`)
    );
    console.log(
      `✅ Downloaded reel with code ${reelCode} successfully and saved to ${downloadDir}!`
    );
  };
}

export default ReelsDownloader;
