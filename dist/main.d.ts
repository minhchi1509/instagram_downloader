interface IProfile {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    follower: number;
    following: number;
    is_private_account: boolean;
    total_posts: number;
}
interface IMedia {
    id: string;
    downloadUrl: string;
}
interface IPost {
    id: string;
    code: string;
    title?: string;
    takenAt: string;
    totalMedia: number;
    videoCount: number;
    imageCount: number;
    likeCount: number | null;
    commentCount: number;
    videos: IMedia[];
    images: IMedia[];
}
interface IReel {
    id: number;
    code: string;
    title?: string;
    takenAt: string;
    viewCount: number;
    likeCount: number | null;
    commentCount: number;
    downloadUrl: string;
}
interface IStory {
    id: string;
    downloadUrl: string;
    isVideo: boolean;
    takenAt: number;
}

declare class InstagramRequest {
    private axiosInstance;
    constructor(cookies: string);
    getInforOfCurrentUser: () => Promise<{
        csrfToken: any;
        username: any;
    }>;
    getInstagramIdByUsername: (username: string) => Promise<string>;
    getProfileStatistics: (username: string) => Promise<IProfile>;
    getUserStories: (username: string) => Promise<IStory[]>;
    getReelDataByCode: (reelCode: string) => Promise<IReel>;
    getUserReels: (username: string, startCursor: string, totalFetchedReels: number, limit: number) => Promise<IReel[]>;
    getAllHighlightsIdAndTitleOfUser: (username: string) => Promise<{
        id: string;
        title: any;
    }[]>;
    getAllSubStoriesByHighlightId: (highlightId: string) => Promise<IStory[]>;
    getUserPosts: (username: string, startCursor: string, totalFetchedPosts: number, limit: number) => Promise<IPost[]>;
    getPostDataByCode: (postCode: string) => Promise<IPost>;
    clearProfilePostById: (postId: string, csrfToken: string) => Promise<void>;
}

declare class HighlightDownloader {
    private instagramRequest;
    constructor(instagramRequest: InstagramRequest);
    private getHighlightStoryStatistics;
    private downloadHighlightStoryMedia;
    private writeHighlightStoryStatisticToFile;
    downloadAllUserHighlightStories: (username: string, writeStatisticFile?: boolean, downloadMedia?: boolean) => Promise<void>;
    downloadHighlightStoryById: (highlightId: string) => Promise<void>;
}

declare class PostDownloader {
    private instagramRequest;
    constructor(instagramRequest: InstagramRequest);
    private writePostStatisticToCsv;
    private downloadUserPostsMedia;
    downloadAllUserPosts: (username: string, writeStatisticFile?: boolean, downloadMedia?: boolean, limit?: number) => Promise<void>;
    downloadPostByCode: (postCode: string) => Promise<void>;
}

declare class ReelsDownloader {
    private instagramRequest;
    constructor(instagramRequest: InstagramRequest);
    private writeReelsStatisticToCsv;
    private downloadReelsMedia;
    downloadAllUserReels: (username: string, writeStatisticFile?: boolean, downloadMedia?: boolean, limit?: number) => Promise<void>;
    downloadReelByCode: (reelCode: string) => Promise<void>;
}

declare class StoryDownloader {
    private instagramRequest;
    constructor(instagramRequest: InstagramRequest);
    downloadAllUserStories: (username: string) => Promise<void>;
}

declare class InstagramDownloader {
    private instagramRequest;
    highlight: HighlightDownloader;
    post: PostDownloader;
    reel: ReelsDownloader;
    story: StoryDownloader;
    constructor(cookies: string);
    getProfileInfor: (username: string) => Promise<IProfile>;
}

declare class ProfileCleaner {
    private instagramRequest;
    constructor(cookies: string);
    clearAllPosts: (limit?: number) => Promise<void>;
}

export { InstagramDownloader, ProfileCleaner };
