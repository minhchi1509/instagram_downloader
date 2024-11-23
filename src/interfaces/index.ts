export interface ICachedCursor {
  totalFetchedItems: number;
  nextCursor: string;
}

export interface IProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  follower: number;
  following: number;
  is_private_account: boolean;
  total_posts: number;
}

export interface IMedia {
  id: string;
  downloadUrl: string;
}

export interface IPost {
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

export interface IReel {
  id: number;
  code: string;
  title?: string;
  takenAt: string;
  viewCount: number;
  likeCount: number | null;
  commentCount: number;
  downloadUrl: string;
}

export interface IStory {
  id: string;
  downloadUrl: string;
  isVideo: boolean;
  takenAt: number;
}

export interface IHighlightStory {
  id: string;
  title: string;
  totalStories: number;
  imageStoryCount: number;
  videoStoryCount: number;
  stories: IStory[];
}
