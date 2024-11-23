import dayjs from "dayjs";
import path from "path";
import { IHighlightStory, IStory } from "src/interfaces";
import InstagramRequest from "src/modules/InstagramRequest";
import DownloadUtils from "src/modules/utils/DownloadUtils";
import FileUtils from "src/modules/utils/FileUtils";
import PathUtils from "src/modules/utils/PathUtils";

class HighlightDownloader {
  private instagramRequest: InstagramRequest;
  private username: string;

  constructor(instagramRequest: InstagramRequest, username: string) {
    this.instagramRequest = instagramRequest;
    this.username = username;
  }

  private getHighlightStoryStatistics = async () => {
    console.log(
      `🚀 Start getting highlight stories data of user ${this.username}...`
    );

    const highlightStories =
      await this.instagramRequest.getAllHighlightsIdAndTitleOfUser(
        this.username
      );
    const highlightStoriesWithStatistics: IHighlightStory[] = await Promise.all(
      highlightStories.map(async (highlightStory) => {
        const stories =
          await this.instagramRequest.getAllSubStoriesByHighlightId(
            highlightStory.id
          );
        const imageStoryCount = stories.filter(
          (story) => !story.isVideo
        ).length;
        const videoStoryCount = stories.filter((story) => story.isVideo).length;
        console.log(
          `🔥 Get highlight story ${highlightStory.id} with ${stories.length} stories`
        );
        return {
          ...highlightStory,
          totalStories: stories.length,
          imageStoryCount,
          videoStoryCount,
          stories,
        };
      })
    );
    console.log(
      `✅ Get total ${highlightStoriesWithStatistics.length} highlight stories data of user ${this.username} successfully!`
    );
    return highlightStoriesWithStatistics;
  };

  private downloadHighlightStoryMedia = async (
    highlightStoriesData: IHighlightStory[]
  ) => {
    console.log(`🚀 Start downloading highlight stories media...`);
    const baseDir = PathUtils.getSavedUserMediaDirPath(
      this.username
    ).HIGHLIGHT_SAVED_DIR;
    await DownloadUtils.downloadByBatch(
      highlightStoriesData,
      async (highlightStory: IHighlightStory) => {
        const highlightStoryDir = path.resolve(
          baseDir,
          `highlight_${highlightStory.id}`
        );

        await DownloadUtils.downloadByBatch(
          highlightStory.stories,
          async (story: IStory) => {
            const extension = story.isVideo ? "mp4" : "jpg";
            const fileName = `${story.id}.${extension}`;
            await DownloadUtils.downloadMedia(
              story.downloadUrl,
              path.resolve(highlightStoryDir, fileName)
            );
          }
        );
      },
      true
    );
    console.log(
      `✅ Download all highlight stories media successfully and saved to ${baseDir}`
    );
  };

  private writeHighlightStoryStatisticToFile = (
    highlightStoriesData: IHighlightStory[]
  ) => {
    const fileContent = {
      total_highlight_stories: highlightStoriesData.length,
      highlight_stories: highlightStoriesData.map((highlightStory) => ({
        id: highlightStory.id,
        title: highlightStory.title,
        total_stories: highlightStory.totalStories,
        image_story_count: highlightStory.imageStoryCount,
        video_story_count: highlightStory.videoStoryCount,
        stories: highlightStory.stories.map((story) => ({
          id: story.id,
          is_video: story.isVideo,
          taken_at: dayjs.unix(story.takenAt).format("DD/MM/YYYY HH:mm:ss"),
        })),
      })),
    };
    const baseDir = PathUtils.getSavedUserMediaDirPath(
      this.username
    ).HIGHLIGHT_SAVED_DIR;
    const fileName = "highlight_stories.json";
    FileUtils.writeToFile(
      path.resolve(baseDir, fileName),
      JSON.stringify(fileContent, null, 2)
    );
  };

  public downloadAllUserHighlightStories = async (
    writeStatisticFile: boolean = true,
    downloadMedia: boolean = true
  ) => {
    const highlightStoriesData = await this.getHighlightStoryStatistics();
    if (!highlightStoriesData.length) {
      console.log(`👀 No highlights found for ${this.username}`);
      return;
    }
    if (writeStatisticFile) {
      this.writeHighlightStoryStatisticToFile(highlightStoriesData);
    }
    if (downloadMedia) {
      await this.downloadHighlightStoryMedia(highlightStoriesData);
    }
  };
}

export default HighlightDownloader;
