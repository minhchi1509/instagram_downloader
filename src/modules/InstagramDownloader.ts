import HighlightDownloader from "src/modules/downloaders/HighlightDownloader";
import PostDownloader from "src/modules/downloaders/PostDownloader";
import ReelDownloader from "src/modules/downloaders/ReelDownloader";
import StoryDownloader from "src/modules/downloaders/StoryDownloader";
import InstagramRequest from "src/modules/InstagramRequest";

class InstagramDownloader {
  private instagramRequest: InstagramRequest;
  private username: string;
  public highlight: HighlightDownloader;
  public post: PostDownloader;
  public reel: ReelDownloader;
  public story: StoryDownloader;

  constructor(cookies: string, username: string) {
    this.instagramRequest = new InstagramRequest(cookies);
    this.username = username;
    this.highlight = new HighlightDownloader(
      this.instagramRequest,
      this.username
    );
    this.post = new PostDownloader(this.instagramRequest, this.username);
    this.reel = new ReelDownloader(this.instagramRequest, this.username);
    this.story = new StoryDownloader(this.instagramRequest, this.username);
  }

  getProfileInfor = async () => {
    const profileInfor = await this.instagramRequest.getProfileStatistics(
      this.username
    );
    return profileInfor;
  };
}

export default InstagramDownloader;
