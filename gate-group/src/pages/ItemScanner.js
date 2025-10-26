import React, { useEffect, useMemo, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { useNavigate } from 'react-router-dom';
import './ItemScanner.css';

// Main page component that now controls the scanner's activation
function ItemScanner() {
  const [scannedText, setScannedText] = useState("");
  const [isScannerActive, setIsScannerActive] = useState(false);
  const navigate = useNavigate();

  const handleScan = (text) => {
    console.log("Scanned text:", text);
    setScannedText(text);
    setIsScannerActive(true); // Deactivate scanner after a successful scan
  };

    return (
      <QRScannerSection 
        onScan={handleScan} 
        navigate={navigate}
      />
    );
  }

export default ItemScanner;


// The QR Scanner Component
function QRScannerSection({
  onScan,
  navigate,
  initialFacingMode = "environment",
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const codeReaderRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [facingMode, setFacingMode] = useState(initialFacingMode);
  const [torchOn, setTorchOn] = useState(false);
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState("");

  const goTo = (href, onClick) => {
    if (onClick) return onClick();
    if (navigate && href) return navigate(href);
    if (href) window.location.href = href;
  };

  // This effect runs when the component is mounted by the user's click
  useEffect(() => {
    codeReaderRef.current = new BrowserMultiFormatReader();
    BrowserMultiFormatReader.listVideoInputDevices()
      .then((list) => {
        //setDevices(list);
        const envLike = list.find((d) => /back|rear|environment/i.test(d.label));
        setSelectedDeviceId(envLike?.deviceId || list[0]?.deviceId || null);
      })
      .catch((e) => setError(msg(e)));

    return () => stopScanner();
  }, []);

  useEffect(() => {
    if (!selectedDeviceId && !facingMode) return;
    startScanner();
  }, [selectedDeviceId, facingMode]);

  const startScanner = async () => {
    setError("");
    stopScanner();

    try {
      let constraints = selectedDeviceId
        ? { video: { deviceId: { exact: selectedDeviceId } } }
        : { video: { facingMode } };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      await applyTorch(torchOn);
    } catch (e) {
      setError(msg(e));
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !codeReaderRef.current) return;
    try {
      const result = await codeReaderRef.current.decodeFromVideoElement(videoRef.current);
      if (result?.getText) {
        const text = result.getText();
        setLastResult(text);
        onScan?.(text);
      }
    } catch (err) {
      if (err.name !== 'NotFoundException') {
        setError(msg(err)); // A real error occurred
      } else {
        // No QR code was found in the frame
        setError("No se encontró un código QR.");
        setTimeout(() => setError(""), 2000); // Clear the message after 2 seconds
      }
    }
  };

  const stopScanner = () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
    } catch {}
  };

  const applyTorch = async (on) => {
    try {
      const track = streamRef.current?.getVideoTracks?.()?.[0];
      const caps = track?.getCapabilities?.();
      if (caps?.torch) {
        await track.applyConstraints({ advanced: [{ torch: on }] });
        return true;
      }
    } catch {}
    return false;
  };

  const toggleTorch = async () => {
    const next = !torchOn;
    const ok = await applyTorch(next);
    if (ok) setTorchOn(next);
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const img = await fileToImage(file);
      const result = await codeReaderRef.current.decodeFromImageElement(img);
      const text = result?.getText?.() || "";
      if (text) {
        setLastResult(text);
        onScan?.(text);
      }
    } catch (err) {
      setError("No se detectó un código QR en la imagen.");
    }
  };

  const msg = (e) =>
    typeof e === "string"
      ? e
      : e?.message || "Ocurrió un error con la cámara/lector.";

  const fileToImage = (file) =>
    new Promise((res, rej) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = url;
    });

  const isURL = useMemo(() => {
    try {
      new URL(lastResult);
      return true;
    } catch {
      return false;
    }
  }, [lastResult]);

  return (
    <div className="qr-scanner-container">
      <div className="qr-scanner-header">
        <h1>Escanear QR</h1>
        <p>Apunta la cámara al código y presiona el botón para capturar.</p>
      </div>

      <div className="video-container">
        <video ref={videoRef} className="video-element" playsInline muted />
        <ScanFrame onCapture={handleCapture} />
        <div className="video-controls">
          <button onClick={toggleTorch} className="control-button">
            {torchOn ? "Linterna: ON" : "Linterna: OFF"}
          </button>
        </div>
      </div>
      <div className="result-container">
        <div className="result-box">
          <div className="label">Último resultado</div>
          <div className="result-text">{lastResult || "—"}</div>
          {isURL && (
            <button
              onClick={() => (window.location.href = lastResult)}
              className="open-link-button"
            >
              Abrir enlace
            </button>
          )}
          {error && <div className="error-text">Aviso: {error}</div>}
        </div>
      </div>
    </div>
  );
}

function ScanFrame({ onCapture }) {
  return (
    <div aria-hidden className="scan-frame-container">
      <div className="scan-frame-box">
        <div className="scan-frame-outline" />
        {["tl", "tr", "bl", "br"].map((pos) => (
          <Corner key={pos} pos={pos} />
        ))}
      </div>
      <button className="capture-button" onClick={onCapture} aria-label="Capture QR Code"></button>
    </div>
  );
}

function Corner({ pos }) {
  const base = "scan-frame-corner";
  const posClass = `corner-${pos}`;
  return <div className={`${base} ${posClass}`} />;
}