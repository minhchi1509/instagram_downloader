import HighlightDownloader from "src/modules/downloaders/HighlightDownloader";
import PostDownloader from "src/modules/downloaders/PostDownloader";
import ReelDownloader from "src/modules/downloaders/ReelDownloader";
import StoryDownloader from "src/modules/downloaders/StoryDownloader";
import InstagramRequest from "src/modules/InstagramRequest";

class InstagramDownloader {
  private instagramRequest: InstagramRequest;
  public highlight: HighlightDownloader;
  public post: PostDownloader;
  public reel: ReelDownloader;
  public story: StoryDownloader;

  constructor(cookies: string) {
    this.instagramRequest = new InstagramRequest(cookies);
    this.highlight = new HighlightDownloader(this.instagramRequest);
    this.post = new PostDownloader(this.instagramRequest);
    this.reel = new ReelDownloader(this.instagramRequest);
    this.story = new StoryDownloader(this.instagramRequest);
  }

  getProfileInfor = async (username: string) => {
    const profileInfor = await this.instagramRequest.getProfileStatistics(
      username
    );
    return profileInfor;
  };
}

export default InstagramDownloader;
