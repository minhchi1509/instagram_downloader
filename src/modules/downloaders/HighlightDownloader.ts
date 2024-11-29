import dayjs from "dayjs";
import path from "path";
import { IHighlightStory, IStory } from "src/interfaces";
import InstagramRequest from "src/modules/InstagramRequest";
import DownloadUtils from "src/modules/utils/DownloadUtils";
import FileUtils from "src/modules/utils/FileUtils";
import PathUtils from "src/modules/utils/PathUtils";

class HighlightDownloader {
  private instagramRequest: InstagramRequest;

  constructor(instagramRequest: InstagramRequest) {
    this.instagramRequest = instagramRequest;
  }

  private getHighlightStoryStatistics = async (username: string) => {
    console.log(
      `🚀 Start getting highlight stories data of user ${username}...`
    );

    const highlightStories =
      await this.instagramRequest.getAllHighlightsIdAndTitleOfUser(username);
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
      `✅ Get total ${highlightStoriesWithStatistics.length} highlight stories data of user ${username} successfully!`
    );
    return highlightStoriesWithStatistics;
  };

  private downloadHighlightStoryMedia = async (
    username: string,
    highlightStoriesData: IHighlightStory[]
  ) => {
    console.log(`🚀 Start downloading highlight stories media...`);
    const baseDir =
      PathUtils.getSavedUserMediaDirPath(username).HIGHLIGHT_SAVED_DIR;
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
    username: string,
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
    const baseDir =
      PathUtils.getSavedUserMediaDirPath(username).HIGHLIGHT_SAVED_DIR;
    const fileName = "highlight_stories.json";
    FileUtils.writeToFile(
      path.resolve(baseDir, fileName),
      JSON.stringify(fileContent, null, 2)
    );
  };

  public downloadAllUserHighlightStories = async (
    username: string,
    writeStatisticFile: boolean = true,
    downloadMedia: boolean = true
  ) => {
    const highlightStoriesData = await this.getHighlightStoryStatistics(
      username
    );
    if (!highlightStoriesData.length) {
      console.log(`👀 No highlights found for ${username}`);
      return;
    }
    if (writeStatisticFile) {
      this.writeHighlightStoryStatisticToFile(username, highlightStoriesData);
    }
    if (downloadMedia) {
      await this.downloadHighlightStoryMedia(username, highlightStoriesData);
    }
  };

  public downloadHighlightStoryById = async (highlightId: string) => {
    const highlightStoriesData =
      await this.instagramRequest.getAllSubStoriesByHighlightId(highlightId);
    if (!highlightStoriesData.length) {
      console.log(`👀 No stories found for highlight ${highlightId}`);
      return;
    }
    console.log(
      `🚀 Start downloading stories media of highlight ${highlightId}...`
    );

    const saveDir = path.join(
      PathUtils.getLocalDownloadDir(),
      `highlight_${highlightId}`
    );
    await DownloadUtils.downloadByBatch(
      highlightStoriesData,
      async (story: IStory) => {
        const extension = story.isVideo ? "mp4" : "jpg";
        const fileName = `${story.id}.${extension}`;
        await DownloadUtils.downloadMedia(
          story.downloadUrl,
          path.resolve(saveDir, fileName)
        );
      },
      true
    );
    console.log(
      `✅ Download all stories media of highlight ${highlightId} successfully and saved to ${saveDir}`
    );
  };
}

export default HighlightDownloader;
