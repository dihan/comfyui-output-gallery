document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const videoGallery = document.getElementById('video-gallery');
    const videoPreview = document.getElementById('video-preview');
    const videoInfo = document.getElementById('video-info');
    const selectAllBtn = document.getElementById('select-all');
    const deselectAllBtn = document.getElementById('deselect-all');
    const deleteSelectedBtn = document.getElementById('delete-selected');
    const downloadSelectedBtn = document.getElementById('download-selected');
    const modal = document.getElementById('modal');
    const modalClose = document.querySelector('.close');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalConfirm = document.getElementById('modal-confirm');
    const modalCancel = document.getElementById('modal-cancel');

    // State
    let videos = [];
    let selectedVideos = new Set();
    let currentVideo = null;

    // Fetch videos
    fetchVideos();

    // Event listeners
    selectAllBtn.addEventListener('click', selectAll);
    deselectAllBtn.addEventListener('click', deselectAll);
    deleteSelectedBtn.addEventListener('click', confirmDeleteSelected);
    downloadSelectedBtn.addEventListener('click', downloadSelected);
    modalClose.addEventListener('click', closeModal);
    modalCancel.addEventListener('click', closeModal);
    modalConfirm.addEventListener('click', handleModalConfirm);

    // Functions
    function fetchVideos() {
        fetch('/api/videos')
            .then(response => response.json())
            .then(data => {
                videos = data;
                renderGallery();
            })
            .catch(error => {
                console.error('Error fetching videos:', error);
                videoGallery.innerHTML = '<div class="error">Error loading videos. Please try again.</div>';
            });
    }

    function renderGallery() {
        if (videos.length === 0) {
            videoGallery.innerHTML = '<div class="no-videos">No videos found</div>';
            return;
        }

        videoGallery.innerHTML = '';
        videos.forEach(video => {
            const videoItem = document.createElement('div');
            videoItem.className = 'video-item';
            videoItem.dataset.id = video.id;
            
            if (selectedVideos.has(video.id)) {
                videoItem.classList.add('selected');
            }
            
            videoItem.innerHTML = `
                <img class="thumbnail" src="/api/video/${video.thumbnail_path}" alt="${video.name}">
                <div class="video-controls">
                    <div class="control-top">
                        <div class="select-box ${selectedVideos.has(video.id) ? 'checked' : ''}"></div>
                    </div>
                    <div class="control-bottom">
                        <button class="control-btn download-btn" title="Download">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="control-btn delete-btn" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="video-name">${video.name}</div>
            `;
            
            // Event listeners for video item
            videoItem.addEventListener('click', function(e) {
                // Don't trigger if clicking on controls
                if (!e.target.closest('.control-btn') && !e.target.closest('.select-box')) {
                    previewVideo(video);
                }
            });
            
            // Selection checkbox
            const selectBox = videoItem.querySelector('.select-box');
            selectBox.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleVideoSelection(video.id, videoItem, selectBox);
            });
            
            // Download button
            const downloadBtn = videoItem.querySelector('.download-btn');
            downloadBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                downloadVideo(video);
            });
            
            // Delete button
            const deleteBtn = videoItem.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                confirmDeleteVideo(video);
            });
            
            videoGallery.appendChild(videoItem);
        });
        
        updateButtonStates();
    }

    function previewVideo(video) {
        currentVideo = video;
        const isWebp = video.video_path.toLowerCase().endsWith('.webp');
        
        if (isWebp) {
            // For WebP (which may be animated), use an image tag
            videoPreview.innerHTML = `
                <img src="/api/video/${video.video_path}" alt="${video.name}" style="max-width: 100%; max-height: 100%;">
            `;
        } else {
            // For MP4, use a video player
            videoPreview.innerHTML = `
                <video controls autoplay loop>
                    <source src="/api/video/${video.video_path}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            `;
        }
        
        videoInfo.innerHTML = `
            <h2>${video.name}</h2>
            <p>Path: ${video.video_path}</p>
            <div class="preview-actions">
                <button class="btn btn-primary preview-download">Download</button>
                <button class="btn btn-danger preview-delete">Delete</button>
            </div>
        `;
        
        // Add event listeners to the preview action buttons
        const previewDownloadBtn = videoInfo.querySelector('.preview-download');
        previewDownloadBtn.addEventListener('click', () => downloadVideo(video));
        
        const previewDeleteBtn = videoInfo.querySelector('.preview-delete');
        previewDeleteBtn.addEventListener('click', () => confirmDeleteVideo(video));
    }

    function toggleVideoSelection(videoId, videoItem, selectBox) {
        if (selectedVideos.has(videoId)) {
            selectedVideos.delete(videoId);
            videoItem.classList.remove('selected');
            selectBox.classList.remove('checked');
        } else {
            selectedVideos.add(videoId);
            videoItem.classList.add('selected');
            selectBox.classList.add('checked');
        }
        
        updateButtonStates();
    }

    function selectAll() {
        videos.forEach(video => {
            selectedVideos.add(video.id);
        });
        renderGallery();
    }

    function deselectAll() {
        selectedVideos.clear();
        renderGallery();
    }

    function updateButtonStates() {
        const hasSelections = selectedVideos.size > 0;
        deleteSelectedBtn.disabled = !hasSelections;
        downloadSelectedBtn.disabled = !hasSelections;
    }

    function downloadVideo(video) {
        window.location.href = `/api/download/${video.video_path}`;
    }

    function downloadSelected() {
        // For each selected video, create a download link and click it
        const selectedVideoObjects = videos.filter(video => selectedVideos.has(video.id));
        
        // Create a slight delay between downloads to avoid browser throttling
        selectedVideoObjects.forEach((video, index) => {
            setTimeout(() => {
                window.open(`/api/download/${video.video_path}`, '_blank');
            }, index * 300);
        });
    }

    function confirmDeleteVideo(video) {
        modalTitle.textContent = 'Delete Video';
        modalMessage.textContent = `Are you sure you want to delete "${video.name}"?`;
        modal.dataset.action = 'delete-single';
        modal.dataset.videoId = video.id;
        openModal();
    }

    function confirmDeleteSelected() {
        modalTitle.textContent = 'Delete Selected Videos';
        modalMessage.textContent = `Are you sure you want to delete ${selectedVideos.size} selected videos?`;
        modal.dataset.action = 'delete-selected';
        openModal();
    }

    function handleModalConfirm() {
        const action = modal.dataset.action;
        
        if (action === 'delete-single') {
            const videoId = modal.dataset.videoId;
            deleteVideos([videoId]);
        } else if (action === 'delete-selected') {
            deleteVideos(Array.from(selectedVideos));
        }
        
        closeModal();
    }

    function deleteVideos(videoIds) {
        fetch('/api/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ video_ids: videoIds }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // If current video was deleted, clear the preview
                if (currentVideo && videoIds.includes(currentVideo.id)) {
                    videoPreview.innerHTML = `
                        <div class="no-selection">
                            <i class="fas fa-film"></i>
                            <p>Select a video to preview</p>
                        </div>
                    `;
                    videoInfo.innerHTML = '';
                    currentVideo = null;
                }
                
                // Clear selected videos that were deleted
                videoIds.forEach(id => selectedVideos.delete(id));
                
                // Refresh the gallery
                fetchVideos();
            } else {
                alert('There was an error deleting the videos: ' + data.errors.join(', '));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while deleting the videos.');
        });
    }

    function openModal() {
        modal.style.display = 'block';
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    // Close the modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });
});