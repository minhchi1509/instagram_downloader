"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  InstagramDownloader: () => InstagramDownloader_default,
  ProfileCleaner: () => ProfileCleaner_default
});
module.exports = __toCommonJS(main_exports);

// src/modules/downloaders/HighlightDownloader.ts
var import_dayjs = __toESM(require("dayjs"));
var import_path4 = __toESM(require("path"));

// src/modules/utils/DownloadUtils.ts
var import_axios = __toESM(require("axios"));
var import_path = __toESM(require("path"));
var import_fs = __toESM(require("fs"));
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
  const dir = import_path.default.dirname(outputPath);
  if (!import_fs.default.existsSync(dir)) {
    import_fs.default.mkdirSync(dir, { recursive: true });
  }
  const writer = import_fs.default.createWriteStream(outputPath);
  try {
    const response = await import_axios.default.get(mediaDownloadUrl, {
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
var import_path2 = __toESM(require("path"));
var import_fs2 = __toESM(require("fs"));
var import_fast_csv = require("fast-csv");
var _FileUtils = class _FileUtils {
};
_FileUtils.writeToFile = (absolutePath, content) => {
  const dir = import_path2.default.dirname(absolutePath);
  if (!import_fs2.default.existsSync(dir)) {
    import_fs2.default.mkdirSync(dir, { recursive: true });
  }
  import_fs2.default.writeFileSync(absolutePath, content);
};
_FileUtils.readObjectFromJsonFile = (absolutePath) => {
  if (!import_fs2.default.existsSync(absolutePath)) {
    return null;
  }
  return JSON.parse(import_fs2.default.readFileSync(absolutePath, "utf-8"));
};
_FileUtils.readCSV = (filePath) => new Promise((resolve, reject) => {
  const allData = [];
  import_fs2.default.createReadStream(filePath).pipe((0, import_fast_csv.parse)({ headers: true })).on("data", (row) => {
    allData.push(row);
  }).on("end", () => {
    resolve(allData);
  }).on("error", (error) => {
    reject(error);
  });
});
_FileUtils.writeCSV = async (filePath, data, includeHeader = true) => {
  const writeStream = import_fs2.default.createWriteStream(filePath);
  return new Promise((resolve, reject) => {
    (0, import_fast_csv.write)(data, { headers: includeHeader }).pipe(writeStream).on("finish", resolve).on("error", reject);
  });
};
_FileUtils.appendUserDataToCsv = async (filePath, data) => {
  if (import_fs2.default.existsSync(filePath)) {
    const oldData = await _FileUtils.readCSV(filePath);
    const newData = [...oldData, ...data];
    await _FileUtils.writeCSV(filePath, newData);
  } else {
    const dir = import_path2.default.dirname(filePath);
    if (!import_fs2.default.existsSync(dir)) {
      import_fs2.default.mkdirSync(dir, { recursive: true });
    }
    await _FileUtils.writeCSV(filePath, data);
  }
};
var FileUtils = _FileUtils;
var FileUtils_default = FileUtils;

// src/modules/utils/PathUtils.ts
var import_fs3 = require("fs");
var import_path3 = __toESM(require("path"));
var PathUtils = class {
};
PathUtils.getSavedUserMediaDirPath = (username) => {
  const LOCAL_DOWNLOAD_DIR = import_path3.default.resolve(
    process.env.USERPROFILE || "",
    "Downloads"
  );
  if (!(0, import_fs3.existsSync)(LOCAL_DOWNLOAD_DIR)) {
    throw new Error("\u274C Cannot find the download directory on your system");
  }
  const BASE_DIR = import_path3.default.resolve(
    LOCAL_DOWNLOAD_DIR,
    "instagram_downloader",
    username
  );
  return {
    POSTS_SAVED_DIR: import_path3.default.resolve(BASE_DIR, "posts"),
    REELS_SAVED_DIR: import_path3.default.resolve(BASE_DIR, "reels"),
    HIGHLIGHT_SAVED_DIR: import_path3.default.resolve(BASE_DIR, "highlights"),
    STORY_SAVED_DIR: import_path3.default.resolve(BASE_DIR, "stories")
  };
};
var PathUtils_default = PathUtils;

// src/modules/downloaders/HighlightDownloader.ts
var HighlightDownloader = class {
  constructor(instagramRequest, username) {
    this.getHighlightStoryStatistics = async () => {
      console.log(
        `\u{1F680} Start getting highlight stories data of user ${this.username}...`
      );
      const highlightStories = await this.instagramRequest.getAllHighlightsIdAndTitleOfUser(
        this.username
      );
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
        `\u2705 Get total ${highlightStoriesWithStatistics.length} highlight stories data of user ${this.username} successfully!`
      );
      return highlightStoriesWithStatistics;
    };
    this.downloadHighlightStoryMedia = async (highlightStoriesData) => {
      console.log(`\u{1F680} Start downloading highlight stories media...`);
      const baseDir = PathUtils_default.getSavedUserMediaDirPath(
        this.username
      ).HIGHLIGHT_SAVED_DIR;
      await DownloadUtils_default.downloadByBatch(
        highlightStoriesData,
        async (highlightStory) => {
          const highlightStoryDir = import_path4.default.resolve(
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
                import_path4.default.resolve(highlightStoryDir, fileName)
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
    this.writeHighlightStoryStatisticToFile = (highlightStoriesData) => {
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
            taken_at: import_dayjs.default.unix(story.takenAt).format("DD/MM/YYYY HH:mm:ss")
          }))
        }))
      };
      const baseDir = PathUtils_default.getSavedUserMediaDirPath(
        this.username
      ).HIGHLIGHT_SAVED_DIR;
      const fileName = "highlight_stories.json";
      FileUtils_default.writeToFile(
        import_path4.default.resolve(baseDir, fileName),
        JSON.stringify(fileContent, null, 2)
      );
    };
    this.downloadAllUserHighlightStories = async (writeStatisticFile = true, downloadMedia = true) => {
      const highlightStoriesData = await this.getHighlightStoryStatistics();
      if (!highlightStoriesData.length) {
        console.log(`\u{1F440} No highlights found for ${this.username}`);
        return;
      }
      if (writeStatisticFile) {
        this.writeHighlightStoryStatisticToFile(highlightStoriesData);
      }
      if (downloadMedia) {
        await this.downloadHighlightStoryMedia(highlightStoriesData);
      }
    };
    this.instagramRequest = instagramRequest;
    this.username = username;
  }
};
var HighlightDownloader_default = HighlightDownloader;

// src/modules/downloaders/PostDownloader.ts
var import_path6 = __toESM(require("path"));

// src/modules/utils/CacheCursor.ts
var import_path5 = __toESM(require("path"));
var _CacheCursor = class _CacheCursor {
};
_CacheCursor.getSavedCacheCursorPath = (username) => {
  return {
    POSTS_CACHE_CURSOR_PATH: import_path5.default.resolve(
      "cache_cursor",
      username,
      "posts.json"
    ),
    REELS_CACHE_CURSOR_PATH: import_path5.default.resolve(
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
  constructor(instagramRequest, username) {
    this.writePostStatisticToCsv = async (data, totalFetchedPosts) => {
      const { POSTS_SAVED_DIR } = PathUtils_default.getSavedUserMediaDirPath(
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
        comment_count: item.commentCount
      }));
      const fileName = "posts_statistic.csv";
      FileUtils_default.appendUserDataToCsv(
        import_path6.default.resolve(POSTS_SAVED_DIR, fileName),
        formattedData
      );
    };
    this.downloadUserPostsMedia = async (postsData, totalFetchedPosts) => {
      console.log(`\u{1F680} Start downloading posts media...`);
      const { POSTS_SAVED_DIR } = PathUtils_default.getSavedUserMediaDirPath(
        this.username
      );
      await DownloadUtils_default.downloadByBatch(
        postsData,
        async (post, index) => {
          const postDir = import_path6.default.resolve(
            POSTS_SAVED_DIR,
            `post_${index + totalFetchedPosts}`
          );
          await DownloadUtils_default.downloadByBatch(
            post.videos,
            async (video) => {
              await DownloadUtils_default.downloadMedia(
                video.downloadUrl,
                import_path6.default.resolve(postDir, `${video.id}.mp4`)
              );
            }
          );
          await DownloadUtils_default.downloadByBatch(
            post.images,
            async (image) => {
              await DownloadUtils_default.downloadMedia(
                image.downloadUrl,
                import_path6.default.resolve(postDir, `${image.id}.jpg`)
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
    this.downloadAllUserPosts = async (writeStatisticFile = true, downloadMedia = true, limit = Infinity) => {
      if (limit !== Infinity && limit % 12 !== 0) {
        throw new Error("\u274C Limit must be a multiple of 12");
      }
      const cursor = CacheCursor_default.getCacheCursor(this.username, "POSTS");
      const startCursor = cursor?.nextCursor || "";
      const totalFetchedPosts = cursor?.totalFetchedItems || 0;
      const postsData = await this.instagramRequest.getUserPosts(
        this.username,
        startCursor,
        totalFetchedPosts,
        limit
      );
      if (!postsData.length) {
        console.log(`\u{1F440} No posts found for ${this.username}`);
        return;
      }
      if (writeStatisticFile) {
        this.writePostStatisticToCsv(postsData, totalFetchedPosts);
      }
      if (downloadMedia) {
        await this.downloadUserPostsMedia(postsData, totalFetchedPosts);
      }
    };
    this.instagramRequest = instagramRequest;
    this.username = username;
  }
};
var PostDownloader_default = PostDownloader;

// src/modules/downloaders/ReelDownloader.ts
var import_path7 = __toESM(require("path"));
var ReelsDownloader = class {
  constructor(instagramRequest, username) {
    this.writeReelsStatisticToCsv = async (data, totalFetchedReels) => {
      const { REELS_SAVED_DIR } = PathUtils_default.getSavedUserMediaDirPath(
        this.username
      );
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
        import_path7.default.resolve(REELS_SAVED_DIR, fileName),
        formattedData
      );
    };
    this.downloadReelsMedia = async (reels, totalFetchedReels) => {
      console.log(`\u{1F680} Start downloading reels...`);
      const { REELS_SAVED_DIR } = PathUtils_default.getSavedUserMediaDirPath(
        this.username
      );
      await DownloadUtils_default.downloadByBatch(
        reels,
        async (reel, index) => {
          await DownloadUtils_default.downloadMedia(
            reel.downloadUrl,
            import_path7.default.resolve(REELS_SAVED_DIR, `${index + totalFetchedReels}.mp4`)
          );
        },
        true
      );
      console.log(
        `\u2705 Downloaded reels successfully and saved to ${REELS_SAVED_DIR}!`
      );
    };
    this.downloadAllUserReels = async (writeStatisticFile = true, downloadMedia = false, limit = Infinity) => {
      if (limit !== Infinity && limit % 12 !== 0) {
        throw new Error("\u274C Limit must be a multiple of 12");
      }
      const cursor = CacheCursor_default.getCacheCursor(this.username, "REELS");
      const startCursor = cursor?.nextCursor || "";
      const totalFetchedReels = cursor?.totalFetchedItems || 0;
      const reelsData = await this.instagramRequest.getUserReels(
        this.username,
        startCursor,
        totalFetchedReels,
        limit
      );
      if (!reelsData.length) {
        console.log(`\u{1F440} No reels found for ${this.username}`);
        return;
      }
      if (writeStatisticFile) {
        await this.writeReelsStatisticToCsv(reelsData, totalFetchedReels);
      }
      if (downloadMedia) {
        await this.downloadReelsMedia(reelsData, totalFetchedReels);
      }
    };
    this.instagramRequest = instagramRequest;
    this.username = username;
  }
};
var ReelDownloader_default = ReelsDownloader;

// src/modules/downloaders/StoryDownloader.ts
var import_path8 = __toESM(require("path"));
var StoryDownloader = class {
  constructor(instagramRequest, username) {
    this.downloadAllUserStories = async () => {
      console.log(`\u{1F680} Start downloading stories of ${this.username}`);
      const stories = await this.instagramRequest.getUserStories(this.username);
      if (!stories.length) {
        console.log(`\u{1F440} No stories found for ${this.username}`);
        return;
      }
      const { STORY_SAVED_DIR } = PathUtils_default.getSavedUserMediaDirPath(
        this.username
      );
      await DownloadUtils_default.downloadByBatch(
        stories,
        async (story) => {
          const filePath = import_path8.default.resolve(
            STORY_SAVED_DIR,
            `${story.id}.${story.isVideo ? "mp4" : "jpg"}`
          );
          await DownloadUtils_default.downloadMedia(story.downloadUrl, filePath);
        },
        true
      );
      console.log(
        `\u2705 Downloaded all stories of ${this.username} successfully and saved to ${STORY_SAVED_DIR}`
      );
    };
    this.instagramRequest = instagramRequest;
    this.username = username;
  }
};
var StoryDownloader_default = StoryDownloader;

// src/modules/InstagramRequest.ts
var import_axios2 = __toESM(require("axios"));
var import_dayjs2 = __toESM(require("dayjs"));
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
        takenAt: import_dayjs2.default.unix(reelOriginalData.taken_at).format("DD/MM/YYYY HH:mm:ss"),
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
          takenAt: import_dayjs2.default.unix(postData.taken_at).format("DD/MM/YYYY HH:mm:ss"),
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
    this.axiosInstance = import_axios2.default.create({
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
  constructor(cookies, username) {
    this.getProfileInfor = async () => {
      const profileInfor = await this.instagramRequest.getProfileStatistics(
        this.username
      );
      return profileInfor;
    };
    this.instagramRequest = new InstagramRequest_default(cookies);
    this.username = username;
    this.highlight = new HighlightDownloader_default(
      this.instagramRequest,
      this.username
    );
    this.post = new PostDownloader_default(this.instagramRequest, this.username);
    this.reel = new ReelDownloader_default(this.instagramRequest, this.username);
    this.story = new StoryDownloader_default(this.instagramRequest, this.username);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  InstagramDownloader,
  ProfileCleaner
});
