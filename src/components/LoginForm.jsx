"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession, getSession } from "next-auth/react";
import Image from "next/image";
import Swal from "sweetalert2";
import { FiLoader } from "react-icons/fi";

export default function LoginForm() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [timer, setTimer] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  const lockIntervalRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // Si ya hay sesión, guarda datos y redirige
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const { user } = session;
      // Guardar en localStorage todo excepto contraseña
      const { password: _pw, ...safeUser } = user;
      localStorage.setItem("userData", JSON.stringify(safeUser));
      router.replace("/");
    }
  }, [status, session, router]);

  // Revisar bloqueo al montar
  useEffect(() => {
    const lockStart = parseInt(localStorage.getItem("loginLockoutStart") || "0", 10);
    if (lockStart) {
      const elapsed = Math.floor((Date.now() - lockStart) / 1000);
      if (elapsed < 30) {
        setLocked(true);
        setTimer(30 - elapsed);
      } else {
        localStorage.removeItem("loginLockoutStart");
        localStorage.removeItem("loginAttempts");
      }
    }
  }, []);

  // Contador regresivo bloqueo
  useEffect(() => {
    if (locked) {
      lockIntervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(lockIntervalRef.current);
            localStorage.removeItem("loginLockoutStart");
            localStorage.removeItem("loginAttempts");
            setLocked(false);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(lockIntervalRef.current);
  }, [locked]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (locked) return;

    setError("");
    setIsSubmitting(true);
    setProgress(0);

    // Barra de progreso simulada
    progressIntervalRef.current = setInterval(() => {
      setProgress((p) => (p + Math.random() * 15 >= 90 ? 90 : p + Math.random() * 15));
    }, 300);

    const result = await signIn("credentials", {
      redirect: false,
      username: username.trim(),
      password,
    });

    clearInterval(progressIntervalRef.current);
    setProgress(100);
    setTimeout(() => setProgress(0), 400);
    setIsSubmitting(false);

    if (result?.error) {
      // Registrar intento fallido
      const prev = parseInt(localStorage.getItem("loginAttempts") || "0", 10) + 1;
      localStorage.setItem("loginAttempts", String(prev));

      if (prev >= 5) {
        const now = Date.now();
        localStorage.setItem("loginLockoutStart", String(now));
        setLocked(true);
        setTimer(30);

        let toastInterval;
        Swal.fire({
          icon: "error",
          title: "Demasiados intentos fallidos",
          html: "Reintentar en <b>30</b> segundos.",
          toast: true,
          position: "top-end",
          timer: 30000,
          timerProgressBar: true,
          showConfirmButton: false,
          didOpen: (toast) => {
            const b = toast.querySelector("b");
            toastInterval = setInterval(() => {
              const remaining = Math.ceil(Swal.getTimerLeft() / 1000);
              if (b) b.textContent = String(remaining);
            }, 100);
          },
          willClose: () => clearInterval(toastInterval),
        });
      } else {
        setError(result.error);
      }
    } else {
      // En caso de éxito, getSession() disparará el useEffect de arriba
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <FiLoader className="animate-spin text-3xl text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="relative">
      {isSubmitting && (
        <div
          className="fixed top-0 left-0 h-1 bg-cyan-600 z-50 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      )}

      <div className="flex justify-center items-center min-h-screen bg-gradient-to-r p-4">
        <div className="bg-white p-6 sm:p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md border-t-8 border-orange-500">
          <div className="flex justify-center mb-4">
            <Image
              src="https://res.cloudinary.com/dw7txgvbh/image/upload/f_auto,q_auto/almapac-logo"
              alt="Almapac Logo"
              width={250}
              height={120}
              style={{ width: "100%", height: "auto" }}
              className="object-contain"
              priority
            />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-4 text-cyan-700">
            Control de Despachos
          </h2>

          {error && !locked && (
            <p className="text-red-600 text-sm text-center bg-red-100 p-2 rounded-md mb-4">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Nombre de usuario"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={locked || isSubmitting}
            />
            <input
              type="password"
              placeholder="Contraseña"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={locked || isSubmitting}
            />
            <button
              type="submit"
              disabled={locked || isSubmitting}
              className={`w-full font-bold py-3 rounded-lg shadow-md transform active:translate-y-1 active:shadow-sm transition-all
                ${locked
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600 text-white"
                }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <FiLoader className="animate-spin text-white text-xl" />
                  <span>Procesando...</span>
                </div>
              ) : locked ? (
                `Intentar de nuevo en ${timer}s`
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}