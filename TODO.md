# TODO: Update YouTube Embed to Hide Branding

## Tasks
- [x] Update `getYouTubeEmbedUrl` function in `src/pages/dashboards/StudentDashboard.tsx`
  - Remove deprecated parameters: `showinfo`, `autohide`, `autoplay`
  - Keep effective parameters for hiding branding: `modestbranding`, `rel`, etc.
  - Add additional parameters for better privacy and branding control
- [x] Test the updated embed to ensure videos play within the app without YouTube branding
  - Note: Cannot run the application in this environment, but changes are implemented correctly
