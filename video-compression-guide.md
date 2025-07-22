# Video Compression Guide for Exclusive Lex

## Current File Size Limits
Due to Supabase free tier limitations, video uploads are currently limited to **50MB maximum**.

## Quick Compression Solutions

### Option 1: Online Video Compressors (Free)
- **CloudConvert**: https://cloudconvert.com/video-converter
- **Online Video Converter**: https://www.onlinevideoconverter.com/
- **YouCompress**: https://www.youcompress.com/

### Option 2: Desktop Software
- **HandBrake** (Free): https://handbrake.fr/
- **FFmpeg** (Command line): https://ffmpeg.org/

### Option 3: Mobile Apps
- **Video Compressor** (iOS/Android)
- **Squish** (iOS)

## Recommended Settings for 50MB Limit

### H.265 (HEVC) - Best Quality Option ⭐
H.265 provides 30-50% better compression than H.264 while maintaining similar quality.

#### For 30-minute videos:
- **Resolution**: 1080p (1920x1080)
- **Bitrate**: 800k-1.2 Mbps
- **Format**: MP4 (H.265/HEVC)
- **Audio**: 128 kbps AAC
- **Expected size**: 30-45MB

#### For 15-minute videos:
- **Resolution**: 1080p (1920x1080)
- **Bitrate**: 1.5-2 Mbps
- **Format**: MP4 (H.265/HEVC)
- **Audio**: 128 kbps AAC
- **Expected size**: 20-30MB

#### For 5-minute videos:
- **Resolution**: 1080p (1920x1080)
- **Bitrate**: 3-4 Mbps
- **Format**: MP4 (H.265/HEVC)
- **Audio**: 128 kbps AAC
- **Expected size**: 15-25MB

### H.264 - Wider Compatibility
If H.265 doesn't work, fall back to H.264:

#### For 30-minute videos:
- **Resolution**: 720p (1280x720)
- **Bitrate**: 1-2 Mbps
- **Format**: MP4 (H.264)
- **Audio**: 128 kbps AAC

#### For 15-minute videos:
- **Resolution**: 1080p (1920x1080)
- **Bitrate**: 2-3 Mbps
- **Format**: MP4 (H.264)
- **Audio**: 128 kbps AAC

#### For 5-minute videos:
- **Resolution**: 1080p (1920x1080)
- **Bitrate**: 4-5 Mbps
- **Format**: MP4 (H.264)
- **Audio**: 128 kbps AAC

## HandBrake Settings (Recommended)

### H.265 Settings (Best Quality) ⭐
1. **Source**: Select your video file
2. **Output**: Choose MP4 format
3. **Preset**: Select "Fast 1080p30" or "Fast 720p30"
4. **Video Tab**:
   - **Video Codec**: H.265 (HEVC)
   - **Framerate**: Same as source
   - **Quality**: RF 25-30 (H.265 uses different scale than H.264)
   - **Encoder Preset**: Fast or Medium
5. **Audio Tab**:
   - **Codec**: AAC
   - **Bitrate**: 128 kbps
6. **Preview**: Check file size before encoding

### H.264 Settings (Wider Compatibility)
1. **Source**: Select your video file
2. **Output**: Choose MP4 format
3. **Preset**: Select "Fast 720p30" or "Fast 1080p30"
4. **Video Tab**:
   - **Video Codec**: H.264
   - **Framerate**: Same as source
   - **Quality**: RF 23-28 (lower = higher quality)
5. **Audio Tab**:
   - **Codec**: AAC
   - **Bitrate**: 128 kbps
6. **Preview**: Check file size before encoding

## FFmpeg Commands (Advanced)

### H.265 Command (Best Quality) ⭐
```bash
ffmpeg -i input.mp4 -c:v libx265 -crf 28 -c:a aac -b:a 128k -vf scale=1920:1080 output.mp4
```

### H.264 Command (Wider Compatibility)
```bash
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -c:a aac -b:a 128k -vf scale=1280:720 output.mp4
```

### Quality Comparison
- **H.265 (HEVC)**: 30-50% smaller files with similar quality
- **H.264**: Larger files but wider browser/device compatibility

## Tips for Better Compression

1. **Reduce resolution** if quality allows
2. **Lower bitrate** for longer videos
3. **Use H.264 codec** for best compatibility
4. **Remove unnecessary audio tracks**
5. **Consider shorter video segments**

## Future Upgrades

To support larger files (up to 2GB), consider:
- Upgrading to Supabase Pro plan
- Implementing external storage (AWS S3, Cloudinary)
- Using video streaming services

## Need Help?

If you need assistance with video compression, please contact support at contact.exclusivelex@gmail.com 