'use client';

import React, { useEffect, useState } from 'react';
import { Download, X, Share, PlusSquare, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const [isStandalone] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true
      );
    }
    return false;
  });

  const [isIOS] = useState(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(ua);
      const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);
      return isIosDevice && isSafari;
    }
    return false;
  });

  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return Boolean(sessionStorage.getItem('linktriage_install_dismissed'));
    }
    return false;
  });

  useEffect(() => {
    if (isStandalone || dismissed) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isStandalone, dismissed]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
        setDismissed(true);
      }
    } catch (err) {
      console.error('Error triggering PWA install:', err);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('linktriage_install_dismissed', 'true');
    }
  };

  if (isStandalone || dismissed) {
    return null;
  }

  // If beforeinstallprompt fired (Android/Desktop Chrome)
  if (deferredPrompt) {
    return (
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-40 bg-gradient-to-r from-indigo-950/95 via-slate-900/95 to-slate-900/95 border border-indigo-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-fade-in text-white">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white">Install LinkTriage App</h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Install to your home screen for instant triage and quick access to social links.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white rounded-lg text-xs font-medium transition shadow"
              >
                <Download className="w-3.5 h-3.5" />
                Install App
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-slate-400 hover:text-white text-xs font-medium transition"
              >
                Not Now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-md transition"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // iOS Safari banner
  if (isIOS) {
    return (
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-40 bg-slate-900/95 border border-indigo-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-fade-in text-white">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white">Add LinkTriage to Home Screen</h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Enjoy a fast, native app experience on your iPhone or iPad.
            </p>

            {showIOSInstructions ? (
              <div className="mt-2.5 p-2.5 bg-slate-800/80 rounded-xl text-xs text-slate-200 border border-slate-700/60 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-[10px]">1</span>
                  <span>Tap the <Share className="w-3.5 h-3.5 inline mx-0.5 text-indigo-400" /> Share icon below</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-[10px]">2</span>
                  <span>Scroll down &amp; tap <strong className="text-white">Add to Home Screen <PlusSquare className="w-3.5 h-3.5 inline text-indigo-400" /></strong></span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => setShowIOSInstructions(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition"
                >
                  <Share className="w-3.5 h-3.5" />
                  How to Install
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-2.5 py-1.5 text-slate-400 hover:text-white text-xs font-medium transition"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-md transition"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
