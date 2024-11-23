import path from "path";
import { IMedia, IPost } from "src/interfaces";
import InstagramRequest from "src/modules/InstagramRequest";
import CacheCursor from "src/modules/utils/CacheCursor";
import DownloadUtils from "src/modules/utils/DownloadUtils";
import FileUtils from "src/modules/utils/FileUtils";
import PathUtils from "src/modules/utils/PathUtils";

class PostDownloader {
  private instagramRequest: InstagramRequest;
  private username: string;

  constructor(instagramRequest: InstagramRequest, username: string) {
    this.instagramRequest = instagramRequest;
    this.username = username;
  }

  private writePostStatisticToCsv = async (
    data: IPost[],
    totalFetchedPosts: number
  ) => {
    const { POSTS_SAVED_DIR } = PathUtils.getSavedUserMediaDirPath(
      this.username
    );
    const formattedData = data.map((item, index) => ({
      ordinal_number: index + totalFetchedPosts + 1,
      post_url: `https://instagram.com/p/${item.code}`,
      taken_at: item.takenAt,
      total_media: item.totalMedia,
      video_count: item.videoCount,
      image_count: item.imageCount,
      like_count: item.likeCount,
      comment_count: item.commentCount,
    }));
    const fileName = "posts_statistic.csv";
    FileUtils.appendUserDataToCsv(
      path.resolve(POSTS_SAVED_DIR, fileName),
      formattedData
    );
  };

  private downloadUserPostsMedia = async (
    postsData: IPost[],
    totalFetchedPosts: number
  ) => {
    console.log(`🚀 Start downloading posts media...`);
    const { POSTS_SAVED_DIR } = PathUtils.getSavedUserMediaDirPath(
      this.username
    );
    await DownloadUtils.downloadByBatch(
      postsData,
      async (post: IPost, index: number) => {
        const postDir = path.resolve(
          POSTS_SAVED_DIR,
          `post_${index + totalFetchedPosts}`
        );

        await DownloadUtils.downloadByBatch(
          post.videos,
          async (video: IMedia) => {
            await DownloadUtils.downloadMedia(
              video.downloadUrl,
              path.resolve(postDir, `${video.id}.mp4`)
            );
          }
        );
        await DownloadUtils.downloadByBatch(
          post.images,
          async (image: IMedia) => {
            await DownloadUtils.downloadMedia(
              image.downloadUrl,
              path.resolve(postDir, `${image.id}.jpg`)
            );
          }
        );
      },
      true
    );
    console.log(
      `✅ Download posts media successfully and saved to ${POSTS_SAVED_DIR}`
    );
  };

  downloadAllUserPosts = async (
    writeStatisticFile: boolean = true,
    downloadMedia: boolean = true,
    limit: number = Infinity
  ) => {
    if (limit !== Infinity && limit % 12 !== 0) {
      throw new Error("❌ Limit must be a multiple of 12");
    }
    const cursor = CacheCursor.getCacheCursor(this.username, "POSTS");
    const startCursor = cursor?.nextCursor || "";
    const totalFetchedPosts = cursor?.totalFetchedItems || 0;
    const postsData = await this.instagramRequest.getUserPosts(
      this.username,
      startCursor,
      totalFetchedPosts,
      limit
    );
    if (!postsData.length) {
      console.log(`👀 No posts found for ${this.username}`);
      return;
    }
    if (writeStatisticFile) {
      this.writePostStatisticToCsv(postsData, totalFetchedPosts);
    }
    if (downloadMedia) {
      await this.downloadUserPostsMedia(postsData, totalFetchedPosts);
    }
  };
}

export default PostDownloader;
