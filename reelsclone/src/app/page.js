"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

// Sample videos simulating external storage (e.g., S3 or Google Cloud Storage)
const initialVideos = [
  {
    id: 1,
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    title: "Big Buck Bunny",
    hashtags: ["#bunny", "#nature"],
  },
  {
    id: 2,
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    title: "Elephant's Dream",
    hashtags: ["#dream", "#elephant"],
  },
  {
    id: 3,
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    title: "Sintel",
    hashtags: ["#sintel", "#animation"],
  },
];

function VideoUploadForm({ onUpload }) {
  const [showPopup, setShowPopup] = useState(false);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [step, setStep] = useState(1);
  const [videoFile, setVideoFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleNext = () => {
    if (step === 1) {
      if (!title.trim()) {
        alert("A Title for the video is mandatory.");
        return;
      }
      setStep(2);
    } else {
      // Step 2: Validate file selection and type
      if (!videoFile) {
        alert("Uploading an MP4 video is mandatory.");
        return;
      }
  
      if (videoFile.type !== "video/mp4") {
        alert("Only MP4 files are allowed.");
        return;
      }
  
      // Create a new video object with a local URL
      const newVideo = {
        id: Date.now(),
        url: URL.createObjectURL(videoFile),
        title,
        hashtags: tags
          .split(",")
          .map((tag) => `#${tag.trim()}`)
          .filter((tag) => tag !== "#"),
      };

      // Simulate an asynchronous upload process
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          onUpload(newVideo); // Add the video to the reels list
          alert("Video uploaded successfully!");
          // Reset form state
          setShowPopup(false);
          setTitle("");
          setTags("");
          setVideoFile(null);
          setUploadProgress(0);
          setStep(1);
        }
      }, 200); // increments progress every 200ms
    }
  };

  return (
    <div className="flex justify-center mt-4 bottom-5">
      <button
        className="bg-black text-white px-4 py-2 rounded-full text-slate-100"
        onClick={() => setShowPopup(true)}
      >
        <b>Upload</b>
      </button>
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-5 rounded-lg w-96">
            {step === 1 ? (
              <div key="step1">
                <h2 className="text-lg font-bold mb-2">Video Details</h2>
                <input
                  type="text"
                  placeholder="Title"
                  className="w-full p-2 border rounded mb-2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Hashtags (comma separated)"
                  className="w-full p-2 border rounded mb-2"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            ) : (
              <div key="step2">
                <h2 className="text-lg font-bold mb-2">Upload Video</h2>
                <input
                  type="file"
                  accept="video/mp4"
                  className="w-full p-2 border rounded mb-2"
                  onChange={(e) => setVideoFile(e.target.files[0])}
                  disabled={uploadProgress > 0 && uploadProgress < 100}
                />
                {/* Show progress bar during upload */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )}

            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-full mt-2 w-full"
              onClick={handleNext}
              disabled={uploadProgress > 0 && uploadProgress < 100}
            >
              {step === 1 ? "Next" : "Upload"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* 
  VideoReel Component
  - Renders a full-screen video reel.
  - Uses IntersectionObserver to auto‑play the video when ~75% in view.
  - Provides basic controls: like, share (simulated), and mute.
*/
function VideoReel({ video }) {
  const videoRef = useRef(null);
  const [liked, setLiked] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (videoRef.current) {
            if (entry.isIntersecting) {
              videoRef.current.play();
            } else {
              videoRef.current.pause();
            }
          }
        });
      },
      { threshold: 0.75 }
    );
    if (videoRef.current) {
      observer.observe(videoRef.current);
    }
    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);

  const toggleLike = () => setLiked((prev) => !prev);

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  };

  return (
    <div className="relative w-auto h-[75vh] aspect-[9/16] mx-auto flex-shrink-0">
      <video
        ref={videoRef}
        src={video.url}
        className="object-cover w-full h-full rounded-lg"
        muted={isMuted}
        loop
        playsInline
        controls={false}
      />
      {/* Video details overlay */}
      <div className="absolute bottom-2 left-4 text-white">
        <h2 className="text-2xl font-bold">{video.title}</h2>
        <p>{video.hashtags.join(" ")}</p>
      </div>
      {/* Right-hand controls */}
      <div className="absolute top-20 -right-2 flex flex-col gap-4">
        <div className="absolute flex flex-col gap-4 right-4 sm:-right-10">
          {liked ? (
            <button
              onClick={toggleLike}
              className="bg-red-200 border-4 border-red-500 p-0.5 rounded-full"
            >
              ❤️
            </button>
          ) : (
            <button
              onClick={toggleLike}
              className="bg-slate-100 border-2 p-1 rounded-full"
            >
              🤍
            </button>
          )}
          <button
            onClick={toggleMute}
            className="bg-slate-100 border-2 p-1 rounded-full"
          >
            {isMuted ? "🔇" : "🔊"}
          </button>
          <button
            onClick={() => alert("Share functionality coming soon!")}
            className="bg-slate-100 border-2 p-1 rounded-full"
          >
            🔄
          </button>
        </div>
      </div>
      {/* Product tag overlay */}
      <div className="absolute bottom-20 right-4 bg-black/50 text-white p-2 rounded">
        <a href="/product/1">Shop Now</a>
      </div>
    </div>
  );
}

/* 
  Home Component with infinite scroll
  - Appends videos as you reach the end.
  - When a user uploads a new video, it’s added to the beginning of the feed.
*/
export default function Home() {
  const [videos, setVideos] = useState(initialVideos);
  const sentinelRef = useRef(null);
  const nextIndexRef = useRef(0);

  // When a user uploads a new video, add it to the beginning of the feed.
  const handleUpload = (newVideo) => {
    setVideos((prevVideos) => [newVideo, ...prevVideos]);
  };

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Append the next video from initialVideos (cycling through)
            const nextVideo =
              initialVideos[nextIndexRef.current % initialVideos.length];
            nextIndexRef.current += 1;
            // Create a new video object with a unique id
            setVideos((prev) => [
              ...prev,
              { ...nextVideo, id: Date.now() },
            ]);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="fixed inset-0 font-[family-name:var(--font-geist-sans)] mt-20">
      <main>
        <div className="text-center -mt-12 mb-5">
          <b className="text-slate-900">Toaster</b> Reels.
        </div>
        <div className="relative flex flex-col w-full h-[75vh] overflow-auto hide-scrollbar snap-y snap-mandatory">
          {videos.map((video) => (
            <div
              key={video.id}
              className="snap-start w-full h-[75vh] flex items-center justify-center mb-2"
            >
              <VideoReel video={video} />
            </div>
          ))}
          {/* Sentinel element to trigger loading of more videos */}
          <div ref={sentinelRef} className="h-1" />
        </div>
        <VideoUploadForm onUpload={handleUpload} />
      </main>
    </div>
  );
}
