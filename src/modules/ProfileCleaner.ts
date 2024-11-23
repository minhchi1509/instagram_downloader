import InstagramRequest from "src/modules/InstagramRequest";

class ProfileCleaner {
  private instagramRequest: InstagramRequest;

  constructor(cookies: string) {
    this.instagramRequest = new InstagramRequest(cookies);
  }

  clearAllPosts = async (limit: number = Infinity) => {
    const currentProfileInfor =
      await this.instagramRequest.getInforOfCurrentUser();
    const { username, csrfToken } = currentProfileInfor;

    const postsId = (
      await this.instagramRequest.getUserPosts(username, "", 0, limit)
    ).map((post) => post.id.split("_")[0]) as string[];
    console.log(`🚀 Start deleting ${postsId.length} posts...`);
    const BATCH_SIZE = 5;
    for (let i = 0; i < postsId.length; i += BATCH_SIZE) {
      const from = i;
      const to = Math.min(i + BATCH_SIZE, postsId.length);
      const batchPostsId = postsId.slice(from, to);
      await Promise.all(
        batchPostsId.map(async (postId) => {
          await this.instagramRequest.clearProfilePostById(postId, csrfToken);
        })
      );
      console.log(`🔥 Deleted ${to}/${postsId.length} post`);
    }
    console.log(`✅ Deleted ${postsId.length} posts successfully!`);
  };
}

export default ProfileCleaner;
