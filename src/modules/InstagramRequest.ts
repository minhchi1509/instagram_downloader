import axios, { AxiosError, AxiosInstance } from "axios";
import dayjs from "dayjs";
import {
  ICachedCursor,
  IMedia,
  IPost,
  IProfile,
  IReel,
  IStory,
} from "src/interfaces";
import CacheCursor from "src/modules/utils/CacheCursor";

class InstagramRequest {
  private axiosInstance: AxiosInstance;

  constructor(cookies: string) {
    this.axiosInstance = axios.create({
      baseURL: "https://www.instagram.com/graphql/query",
      headers: { cookie: cookies },
    });
    this.axiosInstance.interceptors.response.use(
      (res) => res,
      (error: AxiosError) => {
        if (error.response) {
          const responseData = error.response.data;
          throw new Error(
            `❌ Error when making request to Instagram: ${JSON.stringify(
              responseData,
              null,
              2
            )}`
          );
        }
        throw new Error(`❌ Unknown error: ${error.message}`);
      }
    );
  }

  getInforOfCurrentUser = async () => {
    const { data } = await this.axiosInstance.get("https://www.instagram.com/");
    const csrfTokenMatch = data.match(/"csrf_token":"(.*?)"/);
    const usernameMath = data.match(/"username":"(.*?)"/);
    if (!csrfTokenMatch || !usernameMath) {
      throw new Error("❌ Can't get CSRF token or username of your account");
    }
    const csrfToken = csrfTokenMatch[1];
    const username = usernameMath[1];
    return { csrfToken, username };
  };

  getInstagramIdByUsername = async (username: string) => {
    const { data } = await this.axiosInstance.get(
      `https://www.instagram.com/web/search/topsearch/?query=${username}`
    );
    if (!data?.users?.[0]?.user?.pk) {
      throw new Error(`❌ Can't get Instagram ID of user ${username}`);
    }
    return data.users[0].user.pk as string;
  };

  getProfileStatistics = async (username: string) => {
    const userId = await this.getInstagramIdByUsername(username);
    const { data } = await this.axiosInstance.get("/", {
      params: {
        doc_id: "8508998995859778",
        variables: JSON.stringify({
          id: userId,
          render_surface: "PROFILE",
        }),
      },
    });

    const user = data.data.user;
    const profileData: IProfile = {
      id: user.pk || user.pk,
      username: user.username,
      full_name: user.full_name,
      avatar_url: user.hd_profile_pic_url_info.url,
      follower: user.follower_count,
      following: user.following_count,
      is_private_account: user.is_private,
      total_posts: user.media_count,
    };
    return profileData;
  };

  getUserStories = async (username: string) => {
    const userId = await this.getInstagramIdByUsername(username);
    const { data: responseData } = await this.axiosInstance.get("/", {
      params: {
        query_hash: "45246d3fe16ccc6577e0bd297a5db1ab",
        variables: JSON.stringify({
          highlight_reel_ids: [],
          reel_ids: [userId],
          location_ids: [],
          precomposed_overlay: false,
        }),
      },
    });
    if (!responseData.data.reels_media.length) {
      return [];
    }
    const originalStoriesData = responseData.data.reels_media[0].items;
    const result: IStory[] = originalStoriesData.map((story: any) => ({
      id: story.id,
      takenAt: story.taken_at_timestamp,
      isVideo: story.is_video,
      downloadUrl: story.is_video
        ? story.video_resources[0].src
        : story.display_url,
    }));
    return result;
  };

  getReelDataByCode = async (reelCode: string): Promise<IReel> => {
    const { data } = await this.axiosInstance.get(
      `https://www.instagram.com/p/${reelCode}/?__a=1&__d=dis`
    );
    const reelOriginalData = data.items[0];
    return {
      id: reelOriginalData.id,
      code: reelOriginalData.code,
      commentCount: reelOriginalData.comment_count,
      takenAt: dayjs
        .unix(reelOriginalData.taken_at)
        .format("DD/MM/YYYY HH:mm:ss"),
      title: reelOriginalData.caption?.text,
      viewCount: reelOriginalData.play_count,
      likeCount: reelOriginalData.like_and_view_counts_disabled
        ? null
        : reelOriginalData.like_count,
      downloadUrl: reelOriginalData.video_versions[0].url,
    };
  };

  getUserReels = async (
    username: string,
    startCursor: string,
    totalFetchedReels: number,
    limit: number
  ) => {
    let hasMore = true;
    let endCursor = startCursor;
    const userReels: IReel[] = [];
    console.log(
      `🚀 Start getting reels of user ${username}. Fetch: ${totalFetchedReels}. Maximum: ${limit}`
    );
    const igUserId = await this.getInstagramIdByUsername(username);
    const baseQuery = {
      data: {
        include_feed_video: true,
        page_size: 12,
        target_user_id: igUserId,
      },
    };

    do {
      const { data } = await this.axiosInstance.get("/", {
        params: {
          doc_id: "8526372674115715",
          variables: JSON.stringify({
            ...baseQuery,
            after: endCursor,
          }),
        },
      });

      const reelsCode: string[] = data?.data?.[
        "xdt_api__v1__clips__user__connection_v2"
      ]?.edges?.map(({ node: reel }: any) => reel.media.code);
      const pageInfor =
        data?.data?.["xdt_api__v1__clips__user__connection_v2"]?.page_info;

      if (!reelsCode || !pageInfor) {
        console.log("😐 There are some errors. Start retrying...");
        continue;
      }

      userReels.push(
        ...(await Promise.all(reelsCode.map(this.getReelDataByCode)))
      );

      console.log(`🔥 Got ${userReels.length} reels...`);

      hasMore = pageInfor.has_next_page;
      endCursor = pageInfor.end_cursor;
    } while (hasMore && userReels.length < limit);

    const cacheCursorInfor: ICachedCursor = {
      nextCursor: hasMore ? endCursor : "",
      totalFetchedItems: hasMore ? totalFetchedReels + userReels.length : 0,
    };
    CacheCursor.writeCacheCursor(username, "REELS", cacheCursorInfor);
    hasMore
      ? console.log(
          `🔃 Got ${userReels.length} reels and still have reels left`
        )
      : console.log(
          `✅ Get all reels of user ${username} successfully. Total: ${
            userReels.length + totalFetchedReels
          }`
        );
    return userReels;
  };

  getAllHighlightsIdAndTitleOfUser = async (username: string) => {
    const userId = await this.getInstagramIdByUsername(username);
    const { data } = await this.axiosInstance.get("/", {
      params: {
        doc_id: "8198469583554901",
        variables: JSON.stringify({
          user_id: userId,
        }),
      },
    });
    const highlightsData: any[] = data.data.highlights.edges;
    const result = highlightsData.map((highlight) => ({
      id: highlight.node.id.split(":")[1] as string,
      title: highlight.node.title || null,
    }));
    return result;
  };

  getAllSubStoriesByHighlightId = async (highlightId: string) => {
    const { data } = await this.axiosInstance.get(
      `https://www.instagram.com/graphql/query/?query_hash=45246d3fe16ccc6577e0bd297a5db1ab&variables={"highlight_reel_ids":[${highlightId}],"reel_ids":[],"location_ids":[],"precomposed_overlay":false}`
    );
    const storiesMedia: any[] = data.data.reels_media[0].items;

    const result: IStory[] = storiesMedia.map((story) => ({
      id: story.id,
      isVideo: story.is_video,
      takenAt: story.taken_at_timestamp,
      downloadUrl: story.is_video
        ? story.video_resources[0].src
        : story.display_url,
    }));
    return result;
  };

  getUserPosts = async (
    username: string,
    startCursor: string,
    totalFetchedPosts: number,
    limit: number
  ): Promise<IPost[]> => {
    let hasMore = true;
    let endCursor = startCursor;
    const originaluserPosts: any[] = [];
    const baseQuery = {
      data: { count: 12 },
      username,
      __relay_internal__pv__PolarisIsLoggedInrelayprovider: true,
      __relay_internal__pv__PolarisFeedShareMenurelayprovider: true,
    };

    console.log(
      `🚀 Start getting posts of user ${username}. Fetched: ${totalFetchedPosts}. Maximum: ${limit}`
    );

    do {
      const { data } = await this.axiosInstance.get("/", {
        params: {
          doc_id: "8656566431124939",
          variables: JSON.stringify({
            ...baseQuery,
            after: endCursor,
          }),
        },
      });

      const posts: any[] =
        data?.data?.["xdt_api__v1__feed__user_timeline_graphql_connection"]
          ?.edges;
      const pageInfor =
        data?.data?.["xdt_api__v1__feed__user_timeline_graphql_connection"]
          ?.page_info;

      if (!posts || !pageInfor) {
        console.log("😐 There are some errors. Start retrying...");
        continue;
      }
      originaluserPosts.push(...posts);

      console.log(`🔥 Got ${originaluserPosts.length} posts...`);

      hasMore = pageInfor.has_next_page;
      endCursor = pageInfor.end_cursor;
    } while (hasMore && originaluserPosts.length < limit);

    const userPosts: IPost[] = originaluserPosts.map((post) => {
      const postData = post.node;
      const originalMediaList: any[] = Array.from(
        postData.carousel_media || [postData]
      );
      const videos: IMedia[] = originalMediaList
        .filter((media) => media.media_type === 2)
        .map((media) => ({
          downloadUrl: media.video_versions[0].url,
          id: media.id,
        }));

      const images: IMedia[] = originalMediaList
        .filter((media) => media.media_type === 1)
        .map((media) => ({
          downloadUrl: media.image_versions2.candidates[0].url,
          id: media.id,
        }));

      return {
        id: postData.id,
        code: postData.code,
        title: postData.caption?.text,
        takenAt: dayjs.unix(postData.taken_at).format("DD/MM/YYYY HH:mm:ss"),
        totalMedia: originalMediaList.length,
        videoCount: videos.length,
        imageCount: images.length,
        likeCount: postData.like_and_view_counts_disabled
          ? null
          : postData.like_count,
        commentCount: postData.comment_count,
        videos,
        images,
      };
    });
    const cacheCursorInfor: ICachedCursor = {
      nextCursor: hasMore ? endCursor : "",
      totalFetchedItems: hasMore ? totalFetchedPosts + userPosts.length : 0,
    };
    CacheCursor.writeCacheCursor(username, "POSTS", cacheCursorInfor);
    hasMore
      ? console.log(
          `🔃 Got ${userPosts.length} posts and still have posts left`
        )
      : console.log(
          `✅ Get all posts of user ${username} successfully. Total: ${
            userPosts.length + totalFetchedPosts
          }`
        );
    return userPosts;
  };

  clearProfilePostById = async (postId: string, csrfToken: string) => {
    await this.axiosInstance.post(
      `https://www.instagram.com/api/v1/web/create/${postId}/delete/?__s=p7ydkq:utmpms:ew6qri`,
      {},
      {
        headers: {
          "x-csrftoken": csrfToken,
        },
      }
    );
  };
}

export default InstagramRequest;
