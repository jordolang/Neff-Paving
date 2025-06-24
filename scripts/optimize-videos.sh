#!/bin/bash

# Video Optimization Script for Neff Paving
# This script optimizes videos for web delivery with multiple resolutions and quality levels

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
INPUT_DIR="assets/videos"
OUTPUT_DIR="assets/videos/optimized"
POSTER_DIR="assets/images/posters"

# Create output directories if they don't exist
mkdir -p "$OUTPUT_DIR"
mkdir -p "$POSTER_DIR"

# Function to log messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Function to check if ffmpeg is installed
check_ffmpeg() {
    if ! command -v ffmpeg &> /dev/null; then
        error "FFmpeg is not installed. Please install FFmpeg first."
        exit 1
    fi
    log "FFmpeg found: $(ffmpeg -version | head -n1)"
}

# Function to get video information
get_video_info() {
    local input_file="$1"
    log "Getting video information for: $input_file"
    
    # Get duration, resolution, and bitrate
    ffprobe -v quiet -print_format json -show_format -show_streams "$input_file" 2>/dev/null
}

# Function to create optimized video versions
optimize_video() {
    local input_file="$1"
    local base_name=$(basename "$input_file" .mp4)
    
    log "Optimizing video: $input_file"
    
    # 1080p version (high quality)
    log "Creating 1080p version..."
    ffmpeg -i "$input_file" \
        -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
        -c:v libx264 -preset medium -crf 23 \
        -c:a aac -b:a 128k \
        -movflags +faststart \
        "$OUTPUT_DIR/${base_name}-1080p.mp4" -y
    
    # 720p version (medium quality)
    log "Creating 720p version..."
    ffmpeg -i "$input_file" \
        -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" \
        -c:v libx264 -preset medium -crf 25 \
        -c:a aac -b:a 96k \
        -movflags +faststart \
        "$OUTPUT_DIR/${base_name}-720p.mp4" -y
    
    # 480p version (low quality/mobile)
    log "Creating 480p version..."
    ffmpeg -i "$input_file" \
        -vf "scale=854:480:force_original_aspect_ratio=decrease,pad=854:480:(ow-iw)/2:(oh-ih)/2" \
        -c:v libx264 -preset medium -crf 28 \
        -c:a aac -b:a 64k \
        -movflags +faststart \
        "$OUTPUT_DIR/${base_name}-480p.mp4" -y
    
    # WebM versions for better compression (optional)
    if command -v ffmpeg &> /dev/null && ffmpeg -codecs 2>/dev/null | grep -q libvpx-vp9; then
        log "Creating WebM versions..."
        
        # 1080p WebM
        ffmpeg -i "$input_file" \
            -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
            -c:v libvpx-vp9 -crf 30 -b:v 0 \
            -c:a libopus -b:a 96k \
            "$OUTPUT_DIR/${base_name}-1080p.webm" -y
        
        # 720p WebM
        ffmpeg -i "$input_file" \
            -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" \
            -c:v libvpx-vp9 -crf 32 -b:v 0 \
            -c:a libopus -b:a 64k \
            "$OUTPUT_DIR/${base_name}-720p.webm" -y
    else
        warn "VP9 codec not available, skipping WebM creation"
    fi
}

# Function to create poster images
create_posters() {
    local input_file="$1"
    local base_name=$(basename "$input_file" .mp4)
    
    log "Creating poster images from: $input_file"
    
    # Extract frame at 10 seconds (or 10% of video length)
    local duration=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$input_file")
    local timestamp=$(echo "$duration * 0.1" | bc -l)
    
    # 1920x1080 poster
    ffmpeg -i "$input_file" -ss "$timestamp" -vframes 1 \
        -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
        -q:v 2 "$POSTER_DIR/${base_name}-poster-1920x1080.jpg" -y
    
    # 1280x720 poster
    ffmpeg -i "$input_file" -ss "$timestamp" -vframes 1 \
        -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" \
        -q:v 2 "$POSTER_DIR/${base_name}-poster-1280x720.jpg" -y
    
    # 854x480 poster
    ffmpeg -i "$input_file" -ss "$timestamp" -vframes 1 \
        -vf "scale=854:480:force_original_aspect_ratio=decrease,pad=854:480:(ow-iw)/2:(oh-ih)/2" \
        -q:v 2 "$POSTER_DIR/${base_name}-poster-854x480.jpg" -y
}

# Function to display file sizes
show_results() {
    log "Optimization complete! File sizes:"
    echo ""
    echo "Original videos:"
    find "$INPUT_DIR" -name "*.mp4" -maxdepth 1 -exec ls -lh {} \; | awk '{print $9 ": " $5}'
    echo ""
    echo "Optimized videos:"
    find "$OUTPUT_DIR" -name "*.mp4" -exec ls -lh {} \; | awk '{print $9 ": " $5}'
    echo ""
    echo "Poster images:"
    find "$POSTER_DIR" -name "*.jpg" -exec ls -lh {} \; | awk '{print $9 ": " $5}'
}

# Main execution
main() {
    log "Starting video optimization for Neff Paving website"
    
    # Check prerequisites
    check_ffmpeg
    
    # Find all MP4 files in input directory
    mp4_files=$(find "$INPUT_DIR" -name "*.mp4" -maxdepth 1)
    
    if [ -z "$mp4_files" ]; then
        warn "No MP4 files found in $INPUT_DIR"
        exit 0
    fi
    
    # Process each video file
    for video_file in $mp4_files; do
        if [ -f "$video_file" ]; then
            log "Processing: $video_file"
            optimize_video "$video_file"
            create_posters "$video_file"
        fi
    done
    
    # Show results
    show_results
    
    log "All videos have been optimized successfully!"
}

# Run main function
main "$@"
