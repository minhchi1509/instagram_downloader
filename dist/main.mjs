// src/modules/downloaders/HighlightDownloader.ts
import dayjs from "dayjs";
import path4 from "path";

// src/modules/utils/DownloadUtils.ts
import axios from "axios";
import path from "path";
import fs from "fs";
var DownloadUtils = class {
};
DownloadUtils.downloadByBatch = async (data, downloadFunction, isLogProcess = false, batchSize = 5) => {
  for (let i = 0; i < data.length; i += batchSize) {
    const from = i;
    const to = Math.min(i + batchSize, data.length);
    const sliceData = data.slice(from, to);
    await Promise.all(
      sliceData.map(
        (item, index) => downloadFunction(item, from + index + 1)
      )
    );
    if (isLogProcess) {
      console.log(`\u{1F525}Downloaded ${to}/${data.length} items`);
    }
  }
};
DownloadUtils.downloadMedia = async (mediaDownloadUrl, outputPath) => {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const writer = fs.createWriteStream(outputPath);
  try {
    const response = await axios.get(mediaDownloadUrl, {
      responseType: "stream"
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } catch (error) {
    console.error("Error downloading file:", error);
    writer.close();
  }
};
var DownloadUtils_default = DownloadUtils;

// src/modules/utils/FileUtils.ts
import path2 from "path";
import fs2 from "fs";
import { parse, write } from "fast-csv";
var _FileUtils = class _FileUtils {
};
_FileUtils.writeToFile = (absolutePath, content) => {
  const dir = path2.dirname(absolutePath);
  if (!fs2.existsSync(dir)) {
    fs2.mkdirSync(dir, { recursive: true });
  }
  fs2.writeFileSync(absolutePath, content);
};
_FileUtils.readObjectFromJsonFile = (absolutePath) => {
  if (!fs2.existsSync(absolutePath)) {
    return null;
  }
  return JSON.parse(fs2.readFileSync(absolutePath, "utf-8"));
};
_FileUtils.readCSV = (filePath) => new Promise((resolve, reject) => {
  const allData = [];
  fs2.createReadStream(filePath).pipe(parse({ headers: true })).on("data", (row) => {
    allData.push(row);
  }).on("end", () => {
    resolve(allData);
  }).on("error", (error) => {
    reject(error);
  });
});
_FileUtils.writeCSV = async (filePath, data, includeHeader = true) => {
  const writeStream = fs2.createWriteStream(filePath);
  return new Promise((resolve, reject) => {
    write(data, { headers: includeHeader }).pipe(writeStream).on("finish", resolve).on("error", reject);
  });
};
_FileUtils.appendUserDataToCsv = async (filePath, data) => {
  if (fs2.existsSync(filePath)) {
    const oldData = await _FileUtils.readCSV(filePath);
    const newData = [...oldData, ...data];
    await _FileUtils.writeCSV(filePath, newData);
  } else {
    const dir = path2.dirname(filePath);
    if (!fs2.existsSync(dir)) {
      fs2.mkdirSync(dir, { recursive: true });
    }
    await _FileUtils.writeCSV(filePath, data);
  }
};
var FileUtils = _FileUtils;
var FileUtils_default = FileUtils;

// src/modules/utils/PathUtils.ts
import { existsSync } from "fs";
import path3 from "path";
var PathUtils = class {
};
PathUtils.getLocalDownloadDir = () => {
  const LOCAL_DOWNLOAD_DIR = path3.resolve(
    process.env.USERPROFILE || "",
    "Downloads"
  );
  if (!existsSync(LOCAL_DOWNLOAD_DIR)) {
    throw new Error("\u274C Cannot find the download directory on your system");
  }
  return LOCAL_DOWNLOAD_DIR;
};
PathUtils.getSavedUserMediaDirPath = (username) => {
  const LOCAL_DOWNLOAD_DIR = path3.resolve(
    process.env.USERPROFILE || "",
    "Downloads"
  );
  if (!existsSync(LOCAL_DOWNLOAD_DIR)) {
    throw new Error("\u274C Cannot find the download directory on your system");
  }
  const BASE_DIR = path3.resolve(
    LOCAL_DOWNLOAD_DIR,
    "instagram_downloader",
    username
  );
  return {
    POSTS_SAVED_DIR: path3.resolve(BASE_DIR, "posts"),
    REELS_SAVED_DIR: path3.resolve(BASE_DIR, "reels"),
    HIGHLIGHT_SAVED_DIR: path3.resolve(BASE_DIR, "highlights"),
    STORY_SAVED_DIR: path3.resolve(BASE_DIR, "stories")
  };
};
var PathUtils_default = PathUtils;

// src/modules/downloaders/HighlightDownloader.ts
var HighlightDownloader = class {
  constructor(instagramRequest) {
    this.getHighlightStoryStatistics = async (username) => {
      console.log(
        `\u{1F680} Start getting highlight stories data of user ${username}...`
      );
      const highlightStories = await this.instagramRequest.getAllHighlightsIdAndTitleOfUser(username);
      const highlightStoriesWithStatistics = await Promise.all(
        highlightStories.map(async (highlightStory) => {
          const stories = await this.instagramRequest.getAllSubStoriesByHighlightId(
            highlightStory.id
          );
          const imageStoryCount = stories.filter(
            (story) => !story.isVideo
          ).length;
          const videoStoryCount = stories.filter((story) => story.isVideo).length;
          console.log(
            `\u{1F525} Get highlight story ${highlightStory.id} with ${stories.length} stories`
          );
          return {
            ...highlightStory,
            totalStories: stories.length,
            imageStoryCount,
            videoStoryCount,
            stories
          };
        })
      );
      console.log(
        `\u2705 Get total ${highlightStoriesWithStatistics.length} highlight stories data of user ${username} successfully!`
      );
      return highlightStoriesWithStatistics;
    };
    this.downloadHighlightStoryMedia = async (username, highlightStoriesData) => {
      console.log(`\u{1F680} Start downloading highlight stories media...`);
      const baseDir = PathUtils_default.getSavedUserMediaDirPath(username).HIGHLIGHT_SAVED_DIR;
      await DownloadUtils_default.downloadByBatch(
        highlightStoriesData,
        async (highlightStory) => {
          const highlightStoryDir = path4.resolve(
            baseDir,
            `highlight_${highlightStory.id}`
          );
          await DownloadUtils_default.downloadByBatch(
            highlightStory.stories,
            async (story) => {
              const extension = story.isVideo ? "mp4" : "jpg";
              const fileName = `${story.id}.${extension}`;
              await DownloadUtils_default.downloadMedia(
                story.downloadUrl,
                path4.resolve(highlightStoryDir, fileName)
              );
            }
          );
        },
        true
      );
      console.log(
        `\u2705 Download all highlight stories media successfully and saved to ${baseDir}`
      );
    };
    this.writeHighlightStoryStatisticToFile = (username, highlightStoriesData) => {
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
            taken_at: dayjs.unix(story.takenAt).format("DD/MM/YYYY HH:mm:ss")
          }))
        }))
      };
      const baseDir = PathUtils_default.getSavedUserMediaDirPath(username).HIGHLIGHT_SAVED_DIR;
      const fileName = "highlight_stories.json";
      FileUtils_default.writeToFile(
        path4.resolve(baseDir, fileName),
        JSON.stringify(fileContent, null, 2)
      );
    };
    this.downloadAllUserHighlightStories = async (username, writeStatisticFile = true, downloadMedia = true) => {
      const highlightStoriesData = await this.getHighlightStoryStatistics(
        username
      );
      if (!highlightStoriesData.length) {
        console.log(`\u{1F440} No highlights found for ${username}`);
        return;
      }
      if (writeStatisticFile) {
        this.writeHighlightStoryStatisticToFile(username, highlightStoriesData);
      }
      if (downloadMedia) {
        await this.downloadHighlightStoryMedia(username, highlightStoriesData);
      }
    };
    this.downloadHighlightStoryById = async (highlightId) => {
      const highlightStoriesData = await this.instagramRequest.getAllSubStoriesByHighlightId(highlightId);
      if (!highlightStoriesData.length) {
        console.log(`\u{1F440} No stories found for highlight ${highlightId}`);
        return;
      }
      console.log(
        `\u{1F680} Start downloading stories media of highlight ${highlightId}...`
      );
      const saveDir = path4.join(
        PathUtils_default.getLocalDownloadDir(),
        `highlight_${highlightId}`
      );
      await DownloadUtils_default.downloadByBatch(
        highlightStoriesData,
        async (story) => {
          const extension = story.isVideo ? "mp4" : "jpg";
          const fileName = `${story.id}.${extension}`;
          await DownloadUtils_default.downloadMedia(
            story.downloadUrl,
            path4.resolve(saveDir, fileName)
          );
        },
        true
      );
      console.log(
        `\u2705 Download all stories media of highlight ${highlightId} successfully and saved to ${saveDir}`
      );
    };
    this.instagramRequest = instagramRequest;
  }
};
var HighlightDownloader_default = HighlightDownloader;

// src/modules/downloaders/PostDownloader.ts
import path6 from "path";

// src/modules/utils/CacheCursor.ts
import path5 from "path";
var _CacheCursor = class _CacheCursor {
};
_CacheCursor.getSavedCacheCursorPath = (username) => {
  return {
    POSTS_CACHE_CURSOR_PATH: path5.resolve(
      "cache_cursor",
      username,
      "posts.json"
    ),
    REELS_CACHE_CURSOR_PATH: path5.resolve(
      "cache_cursor",
      username,
      "reels.json"
    )
  };
};
_CacheCursor.writeCacheCursor = (username, mediaType, cursor) => {
  const { POSTS_CACHE_CURSOR_PATH, REELS_CACHE_CURSOR_PATH } = _CacheCursor.getSavedCacheCursorPath(username);
  const mappedPath = {
    POSTS: POSTS_CACHE_CURSOR_PATH,
    REELS: REELS_CACHE_CURSOR_PATH
  };
  FileUtils_default.writeToFile(
    mappedPath[mediaType],
    JSON.stringify(cursor, null, 2)
  );
};
_CacheCursor.getCacheCursor = (username, mediaType) => {
  const { POSTS_CACHE_CURSOR_PATH, REELS_CACHE_CURSOR_PATH } = _CacheCursor.getSavedCacheCursorPath(username);
  const mappedPath = {
    POSTS: POSTS_CACHE_CURSOR_PATH,
    REELS: REELS_CACHE_CURSOR_PATH
  };
  return FileUtils_default.readObjectFromJsonFile(
    mappedPath[mediaType]
  );
};
var CacheCursor = _CacheCursor;
var CacheCursor_default = CacheCursor;

// src/modules/downloaders/PostDownloader.ts
var PostDownloader = class {
  constructor(instagramRequest) {
    this.writePostStatisticToCsv = async (username, data, totalFetchedPosts) => {
      const { POSTS_SAVED_DIR } = PathUtils_default.getSavedUserMediaDirPath(username);
      const formattedData = data.map((item, index) => ({
        ordinal_number: index + totalFetchedPosts + 1,
        post_url: `https://instagram.com/p/${item.code}`,
        taken_at: item.takenAt,
        total_media: item.totalMedia,
        video_count: item.videoCount,
        image_count: item.imageCount,
        like_count: item.likeCount,
        comment_count: item.commentCount
      }));
      const fileName = "posts_statistic.csv";
      FileUtils_default.appendUserDataToCsv(
        path6.resolve(POSTS_SAVED_DIR, fileName),
        formattedData
      );
    };
    this.downloadUserPostsMedia = async (username, postsData, totalFetchedPosts) => {
      console.log(`\u{1F680} Start downloading posts media...`);
      const { POSTS_SAVED_DIR } = PathUtils_default.getSavedUserMediaDirPath(username);
      await DownloadUtils_default.downloadByBatch(
        postsData,
        async (post, index) => {
          const postDir = path6.resolve(
            POSTS_SAVED_DIR,
            `post_${index + totalFetchedPosts}`
          );
          await DownloadUtils_default.downloadByBatch(
            post.videos,
            async (video) => {
              await DownloadUtils_default.downloadMedia(
                video.downloadUrl,
                path6.resolve(postDir, `${video.id}.mp4`)
              );
            }
          );
          await DownloadUtils_default.downloadByBatch(
            post.images,
            async (image) => {
              await DownloadUtils_default.downloadMedia(
                image.downloadUrl,
                path6.resolve(postDir, `${image.id}.jpg`)
              );
            }
          );
        },
        true
      );
      console.log(
        `\u2705 Download posts media successfully and saved to ${POSTS_SAVED_DIR}`
      );
    };
    this.downloadAllUserPosts = async (username, writeStatisticFile = true, downloadMedia = true, limit = Infinity) => {
      if (limit !== Infinity && limit % 12 !== 0) {
        throw new Error("\u274C Limit must be a multiple of 12");
      }
      const cursor = CacheCursor_default.getCacheCursor(username, "POSTS");
      const startCursor = cursor?.nextCursor || "";
      const totalFetchedPosts = cursor?.totalFetchedItems || 0;
      const postsData = await this.instagramRequest.getUserPosts(
        username,
        startCursor,
        totalFetchedPosts,
        limit
      );
      if (!postsData.length) {
        console.log(`\u{1F440} No posts found for ${username}`);
        return;
      }
      if (writeStatisticFile) {
        this.writePostStatisticToCsv(username, postsData, totalFetchedPosts);
      }
      if (downloadMedia) {
        await this.downloadUserPostsMedia(username, postsData, totalFetchedPosts);
      }
    };
    this.downloadPostByCode = async (postCode) => {
      const postData = await this.instagramRequest.getPostDataByCode(postCode);
      console.log(`\u{1F680} Start downloading all media of post ${postCode}...`);
      const saveDir = path6.resolve(
        PathUtils_default.getLocalDownloadDir(),
        `post_${postCode}`
      );
      const downloadVideos = postData.videos.map(async (video) => {
        await DownloadUtils_default.downloadMedia(
          video.downloadUrl,
          path6.resolve(saveDir, `${video.id}.mp4`)
        );
      });
      const downloadImages = postData.images.map(async (image) => {
        await DownloadUtils_default.downloadMedia(
          image.downloadUrl,
          path6.resolve(saveDir, `${image.id}.jpg`)
        );
      });
      await Promise.all([...downloadVideos, ...downloadImages]);
      console.log(`\u2705 Download successfully and saved to ${saveDir}`);
    };
    this.instagramRequest = instagramRequest;
  }
};
var PostDownloader_default = PostDownloader;

// src/modules/downloaders/ReelDownloader.ts
import path7 from "path";
var ReelsDownloader = class {
  constructor(instagramRequest) {
    this.writeReelsStatisticToCsv = async (username, data, totalFetchedReels) => {
      const { REELS_SAVED_DIR } = PathUtils_default.getSavedUserMediaDirPath(username);
      const formattedData = data.map((item, index) => ({
        ordinal_number: index + totalFetchedReels + 1,
        reel_url: `https://instagram.com/reel/${item.code}`,
        taken_at: item.takenAt,
        view_count: item.viewCount,
        like_count: item.likeCount,
        comment_count: item.commentCount
      }));
      const fileName = "reels_statistic.csv";
      FileUtils_default.appendUserDataToCsv(
        path7.resolve(REELS_SAVED_DIR, fileName),
        formattedData
      );
    };
    this.downloadReelsMedia = async (username, reels, totalFetchedReels) => {
      console.log(`\u{1F680} Start downloading reels...`);
      const { REELS_SAVED_DIR } = PathUtils_default.getSavedUserMediaDirPath(username);
      await DownloadUtils_default.downloadByBatch(
        reels,
        async (reel, index) => {
          await DownloadUtils_default.downloadMedia(
            reel.downloadUrl,
            path7.resolve(REELS_SAVED_DIR, `${index + totalFetchedReels}.mp4`)
          );
        },
        true
      );
      console.log(
        `\u2705 Downloaded reels successfully and saved to ${REELS_SAVED_DIR}!`
      );
    };
    this.downloadAllUserReels = async (username, writeStatisticFile = true, downloadMedia = false, limit = Infinity) => {
      if (limit !== Infinity && limit % 12 !== 0) {
        throw new Error("\u274C Limit must be a multiple of 12");
      }
      const cursor = CacheCursor_default.getCacheCursor(username, "REELS");
      const startCursor = cursor?.nextCursor || "";
      const totalFetchedReels = cursor?.totalFetchedItems || 0;
      const reelsData = await this.instagramRequest.getUserReels(
        username,
        startCursor,
        totalFetchedReels,
        limit
      );
      if (!reelsData.length) {
        console.log(`\u{1F440} No reels found for ${username}`);
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
    this.downloadReelByCode = async (reelCode) => {
      console.log(`\u{1F680} Start downloading reel with code ${reelCode}...`);
      const reelData = await this.instagramRequest.getReelDataByCode(reelCode);
      const downloadDir = PathUtils_default.getLocalDownloadDir();
      await DownloadUtils_default.downloadMedia(
        reelData.downloadUrl,
        path7.resolve(downloadDir, `${reelCode}.mp4`)
      );
      console.log(
        `\u2705 Downloaded reel with code ${reelCode} successfully and saved to ${downloadDir}!`
      );
    };
    this.instagramRequest = instagramRequest;
  }
};
var ReelDownloader_default = ReelsDownloader;

// src/modules/downloaders/StoryDownloader.ts
import path8 from "path";
var StoryDownloader = class {
  constructor(instagramRequest) {
    this.downloadAllUserStories = async (username) => {
      console.log(`\u{1F680} Start downloading stories of ${username}`);
      const stories = await this.instagramRequest.getUserStories(username);
      if (!stories.length) {
        console.log(`\u{1F440} No stories found for ${username}`);
        return;
      }
      const { STORY_SAVED_DIR } = PathUtils_default.getSavedUserMediaDirPath(username);
      await DownloadUtils_default.downloadByBatch(
        stories,
        async (story) => {
          const filePath = path8.resolve(
            STORY_SAVED_DIR,
            `${story.id}.${story.isVideo ? "mp4" : "jpg"}`
          );
          await DownloadUtils_default.downloadMedia(story.downloadUrl, filePath);
        },
        true
      );
      console.log(
        `\u2705 Downloaded all stories of ${username} successfully and saved to ${STORY_SAVED_DIR}`
      );
    };
    this.instagramRequest = instagramRequest;
  }
};
var StoryDownloader_default = StoryDownloader;

// src/modules/InstagramRequest.ts
import axios2 from "axios";
import dayjs2 from "dayjs";
var InstagramRequest = class {
  constructor(cookies) {
    this.getInforOfCurrentUser = async () => {
      const { data } = await this.axiosInstance.get("https://www.instagram.com/");
      const csrfTokenMatch = data.match(/"csrf_token":"(.*?)"/);
      const usernameMath = data.match(/"username":"(.*?)"/);
      if (!csrfTokenMatch || !usernameMath) {
        throw new Error("\u274C Can't get CSRF token or username of your account");
      }
      const csrfToken = csrfTokenMatch[1];
      const username = usernameMath[1];
      return { csrfToken, username };
    };
    this.getInstagramIdByUsername = async (username) => {
      const { data } = await this.axiosInstance.get(
        `https://www.instagram.com/web/search/topsearch/?query=${username}`
      );
      if (!data?.users?.[0]?.user?.pk) {
        throw new Error(`\u274C Can't get Instagram ID of user ${username}`);
      }
      return data.users[0].user.pk;
    };
    this.getProfileStatistics = async (username) => {
      const userId = await this.getInstagramIdByUsername(username);
      const { data } = await this.axiosInstance.get("/", {
        params: {
          doc_id: "8508998995859778",
          variables: JSON.stringify({
            id: userId,
            render_surface: "PROFILE"
          })
        }
      });
      const user = data.data.user;
      const profileData = {
        id: user.pk || user.pk,
        username: user.username,
        full_name: user.full_name,
        avatar_url: user.hd_profile_pic_url_info.url,
        follower: user.follower_count,
        following: user.following_count,
        is_private_account: user.is_private,
        total_posts: user.media_count
      };
      return profileData;
    };
    this.getUserStories = async (username) => {
      const userId = await this.getInstagramIdByUsername(username);
      const { data: responseData } = await this.axiosInstance.get("/", {
        params: {
          query_hash: "45246d3fe16ccc6577e0bd297a5db1ab",
          variables: JSON.stringify({
            highlight_reel_ids: [],
            reel_ids: [userId],
            location_ids: [],
            precomposed_overlay: false
          })
        }
      });
      if (!responseData.data.reels_media.length) {
        return [];
      }
      const originalStoriesData = responseData.data.reels_media[0].items;
      const result = originalStoriesData.map((story) => ({
        id: story.id,
        takenAt: story.taken_at_timestamp,
        isVideo: story.is_video,
        downloadUrl: story.is_video ? story.video_resources[0].src : story.display_url
      }));
      return result;
    };
    this.getReelDataByCode = async (reelCode) => {
      const { data } = await this.axiosInstance.get(
        `https://www.instagram.com/p/${reelCode}/?__a=1&__d=dis`
      );
      const reelOriginalData = data.items[0];
      return {
        id: reelOriginalData.id,
        code: reelOriginalData.code,
        commentCount: reelOriginalData.comment_count,
        takenAt: dayjs2.unix(reelOriginalData.taken_at).format("DD/MM/YYYY HH:mm:ss"),
        title: reelOriginalData.caption?.text,
        viewCount: reelOriginalData.play_count,
        likeCount: reelOriginalData.like_and_view_counts_disabled ? null : reelOriginalData.like_count,
        downloadUrl: reelOriginalData.video_versions[0].url
      };
    };
    this.getUserReels = async (username, startCursor, totalFetchedReels, limit) => {
      let hasMore = true;
      let endCursor = startCursor;
      const userReels = [];
      console.log(
        `\u{1F680} Start getting reels of user ${username}. Fetch: ${totalFetchedReels}. Maximum: ${limit}`
      );
      const igUserId = await this.getInstagramIdByUsername(username);
      const baseQuery = {
        data: {
          include_feed_video: true,
          page_size: 12,
          target_user_id: igUserId
        }
      };
      do {
        const { data } = await this.axiosInstance.get("/", {
          params: {
            doc_id: "8526372674115715",
            variables: JSON.stringify({
              ...baseQuery,
              after: endCursor
            })
          }
        });
        const reelsCode = data?.data?.["xdt_api__v1__clips__user__connection_v2"]?.edges?.map(({ node: reel }) => reel.media.code);
        const pageInfor = data?.data?.["xdt_api__v1__clips__user__connection_v2"]?.page_info;
        if (!reelsCode || !pageInfor) {
          console.log("\u{1F610} There are some errors. Start retrying...");
          continue;
        }
        userReels.push(
          ...await Promise.all(reelsCode.map(this.getReelDataByCode))
        );
        console.log(`\u{1F525} Got ${userReels.length} reels...`);
        hasMore = pageInfor.has_next_page;
        endCursor = pageInfor.end_cursor;
      } while (hasMore && userReels.length < limit);
      const cacheCursorInfor = {
        nextCursor: hasMore ? endCursor : "",
        totalFetchedItems: hasMore ? totalFetchedReels + userReels.length : 0
      };
      CacheCursor_default.writeCacheCursor(username, "REELS", cacheCursorInfor);
      hasMore ? console.log(
        `\u{1F503} Got ${userReels.length} reels and still have reels left`
      ) : console.log(
        `\u2705 Get all reels of user ${username} successfully. Total: ${userReels.length + totalFetchedReels}`
      );
      return userReels;
    };
    this.getAllHighlightsIdAndTitleOfUser = async (username) => {
      const userId = await this.getInstagramIdByUsername(username);
      const { data } = await this.axiosInstance.get("/", {
        params: {
          doc_id: "8198469583554901",
          variables: JSON.stringify({
            user_id: userId
          })
        }
      });
      const highlightsData = data.data.highlights.edges;
      const result = highlightsData.map((highlight) => ({
        id: highlight.node.id.split(":")[1],
        title: highlight.node.title || null
      }));
      return result;
    };
    this.getAllSubStoriesByHighlightId = async (highlightId) => {
      const { data } = await this.axiosInstance.get(
        `https://www.instagram.com/graphql/query/?query_hash=45246d3fe16ccc6577e0bd297a5db1ab&variables={"highlight_reel_ids":[${highlightId}],"reel_ids":[],"location_ids":[],"precomposed_overlay":false}`
      );
      const storiesMedia = data.data.reels_media[0].items;
      const result = storiesMedia.map((story) => ({
        id: story.id,
        isVideo: story.is_video,
        takenAt: story.taken_at_timestamp,
        downloadUrl: story.is_video ? story.video_resources[0].src : story.display_url
      }));
      return result;
    };
    this.getUserPosts = async (username, startCursor, totalFetchedPosts, limit) => {
      let hasMore = true;
      let endCursor = startCursor;
      const originaluserPosts = [];
      const baseQuery = {
        data: { count: 12 },
        username,
        __relay_internal__pv__PolarisIsLoggedInrelayprovider: true,
        __relay_internal__pv__PolarisFeedShareMenurelayprovider: true
      };
      console.log(
        `\u{1F680} Start getting posts of user ${username}. Fetched: ${totalFetchedPosts}. Maximum: ${limit}`
      );
      do {
        const { data } = await this.axiosInstance.get("/", {
          params: {
            doc_id: "8656566431124939",
            variables: JSON.stringify({
              ...baseQuery,
              after: endCursor
            })
          }
        });
        const posts = data?.data?.["xdt_api__v1__feed__user_timeline_graphql_connection"]?.edges;
        const pageInfor = data?.data?.["xdt_api__v1__feed__user_timeline_graphql_connection"]?.page_info;
        if (!posts || !pageInfor) {
          console.log("\u{1F610} There are some errors. Start retrying...");
          continue;
        }
        originaluserPosts.push(...posts);
        console.log(`\u{1F525} Got ${originaluserPosts.length} posts...`);
        hasMore = pageInfor.has_next_page;
        endCursor = pageInfor.end_cursor;
      } while (hasMore && originaluserPosts.length < limit);
      const userPosts = originaluserPosts.map((post) => {
        const postData = post.node;
        const originalMediaList = Array.from(
          postData.carousel_media || [postData]
        );
        const videos = originalMediaList.filter((media) => media.media_type === 2).map((media) => ({
          downloadUrl: media.video_versions[0].url,
          id: media.id
        }));
        const images = originalMediaList.filter((media) => media.media_type === 1).map((media) => ({
          downloadUrl: media.image_versions2.candidates[0].url,
          id: media.id
        }));
        return {
          id: postData.id,
          code: postData.code,
          title: postData.caption?.text,
          takenAt: dayjs2.unix(postData.taken_at).format("DD/MM/YYYY HH:mm:ss"),
          totalMedia: originalMediaList.length,
          videoCount: videos.length,
          imageCount: images.length,
          likeCount: postData.like_and_view_counts_disabled ? null : postData.like_count,
          commentCount: postData.comment_count,
          videos,
          images
        };
      });
      const cacheCursorInfor = {
        nextCursor: hasMore ? endCursor : "",
        totalFetchedItems: hasMore ? totalFetchedPosts + userPosts.length : 0
      };
      CacheCursor_default.writeCacheCursor(username, "POSTS", cacheCursorInfor);
      hasMore ? console.log(
        `\u{1F503} Got ${userPosts.length} posts and still have posts left`
      ) : console.log(
        `\u2705 Get all posts of user ${username} successfully. Total: ${userPosts.length + totalFetchedPosts}`
      );
      return userPosts;
    };
    this.getPostDataByCode = async (postCode) => {
      const { data } = await this.axiosInstance.get(
        `https://www.instagram.com/p/${postCode}/?__a=1&__d=dis`
      );
      const postData = data.items[0];
      const originalMediaList = Array.from(
        postData.carousel_media || [postData]
      );
      const videos = originalMediaList.filter((media) => media.media_type === 2).map((media) => ({
        downloadUrl: media.video_versions[0].url,
        id: media.id
      }));
      const images = originalMediaList.filter((media) => media.media_type === 1).map((media) => ({
        downloadUrl: media.image_versions2.candidates[0].url,
        id: media.id
      }));
      return {
        id: postData.id,
        code: postData.code,
        title: postData.caption?.text,
        takenAt: dayjs2.unix(postData.taken_at).format("DD/MM/YYYY HH:mm:ss"),
        totalMedia: originalMediaList.length,
        videoCount: videos.length,
        imageCount: images.length,
        likeCount: postData.like_and_view_counts_disabled ? null : postData.like_count,
        commentCount: postData.comment_count,
        videos,
        images
      };
    };
    this.clearProfilePostById = async (postId, csrfToken) => {
      await this.axiosInstance.post(
        `https://www.instagram.com/api/v1/web/create/${postId}/delete/?__s=p7ydkq:utmpms:ew6qri`,
        {},
        {
          headers: {
            "x-csrftoken": csrfToken
          }
        }
      );
    };
    this.axiosInstance = axios2.create({
      baseURL: "https://www.instagram.com/graphql/query",
      headers: { cookie: cookies }
    });
    this.axiosInstance.interceptors.response.use(
      (res) => res,
      (error) => {
        if (error.response) {
          const responseData = error.response.data;
          throw new Error(
            `\u274C Error when making request to Instagram: ${JSON.stringify(
              responseData,
              null,
              2
            )}`
          );
        }
        throw new Error(`\u274C Unknown error: ${error.message}`);
      }
    );
  }
};
var InstagramRequest_default = InstagramRequest;

// src/modules/InstagramDownloader.ts
var InstagramDownloader = class {
  constructor(cookies) {
    this.getProfileInfor = async (username) => {
      const profileInfor = await this.instagramRequest.getProfileStatistics(
        username
      );
      return profileInfor;
    };
    this.instagramRequest = new InstagramRequest_default(cookies);
    this.highlight = new HighlightDownloader_default(this.instagramRequest);
    this.post = new PostDownloader_default(this.instagramRequest);
    this.reel = new ReelDownloader_default(this.instagramRequest);
    this.story = new StoryDownloader_default(this.instagramRequest);
  }
};
var InstagramDownloader_default = InstagramDownloader;

// src/modules/ProfileCleaner.ts
var ProfileCleaner = class {
  constructor(cookies) {
    this.clearAllPosts = async (limit = Infinity) => {
      const currentProfileInfor = await this.instagramRequest.getInforOfCurrentUser();
      const { username, csrfToken } = currentProfileInfor;
      const postsId = (await this.instagramRequest.getUserPosts(username, "", 0, limit)).map((post) => post.id.split("_")[0]);
      console.log(`\u{1F680} Start deleting ${postsId.length} posts...`);
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
        console.log(`\u{1F525} Deleted ${to}/${postsId.length} post`);
      }
      console.log(`\u2705 Deleted ${postsId.length} posts successfully!`);
    };
    this.instagramRequest = new InstagramRequest_default(cookies);
  }
};
var ProfileCleaner_default = ProfileCleaner;
export {
  InstagramDownloader_default as InstagramDownloader,
  ProfileCleaner_default as ProfileCleaner
};
