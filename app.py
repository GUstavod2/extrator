from flask import Flask, request, send_file, render_template, jsonify
import os
import shutil
import tempfile
import zipfile
from werkzeug.utils import secure_filename
from imchat import frame_de_video

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 500 *  1024 * 1024  # 500 MB max upload

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/extract", methods=["POST"])
def extract_frames():
    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400
    
    file = request.files['video']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    interval = request.form.get("interval", 30, type=int)
    if interval < 1:
        interval = 1

    # Create a temporary directory to work in
    temp_dir = tempfile.mkdtemp()
    video_path = os.path.join(temp_dir, secure_filename(file.filename))
    frames_dir = os.path.join(temp_dir, "frames")
    zip_path = os.path.join(temp_dir, "frames.zip")
    
    try:
        # Save uploaded video
        file.save(video_path)
        
        # Extract frames
        frame_de_video(video_path, frames_dir, intervalo=interval)
        
        # Check if frames were generated
        if not os.path.exists(frames_dir) or not os.listdir(frames_dir):
            return jsonify({"error": "No frames extracted. Maybe the video is too short or invalid."}), 400
            
        # Zip the frames
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, _, files in os.walk(frames_dir):
                for img_file in files:
                    file_path = os.path.join(root, img_file)
                    zipf.write(file_path, arcname=img_file)
        
        # Send the file (we'll read it into memory so we can delete the temp dir immediately,
        # or we use an after_request hook. Flask's send_file uses generators, so we can't easily delete after.
        # However, we can use a cleanup class or return it as bytes)
        with open(zip_path, 'rb') as f:
            zip_data = f.read()
        
        return zip_data, 200, {
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename=extracted_frames.zip'
        }
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
    finally:
        # Clean up temporary directory
        shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
