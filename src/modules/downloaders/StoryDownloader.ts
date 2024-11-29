import path from "path";
import { IStory } from "src/interfaces";
import InstagramRequest from "src/modules/InstagramRequest";
import DownloadUtils from "src/modules/utils/DownloadUtils";
import PathUtils from "src/modules/utils/PathUtils";

class StoryDownloader {
  private instagramRequest: InstagramRequest;

  constructor(instagramRequest: InstagramRequest) {
    this.instagramRequest = instagramRequest;
  }

  downloadAllUserStories = async (username: string) => {
    console.log(`🚀 Start downloading stories of ${username}`);
    const stories = await this.instagramRequest.getUserStories(username);
    if (!stories.length) {
      console.log(`👀 No stories found for ${username}`);
      return;
    }
    const { STORY_SAVED_DIR } = PathUtils.getSavedUserMediaDirPath(username);
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
      `✅ Downloaded all stories of ${username} successfully and saved to ${STORY_SAVED_DIR}`
    );
  };
}

export default StoryDownloader;
