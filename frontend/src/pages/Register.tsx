import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

type Step = 'form' | 'camera' | 'preview';

export function Register() {
  const { registerWeb } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('form');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [className, setClassName] = useState('');
  const [age, setAge] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [activeClasses, setActiveClasses] = useState<string[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    api
      .get('/class-access/active')
      .then(({ data }) => setActiveClasses(data))
      .catch(() => setActiveClasses([]))
      .finally(() => setClassesLoading(false));
  }, []);

  const canSubmit = firstName.trim() && lastName.trim() && className;

  const startCamera = async () => {
    setCameraError(null);
    setStep('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 480, height: 360 },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError('Kameraga ruxsat berilmadi.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    setPhotoBase64(dataUrl);
    stopCamera();
    setStep('preview');
  };

  const retake = () => {
    setPhotoBase64(null);
    startCamera();
  };

  const skipPhoto = () => {
    stopCamera();
    setPhotoBase64(null);
    submitForm(null);
  };

  const confirmAndSubmit = () => {
    submitForm(photoBase64);
  };

  const submitForm = async (photo: string | null) => {
    if (!canSubmit) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await registerWeb({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        className,
        age: age ? Number(age) : undefined,
        schoolName: '53-maktab',
        district: 'Chortoq tumani',
        photoBase64: photo ?? undefined,
      });
      navigate('/test');
    } catch (e: any) {
      if (e?.response?.status === 403) {
        setFormError('Hozircha mashg\'ulot faol emas. Iltimos, keyinroq urinib ko\'ring.');
      } else {
        setFormError("Ro'yxatdan o'tishda xatolik yuz berdi. Qaytadan urinib ko'ring.");
      }
      setStep('form');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'camera') {
    return (
      <div className="page page--center">
        <div className="card register-card camera-card">
          <div className="register-hero">📷</div>
          <h1>Rasmga olish</h1>
          <p className="muted">Yuzingiz ramkada to'liq ko'rinib tursin</p>

          {cameraError ? (
            <p className="error">{cameraError}</p>
          ) : (
            <div className="camera-preview">
              <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          <div className="camera-actions">
            {!cameraError && (
              <button className="btn btn-primary" onClick={takePhoto}>
                📸 Rasm olish
              </button>
            )}
            <button className="btn btn-secondary" onClick={skipPhoto} disabled={submitting}>
              O'tkazib yuborish
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'preview') {
    return (
      <div className="page page--center">
        <div className="card register-card camera-card">
          <div className="register-hero">✅</div>
          <h1>Rasm tayyor</h1>
          <p className="muted">Shu rasm psixologga yuboriladi</p>

          {photoBase64 && (
            <img src={photoBase64} alt="Rasm" className="camera-captured" />
          )}

          <div className="camera-actions">
            <button className="btn btn-primary" onClick={confirmAndSubmit} disabled={submitting}>
              {submitting ? 'Yuborilmoqda...' : '✅ Tasdiqlash'}
            </button>
            <button className="btn btn-secondary" onClick={retake} disabled={submitting}>
              🔄 Qayta olish
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page page--center">
      <div className="card register-card">
        <div className="register-hero">🧠✨</div>
        <h1>AI Psixolog</h1>
        <p className="muted">
          Sizni tushunamiz, sizga yordam beramiz. Boshlashdan oldin o'zingiz haqingizda
          ma'lumot kiriting.
        </p>

        <label className="field">
          <span>Ismingiz</span>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Masalan: Diyorbek"
          />
        </label>

        <label className="field">
          <span>Familiyangiz</span>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Masalan: Aliyev"
          />
        </label>

        <label className="field">
          <span>Sinfingiz</span>
          <select value={className} onChange={(e) => setClassName(e.target.value)}>
            <option value="">Sinfni tanlang</option>
            {activeClasses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {!classesLoading && activeClasses.length === 0 && (
            <span className="error">Hozircha hech bir sinf uchun mashg'ulot faol emas</span>
          )}
        </label>

        <label className="field">
          <span>Yoshingiz</span>
          <input
            type="number"
            min={10}
            max={20}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Masalan: 15"
          />
        </label>

        {formError && <p className="error">{formError}</p>}

        <button
          className="btn btn-primary"
          disabled={!canSubmit || submitting}
          onClick={startCamera}
        >
          Davom etish 📷
        </button>
      </div>
    </div>
  );
}
