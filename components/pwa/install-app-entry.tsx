"use client";

import { useEffect, useMemo, useState } from 'react';

type InstallPromptChoice = {
  outcome: 'accepted' | 'dismissed';
  platform: string;
};

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallPromptChoice>;
};

const DISMISS_KEY = 'sm_install_prompt_dismissed';

function isStandaloneMode() {
  if (typeof window === 'undefined') return false;
  const iosStandalone = typeof navigator !== 'undefined' && 'standalone' in navigator
    ? Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
    : false;

  return iosStandalone || window.matchMedia('(display-mode: standalone)').matches;
}

function isIosDevice() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallAppEntry() {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredInstallPrompt | null>(null);
  const [isInstalled, setIsInstalled] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [promptBlocked, setPromptBlocked] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsInstalled(isStandaloneMode());
    setIsIos(isIosDevice());
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === '1');

    const handleBeforeInstallPrompt = (event: Event) => {
      const installEvent = event as DeferredInstallPrompt;
      event.preventDefault();
      setDeferredPrompt(installEvent);
      setPromptBlocked(false);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setPromptBlocked(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const canInstall = !!deferredPrompt && !isInstalled;
  const showIosHelp = isIos && !isInstalled;
  const showTopCard = !isInstalled && !dismissed && (canInstall || showIosHelp);
  const showInlineCard = !isInstalled && dismissed && (canInstall || showIosHelp || promptBlocked);

  const helperText = useMemo(() => {
    if (canInstall) {
      return 'Puedes instalar el portal para abrirlo como app desde tu teléfono.';
    }

    if (showIosHelp) {
      return 'En iPhone, abre Compartir y luego “Añadir a pantalla de inicio”.';
    }

    if (promptBlocked) {
      return 'Tu navegador no mostró el aviso automático, pero puedes instalarla desde el menú del navegador.';
    }

    return '';
  }, [canInstall, showIosHelp, promptBlocked]);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DISMISS_KEY, '1');
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setPromptBlocked(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      } else {
        setPromptBlocked(true);
      }
    } catch {
      setPromptBlocked(true);
    } finally {
      setDeferredPrompt(null);
    }
  };

  return (
    <>
      {showTopCard ? (
        <div className="mb-5 rounded-2xl border border-sky-400/30 bg-sky-500/10 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-300">Instalar app</p>
              <p className="mt-2 text-sm text-slate-100">Agrega Santa Magdalena a tu teléfono para abrirla como app y tener el acceso más a mano.</p>
              <p className="mt-2 text-xs text-slate-300">{helperText}</p>
            </div>
            <button className="text-sm font-semibold text-slate-300" onClick={handleDismiss} type="button">
              Ahora no
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {canInstall ? (
              <button className="btn btn-primary" onClick={() => void handleInstall()} type="button">
                Instalar app
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {showInlineCard ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-sm font-bold text-white">¿Quieres tener el portal como app?</p>
          <p className="mt-2 text-xs text-slate-300">{helperText}</p>
          {canInstall ? (
            <button className="btn btn-secondary mt-3 w-full" onClick={() => void handleInstall()} type="button">
              Instalar app
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
