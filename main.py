from flask import Flask, render_template, send_from_directory, request, jsonify
import os
import json
from pathlib import Path
import shutil

app = Flask(__name__)

# Configuration
COMFYUI_OUTPUT_DIR = "/workspace/ComfyUI/output"
SUPPORTED_VIDEO_FORMATS = ['.mp4', '.webp']
SUPPORTED_THUMBNAIL_FORMATS = ['.png']

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/videos')
def get_videos():
    videos = []
    
    # Walk through the output directory
    for root, _, files in os.walk(COMFYUI_OUTPUT_DIR):
        # Group files by base name
        file_groups = {}
        
        for file in files:
            file_path = os.path.join(root, file)
            file_ext = os.path.splitext(file)[1].lower()
            base_name = os.path.splitext(file)[0]
            
            # Only process supported formats
            if file_ext in SUPPORTED_VIDEO_FORMATS or file_ext in SUPPORTED_THUMBNAIL_FORMATS:
                if base_name not in file_groups:
                    file_groups[base_name] = {'video': None, 'thumbnail': None}
                
                rel_path = os.path.relpath(file_path, COMFYUI_OUTPUT_DIR)
                
                if file_ext in SUPPORTED_VIDEO_FORMATS:
                    file_groups[base_name]['video'] = rel_path
                elif file_ext in SUPPORTED_THUMBNAIL_FORMATS:
                    file_groups[base_name]['thumbnail'] = rel_path
        
        # Add complete entries to the videos list
        for base_name, group in file_groups.items():
            if group['video']:  # Only add if we have a video file
                video_info = {
                    'id': base_name,
                    'video_path': group['video'],
                    'thumbnail_path': group['thumbnail'] if group['thumbnail'] else group['video'],
                    'name': os.path.basename(base_name)
                }
                videos.append(video_info)
    
    return jsonify(videos)

@app.route('/api/video/<path:filepath>')
def serve_video(filepath):
    directory = os.path.dirname(os.path.join(COMFYUI_OUTPUT_DIR, filepath))
    filename = os.path.basename(filepath)
    return send_from_directory(directory, filename)

@app.route('/api/delete', methods=['POST'])
def delete_videos():
    video_ids = request.json.get('video_ids', [])
    deleted = []
    errors = []
    
    for video_id in video_ids:
        try:
            # Find all files with this base name
            for root, _, files in os.walk(COMFYUI_OUTPUT_DIR):
                for file in files:
                    file_base = os.path.splitext(file)[0]
                    if file_base == video_id:
                        file_path = os.path.join(root, file)
                        os.remove(file_path)
                        deleted.append(os.path.relpath(file_path, COMFYUI_OUTPUT_DIR))
        except Exception as e:
            errors.append(f"Error deleting {video_id}: {str(e)}")
    
    return jsonify({
        'success': len(errors) == 0,
        'deleted': deleted,
        'errors': errors
    })

@app.route('/api/download/<path:filepath>')
def download_video(filepath):
    directory = os.path.dirname(os.path.join(COMFYUI_OUTPUT_DIR, filepath))
    filename = os.path.basename(filepath)
    return send_from_directory(directory, filename, as_attachment=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8181, debug=True)