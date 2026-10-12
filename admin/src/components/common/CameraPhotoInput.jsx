import React, { useState, useRef, useEffect } from 'react';
import {
  FiCamera,
  FiUpload,
  FiX,
  FiRefreshCw,
  FiCheck,
  FiAlertCircle,
} from 'react-icons/fi';

/**
 * CameraPhotoInput
 * Allows live web camera capture directly in browser, or fallback to file upload.
 *
 * Props:
 * - photo: string (base64 data URL)
 * - onPhotoChange: (dataUrl: string) => void
 * - label: string
 * - required: boolean
 * - helperText: string
 * - colorScheme: 'emerald' | 'blue' | 'purple'
 */
const CameraPhotoInput = ({
  photo,
  onPhotoChange,
  label = 'Photo Proof',
  required = false,
  helperText = 'Click photo live with camera or choose from device files',
  colorScheme = 'emerald',
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [cameraError, setCameraError] = useState(null);
  const [startingCamera, setStartingCamera] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Stop camera tracks helper
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Track stop warning:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Cleanup on unmount or when modal closes
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Start live camera stream
  const startCamera = async (mode = facingMode) => {
    setCameraError(null);
    setStartingCamera(true);
    stopCameraStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera is not supported on this browser or device.');
      setStartingCamera(false);
      return;
    }

    try {
      // First attempt with facingMode preference
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (modeErr) {
        // Fallback to any available video stream (e.g. desktop webcam)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setIsCameraActive(true);

      // Connect stream to video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((e) => console.warn('Video play warning:', e));
        }
      }, 50);
    } catch (err) {
      console.error('Camera open error:', err);
      let msg = 'Could not access camera. Please allow camera permissions in browser settings.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission denied. Please allow camera access in your browser address bar.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera device found on this system. You can choose a photo file instead.';
      }
      setCameraError(msg);
      setIsCameraActive(false);
    } finally {
      setStartingCamera(false);
    }
  };

  // Close live camera
  const closeCamera = () => {
    stopCameraStream();
    setIsCameraActive(false);
    setCameraError(null);
  };

  // Flip front/back camera
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Snap photo from current video frame
  const captureCurrentFrame = () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      const canvas = document.createElement('canvas');
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, width, height);

      // Export as compressed JPEG
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      // Store and close stream
      onPhotoChange(dataUrl);
      closeCamera();
    } catch (err) {
      console.error('Failed to capture frame:', err);
      setCameraError('Failed to capture snapshot. Try again or upload file.');
    }
  };

  // Handle file picker selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      onPhotoChange(event.target.result);
      closeCamera();
    };
    reader.readAsDataURL(file);
  };

  // Remove current photo
  const handleRemovePhoto = () => {
    onPhotoChange('');
    closeCamera();
  };

  // Color schemes config
  const colorMap = {
    emerald: {
      border: 'border-emerald-300 dark:border-emerald-700',
      bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
      primaryBtn: 'bg-emerald-700 hover:bg-emerald-800 text-white',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
      snapBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    blue: {
      border: 'border-blue-300 dark:border-blue-700',
      bg: 'bg-blue-50/50 dark:bg-blue-950/20',
      primaryBtn: 'bg-blue-700 hover:bg-blue-800 text-white',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
      snapBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    purple: {
      border: 'border-purple-300 dark:border-purple-700',
      bg: 'bg-purple-50/50 dark:bg-purple-950/20',
      primaryBtn: 'bg-purple-700 hover:bg-purple-800 text-white',
      badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200',
      snapBtn: 'bg-purple-600 hover:bg-purple-700 text-white',
    },
  };

  const scheme = colorMap[colorScheme] || colorMap.emerald;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="font-bold text-gray-700 dark:text-gray-200 text-xs md:text-sm">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {photo && (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${scheme.badge}`}>
            <FiCheck className="w-3 h-3" /> Photo Attached
          </span>
        )}
      </div>

      <div className={`border-2 border-dashed ${scheme.border} rounded-xl p-3 text-center ${scheme.bg} transition-all`}>
        {/* VIEW 1: A photo is already attached */}
        {photo && !isCameraActive && (
          <div className="space-y-3 py-1">
            <div className="relative inline-block max-w-full">
              <img
                src={photo}
                alt="Captured Proof"
                className="max-h-52 w-auto object-contain rounded-lg border border-gray-300 dark:border-gray-600 shadow-md mx-auto"
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute -top-2 -right-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1.5 shadow-lg transition"
                title="Remove photo"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => startCamera()}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-lg transition"
              >
                <FiCamera className="w-3.5 h-3.5" /> Retake with Camera
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-lg transition"
              >
                <FiUpload className="w-3.5 h-3.5" /> Choose Other File
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: Live Camera Viewfinder */}
        {isCameraActive && (
          <div className="space-y-3 py-1">
            <div className="relative bg-black rounded-lg overflow-hidden max-w-md mx-auto aspect-video flex items-center justify-center shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Live Status indicator */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>LIVE CAMERA</span>
              </div>

              {/* Flip camera button */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white p-1.5 rounded-full text-xs shadow transition"
                title="Switch Camera (Front/Back)"
              >
                <FiRefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Camera Actions */}
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={closeCamera}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-semibold transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={captureCurrentFrame}
                className={`flex items-center gap-1.5 px-5 py-2 ${scheme.snapBtn} rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition scale-100 active:scale-95`}
              >
                <FiCamera className="w-4 h-4" /> Click / Capture Photo Now
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: Empty state - Choice to Open Camera or Select File */}
        {!photo && !isCameraActive && (
          <div className="space-y-3 py-3">
            <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 mx-auto flex items-center justify-center">
              <FiCamera className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                {helperText}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Click live photo using your camera, or upload an image proof
              </p>
            </div>

            {cameraError && (
              <div className="p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-700 dark:text-rose-300 text-xs flex items-center justify-center gap-1.5 text-left">
                <FiAlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{cameraError}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {/* Live Camera Button */}
              <button
                type="button"
                onClick={() => startCamera()}
                disabled={startingCamera}
                className={`inline-flex items-center gap-1.5 px-4 py-2 ${scheme.primaryBtn} text-xs font-bold rounded-lg shadow-sm hover:shadow transition disabled:opacity-50`}
              >
                {startingCamera ? (
                  <>
                    <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> Starting Camera...
                  </>
                ) : (
                  <>
                    <FiCamera className="w-4 h-4" /> 📸 Take Photo (Live Camera)
                  </>
                )}
              </button>

              {/* File Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 text-xs font-semibold rounded-lg shadow-sm transition"
              >
                <FiUpload className="w-3.5 h-3.5" /> 📁 Choose from Files
              </button>
            </div>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default CameraPhotoInput;
