# ComfyUI with Output Gallery

This setup combines ComfyUI with a Video Output Gallery for easy browsing and management of generated media.

## Option 1: Using Docker

1. Build the container with both ComfyUI and the gallery:
```bash
docker build -t comfyui-with-gallery .
```

2. Run the container:
```bash
docker run --gpus all -p 8188:8188 -p 8181:8181 \
  -v ./comfyui-models:/workspace/ComfyUI/models \
  -v ./comfyui-output:/workspace/ComfyUI/output \
  comfyui-with-gallery
```

3. Access:
   - ComfyUI: http://localhost:8188
   - Video Gallery: http://localhost:8181

## Option 2: Manual Installation into existing ComfyUI

If you already have ComfyUI running, you can add the gallery:

1. Clone the gallery repository into your ComfyUI directory:
```bash
cd /path/to/your/ComfyUI
git clone https://github.com/yourusername/comfyui-output-gallery.git
```

2. Install dependencies:
```bash
cd comfyui-output-gallery
pip install -r requirements.txt
```

3. Run ComfyUI as normal in one terminal:
```bash
cd /path/to/your/ComfyUI
python main.py
```

4. Run the gallery in another terminal:
```bash
cd /path/to/your/ComfyUI/comfyui-output-gallery
python main.py
```

5. Access both services as described above.

## Using on RunPod

For RunPod deployment:

1. Create a custom image using the Dockerfile or use a pre-built image
2. Expose both ports 8188 and 8181 in the RunPod configuration
3. Connect to both services through the exposed RunPod URLs