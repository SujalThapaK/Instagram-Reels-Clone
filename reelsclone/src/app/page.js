"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation"; // For Next.js URL parameters
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase_client";
import Swal from "sweetalert2"; // Import SweetAlert2

function VideoUploadForm() {
  const [showPopup, setShowPopup] = useState(false);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [shopURL, setShopURL] = useState("");
  const [step, setStep] = useState(1);
  const [videoFile, setVideoFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleNext = async () => {
    if (step === 1) {
      if (!title.trim()) {
        await Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "A Title for the video is mandatory.",
        });
        return;
      }
      if (!shopURL.trim()) {
        await Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "A Shop URL for the video is mandatory.",
        });
        return;
      }
      setStep(2);
    } else {
      if (!videoFile) {
        await Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Uploading an MP4 video is mandatory.",
        });
        return;
      }
      if (videoFile.type !== "video/mp4") {
        await Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Only MP4 files are allowed.",
        });
        return;
      }

      const storageRef = ref(storage, `videos/${Date.now()}-${videoFile.name}`);
      const uploadTask = uploadBytesResumable(storageRef, videoFile);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload error: ", error);
          Swal.fire({
            icon: "error",
            title: "Upload Failed",
            text: "Error uploading video",
          });
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const docRef = await addDoc(collection(db, "reels"), {
            title,
            hashtags: tags
              .split(",")
              .map((tag) => `#${tag.trim()}`)
              .filter((tag) => tag !== "#"),
            likes: 0,
            videoURL: downloadURL,
            shopURL,
          });

          // Get the videoId from the Firestore document reference
          const videoId = docRef.id;

          // Construct the video link
          const videoLink = `${process.env.NEXT_PUBLIC_reelURL}?videoId=${videoId}`;

          // Show success message with the video link
          await Swal.fire({
            icon: "success",
            title: "Upload Successful!",
            html: `Video uploaded successfully!<br><br>Video Link: <a href="${videoLink}" target="_blank">${videoLink}</a>`,
          });

          // Reset form state
          setShowPopup(false);
          setTitle("");
          setTags("");
          setShopURL("");
          setVideoFile(null);
          setUploadProgress(0);
          setStep(1);
        }
      );
    }
  };

  return (
    <div className="flex justify-center mt-4 bottom-5">
      <button
        className="bg-black text-white px-4 py-2 rounded-full text-slate-100"
        onClick={() => setShowPopup(true)}
      >
        <b>Upload your own</b>
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
                <input
                  type="text"
                  placeholder="Shop URL"
                  className="w-full p-2 border rounded mb-2"
                  value={shopURL}
                  onChange={(e) => setShopURL(e.target.value)}
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

function VideoReel({ video }) {
  const videoRef = useRef(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(video.likes || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVideoPaused, setIsVideoPaused] = useState(true);
  const [showSharePopup, setShowSharePopup] = useState(false);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoElement.play().catch(() => {});
          } else {
            videoElement.pause();
          }
        });
      },
      { threshold: 0.75 }
    );

    observer.observe(videoElement);

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    videoElement.addEventListener("waiting", handleWaiting);
    videoElement.addEventListener("canplay", handleCanPlay);

    return () => {
      observer.unobserve(videoElement);
      videoElement.removeEventListener("waiting", handleWaiting);
      videoElement.removeEventListener("canplay", handleCanPlay);
    };
  }, []);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handlePause = () => setIsVideoPaused(true);
    const handlePlay = () => setIsVideoPaused(false);

    videoElement.addEventListener("pause", handlePause);
    videoElement.addEventListener("play", handlePlay);

    return () => {
      videoElement.removeEventListener("pause", handlePause);
      videoElement.removeEventListener("play", handlePlay);
    };
  }, []);

  useEffect(() => {
    setLikeCount(video.likes || 0);
  }, [video.likes]);

  const toggleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((prevCount) => (newLiked ? prevCount + 1 : prevCount - 1));

    try {
      const videoDocRef = doc(db, "reels", video.id);
      await updateDoc(videoDocRef, { likes: increment(newLiked ? 1 : -1) });
    } catch (error) {
      console.error("Error updating like count: ", error);
      setLiked(liked);
      setLikeCount((prevCount) => (newLiked ? prevCount - 1 : prevCount + 1));
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  };

  const displayTags = video.hashtags
    ? video.hashtags.join(" ")
    : video.tags
    ? video.tags
        .split(",")
        .map((tag) => `#${tag.trim()}`)
        .join(" ")
    : "";

  return (
    <div className="relative w-auto h-[75vh] aspect-[9/16] mx-auto flex-shrink-0">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
        </div>
      )}

      <video
        ref={videoRef}
        src={video.videoURL}
        className="object-cover w-full h-full rounded-lg bg-slate-950"
        muted={isMuted}
        loop
        playsInline
        controls={false}
        onClick={() => {
          if (videoRef.current) {
            videoRef.current.paused
              ? videoRef.current.play()
              : videoRef.current.pause();
          }
        }}
        onLoadStart={() => setIsLoading(true)}
        onCanPlayThrough={() => setIsLoading(false)}
      />

      {isVideoPaused && (
        <button
          onClick={() => videoRef.current && videoRef.current.play()}
          className="absolute inset-0 flex items-center justify-center focus:outline-none"
        >
          <div className="bg-black bg-opacity-50 p-4 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      )}

      <div className="absolute bottom-2 left-4 text-white">
        <h2 className="text-2xl font-bold">{video.title}</h2>
        <p>{displayTags}</p>
      </div>
      <div className="absolute top-20 -right-2 flex flex-col gap-4">
        <div className="absolute flex flex-col gap-4 right-4 sm:-right-10">
          <div className="flex flex-col items-center">
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
            <span className="text-white font-semibold mt-1 text-sm sm:text-black">{likeCount}</span>
          </div>
          <button
            onClick={toggleMute}
            className="bg-slate-100 border-2 p-1 rounded-full"
          >
            {isMuted ? "🔇" : "🔊"}
          </button>

          {showSharePopup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
              <div className="bg-white p-5 rounded-lg w-96">
                <h2 className="text-lg font-bold mb-2">Share Video</h2>
                <input
                  type="text"
                  readOnly
                  value={`${process.env.NEXT_PUBLIC_reelURL}?videoId=${video.id}`}
                  className="w-full p-2 border rounded mb-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${process.env.NEXT_PUBLIC_reelURL}?videoId=${video.id}`
                      );
                      Swal.fire({
                        toast: true,
                        position: "top-end",
                        icon: "success",
                        title: "Link copied to clipboard!",
                        showConfirmButton: false,
                        timer: 3000,
                      });
                      setShowSharePopup(false);
                    }}
                    className="bg-black text-white py-2 rounded-full flex-1"
                  >
                    Copy 📄
                  </button>
                  <button
                    onClick={() => setShowSharePopup(false)}
                    className="bg-gray-200 text-gray-800 py-2 mr-20 rounded-full flex-1"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowSharePopup(true)}
            className="bg-slate-100 border-2 p-1 rounded-full"
          >
            🔄
          </button>
        </div>
      </div>
      <div
        className={`absolute bottom-20 right-4 text-white p-2 rounded transition-all ${
          !isLoading ? "shop-now-button" : "bg-black/50"
        }`}
      >
        <a href={video.shopURL || "#"} target="_blank" rel="noopener noreferrer">
          Shop Now
        </a>
      </div>
    </div>
  );
}

export default function Home() {
  const searchParams = useSearchParams();
  const targetVideoId = searchParams.get("videoId"); // e.g., ?videoId=abc123
  const [videos, setVideos] = useState([]);
  const sentinelRef = useRef(null);
  const hasScrolled = useRef(false); // Track if we've already scrolled

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "reels"), (snapshot) => {
      const fetchedVideos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVideos(fetchedVideos);
    });
    return () => unsubscribe();
  }, []);

  // Once videos are loaded, scroll to the video with the matching ID (only once)
  useEffect(() => {
    if (videos.length && targetVideoId && !hasScrolled.current) {
      const element = document.getElementById(targetVideoId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        hasScrolled.current = true;
      }
    }
  }, [videos, targetVideoId]);

  return (
    <div className="fixed inset-0 font-[family-name:var(--font-geist-sans)] mt-20">
      <main>
        <div className="text-center -mt-12 mb-5">
          <b className="text-slate-900">Toaster</b> Reels.
        </div>
        <div className="relative flex flex-col w-full h-[75vh] overflow-auto hide-scrollbar snap-y snap-mandatory">
          {videos.map((video) => (
            <div
              id={video.id} // assign an id for scrolling
              key={video.id}
              className="snap-start w-full h-[75vh] flex items-center justify-center mb-2"
            >
              <VideoReel video={video} />
            </div>
          ))}
          <div ref={sentinelRef} className="h-1" />
        </div>
        <VideoUploadForm />
      </main>
    </div>
  );
}