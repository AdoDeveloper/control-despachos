"use client";

import { useRouter } from "next/navigation";
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import {
  FiHome,
  FiChevronDown,
  FiLogOut,
  FiUser,
  FiUsers,
  FiSettings,
  FiPackage,
  FiBell
} from "react-icons/fi";
import Link from "next/link";

export default function Header() {
  const { data: session, status } = useSession({ required: true });
  const router = useRouter();
  const [cachedName, setCachedName] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const menuRef = useRef(null);
  const notificationRef = useRef(null);

  // Recuperar datos del usuario desde localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("userData");
      if (stored) {
        try {
          const user = JSON.parse(stored);
          setCachedName(user.username || "");
        } catch {
          setCachedName("");
        }
      }
    }
  }, []);

  // Cerrar menus al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotification(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function logOut() {
    localStorage.clear();
    signOut();
  }

  const userInitial = cachedName
    ? cachedName.charAt(0).toUpperCase()
    : "U";

  const roleId = session?.user?.roleId;

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo y título */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => router.push("/")} 
            className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-300"
          >
            <FiHome size={22} className="text-white" />
          </button>
          <div>
            <h1 className="text-xl sm:text-xl font-bold text-gray-800 tracking-tight">
              Control de Despachos
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              Panel de Administración
            </p>
          </div>
        </div>

        {/* Navegación principal - visible en pantallas medianas y grandes */}
        {roleId === 1 && (
        <nav className="hidden md:flex items-center space-x-6">
          <Link 
            href="/" 
            className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 font-medium transition-colors"
          >
            <FiPackage size={16} />
            <span>Despachos</span>
          </Link>
            <Link 
              href="/usuarios" 
              className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              <FiUsers size={16} />
              <span>Usuarios</span>
            </Link>
        </nav>
        )}

        {/* Opciones de usuario */}
        <div className="flex items-center space-x-4">

          {/* Menú de usuario */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 rounded-full py-1 px-2 hover:bg-gray-100 transition-colors"
              title="Opciones de usuario"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-medium shadow-md">
                {cachedName ? (
                  <span className="text-lg">{userInitial}</span>
                ) : (
                  <FiUser size={20} className="text-white" />
                )}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-semibold text-gray-800">
                  {cachedName || "Usuario"}
                </div>
                <div className="text-xs text-gray-500">
                  {roleId === 1 ? "Administrador" : "Usuario"}
                </div>
              </div>
              <FiChevronDown size={16} className="text-gray-500" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-100 overflow-hidden">
                <div className="block sm:hidden px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-800">{cachedName || "Usuario"}</p>
                  <p className="text-xs text-gray-500">
                    {roleId === 1 ? "Administrador" : "Usuario"}
                  </p>
                </div>
                
                <Link 
                  href="/perfil" 
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                >
                  <FiUser className="mr-3 text-gray-500" size={18} />
                  Mi Perfil
                </Link>
                
                {roleId === 1 && (
                  <Link 
                    href="/usuarios" 
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                  >
                    <FiUsers className="mr-3 text-gray-500" size={18} />
                    Administrar Usuarios
                  </Link>
                )}
                
                
                <div className="border-t border-gray-100 my-1"></div>
                
                <button
                  onClick={logOut}
                  className="flex w-full items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <FiLogOut className="mr-3" size={18} />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}