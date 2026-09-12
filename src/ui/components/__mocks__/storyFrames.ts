export interface StoryFrame {
  width: number;
  height: number;
}

export const minimumDesktopStoryFrame: StoryFrame = {
  width: 700,
  height: 700,
};

export const minimumMobileStoryFrame: StoryFrame = {
  width: 320,
  height: 568,
};

export const maximumMobileStoryFrame: StoryFrame = {
  width: 430,
  height: 932,
};
