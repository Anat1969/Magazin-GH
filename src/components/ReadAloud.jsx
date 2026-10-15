import { useEffect, useState } from 'react';

// Reads a title and its subtitle with the browser's speech engine, in a Hebrew voice
// when the system has one.
function hebrewVoice() {
  const voices = window.speechSynthesis?.getVoices?.() ?? [];
  return voices.find((v) => /^he|^iw/i.test(v.lang)) || null;
}

export default function ReadAloud({ title, subtitle, onToast, className = '' }) {
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => () => supported && window.speechSynthesis.cancel(), [supported]);

  const toggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!supported) {
      onToast?.('הדפדפן הזה לא תומך בהקראה');
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance([title, subtitle].filter(Boolean).join('. '));
    u.lang = 'he-IL';
    u.rate = 0.92;
    const voice = hebrewVoice();
    if (voice) u.voice = voice;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  };

  return (
    <button type="button" className={`read-aloud ${speaking ? 'is-speaking' : ''} ${className}`} onClick={toggle} aria-pressed={speaking}>
      {speaking ? 'עצירת ההקראה' : 'הקראה'}
    </button>
  );
}
