import path from "path";
import { IStory } from "src/interfaces";
import InstagramRequest from "src/modules/InstagramRequest";
import DownloadUtils from "src/modules/utils/DownloadUtils";
import PathUtils from "src/modules/utils/PathUtils";

class StoryDownloader {
  private instagramRequest: InstagramRequest;
  private username: string;

  constructor(instagramRequest: InstagramRequest, username: string) {
    this.instagramRequest = instagramRequest;
    this.username = username;
  }

  downloadAllUserStories = async () => {
    console.log(`🚀 Start downloading stories of ${this.username}`);
    const stories = await this.instagramRequest.getUserStories(this.username);
    if (!stories.length) {
      console.log(`👀 No stories found for ${this.username}`);
      return;
    }
    const { STORY_SAVED_DIR } = PathUtils.getSavedUserMediaDirPath(
      this.username
    );
    await DownloadUtils.downloadByBatch(
      stories,
      async (story: IStory) => {
        const filePath = path.resolve(
          STORY_SAVED_DIR,
          `${story.id}.${story.isVideo ? "mp4" : "jpg"}`
        );
        await DownloadUtils.downloadMedia(story.downloadUrl, filePath);
      },
      true
    );
    console.log(
      `✅ Downloaded all stories of ${this.username} successfully and saved to ${STORY_SAVED_DIR}`
    );
  };
}

export default StoryDownloader;
