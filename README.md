<div align="center">
    <img src="https://raw.githubusercontent.com/minhchi1509/instagram_downloader/main/public/instagram-logo.svg" width="10%" />
    <br />
     <h1 align="center">Instagram Downloader</h1>
</div>

## Features

- Download photos, videos from all user posts
- Download all user reels
- Download all user highlight stories
- Download all active stories of user
- Delete All Instagram Posts on Your Account

> [!WARNING]
> The above features only apply to public or private instagram profiles (you have already followed).

> [!NOTE]
> All downloaded photos and videos will be saved in the Downloads folder (for Windows) on your computer.

## Installation

```bash
npm install @minhchi1509/instagram-downloader
```

## Usage

- This is an example:

```js
import {
  InstagramDownloader,
  ProfileCleaner,
} from "@minhchi1509/instagram-downloader";

// Cookies of your Instagram account. You can get it by using Cookie-Editor extension on Chrome
const cookies = "YOUR_INSTAGRAM_COOKIES";
// Username of the Instagram account you want to download
const username = "minhchi1509";

const instagramDownloader = new InstagramDownloader(cookies, username);
const profileCleaner = new ProfileCleaner(cookies);

// Download all posts of the user
instagramDownloader.post.downloadAllUserPosts();

// Download all reels of the user
instagramDownloader.reel.downloadAllUserReels();

// Download all highlights of the user
instagramDownloader.highlight.downloadAllUserHighlightStories();

// Download active stories of the user
instagramDownloader.story.downloadAllUserStories();

// Delete all posts of your account
profileCleaner.clearAllPosts();
```

## API Documentation

### Download posts, reels, highlights, stories

```js
instagramDownloader.post.downloadAllUserPosts(
  writeStatisticFile,
  downloadMedia,
  limit
);
instagramDownloader.reel.downloadAllUserReels(
  writeStatisticFile,
  downloadMedia,
  limit
);
instagramDownloader.highlight.downloadAllUserHighlightStories(
  writeStatisticFile,
  downloadMedia
);
instagramDownloader.story.downloadAllUserStories();
```

**Parameters**:

- **writeStatisticFile** _(boolean, optional)_: If `true`, it will output a CSV file containing information about the posts. Default value: `true`
- **downloadMedia** _(boolean, optional)_: If `true`, it will download videos, photos about the posts. Default value: `true`
- **limit** _(number, optional)_: The limit number of posts/reels you want to download in one execution and it **MUST** be a multiple of 12. Suitable when a user has too many posts/reels and you only want to download (example: 120 posts/reels) at a time per execution. Default value: `Infinity`

> [!WARNING]
> Note that when you specify the value of `limit` parameter, after the batch download is complete, there will be a folder named **cache_cursor/[username]** and it contains files like **posts.json**, **reels.json** to save information for the next posts/reels download. Please **DO NOT** edit anything in these files.
> If you want to download posts or reels again from the beginning, delete the corresponding files.

### Get profile information

```js
instagramDownloader.getProfileInfor(): Promise<IProfile>
```

**Return value**: return general information about a user. Include: `id`, `username`, `full_name`, `avatar_url` (HD), `follower`, `following`, `is_private_account`, `total_posts`

### Delete all profile's posts

```js
profileCleaner.clearAllPosts(limit);
```

**Parameters**:

- **limit** _(number, optional)_: The limit number of your first posts you want to delete. Default value: `Infinity`