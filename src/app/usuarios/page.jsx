'use client';

import { useState, useEffect, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import {
  FiEdit,
  FiTrash2,
  FiLoader,
  FiRefreshCw,
  FiUsers,
  FiTag,
} from "react-icons/fi";
import { FaPlus } from "react-icons/fa";
import Header from "../../components/Header";

export default function UserRoleManagement() {
  // pestaña activa: "users" | "roles"
  const [activeTab, setActiveTab] = useState("users");
  // datos y loading
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);
  // búsquedas
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [roleSearchQuery, setRoleSearchQuery] = useState("");
  // refresco manual
  const [lastUpdate, setLastUpdate] = useState(null);

  // formularios y modales Usuario
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    username: "",
    nombreCompleto: "",
    codigo: "",
    email: "",
    password: "",
    roleId: ""
  });
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editUserForm, setEditUserForm] = useState({
    id: null,
    username: "",
    nombreCompleto: "",
    codigo: "",
    email: "",
    password: "",
    roleId: ""
  });
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // formularios y modales Rol
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [editRoleForm, setEditRoleForm] = useState({ id: null, name: "" });
  const [isDeleteRoleModalOpen, setIsDeleteRoleModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);

  // Fetchers
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error cargando usuarios");
      setUsers(data);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    setLoadingRoles(true);
    try {
      const res = await fetch("/api/roles");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error cargando roles");
      setRoles(data);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await Promise.all([fetchUsers(), fetchRoles()]);
    setLastUpdate(new Date());
    Swal.fire("Refrescado", "Datos actualizados", "success");
  }, [fetchUsers, fetchRoles]);

  useEffect(() => {
    (async () => {
      await Promise.all([fetchUsers(), fetchRoles()]);
      setAllLoaded(true);
    })();
  }, [fetchUsers, fetchRoles]);

  // Filtros
  const filteredUsers = useMemo(() => {
    const q = userSearchQuery.toLowerCase();
    return users.filter(u =>
      u.username.toLowerCase().includes(q) ||
      u.nombreCompleto.toLowerCase().includes(q) ||
      u.codigo.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }, [users, userSearchQuery]);

  const filteredRoles = useMemo(() => {
    const q = roleSearchQuery.toLowerCase();
    return roles.filter(r => r.name.toLowerCase().includes(q));
  }, [roles, roleSearchQuery]);

  // Toggle activo
  const handleToggleActivo = useCallback(async user => {
    const payload = { ...user, activo: !user.activo };
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(us => us.map(u => u.id === data.id ? data : u));
      Swal.fire("¡Éxito!", "Estado actualizado", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  }, []);

  // Badge color
  const getRoleBadgeClass = useCallback(name => {
    if (!name) return "bg-yellow-200 text-yellow-800";
    const r = name.toLowerCase();
    if (r.includes("administrador")) return "bg-blue-200 text-blue-800 font-bold";
    if (r.includes("enlonador"))      return "bg-orange-200 text-orange-800 font-bold";
    if (r.includes("operador"))      return "bg-cyan-200 text-cyan-800 font-bold";
    if (r.includes("supervisor"))    return "bg-red-200 text-red-800 font-bold";
    return "bg-gray-200 text-gray-800";
  }, []);

  // Handlers modales usuarios
  const openCreateUserModal = () => {
    setCreateUserForm({ username:"", nombreCompleto:"", codigo:"", email:"", password:"", roleId:"" });
    setIsCreateUserModalOpen(true);
  };
  const handleCreateUserChange = e => {
    const { name, value } = e.target;
    setCreateUserForm(f => ({ ...f, [name]: value }));
  };
  const handleCreateUserSubmit = async e => {
    e.preventDefault();
    Swal.fire({ title: "Creando usuario...", didOpen:()=>Swal.showLoading(), allowOutsideClick:false });
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ ...createUserForm, roleId:+createUserForm.roleId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(us => [...us, data]);
      setIsCreateUserModalOpen(false);
      Swal.fire("¡Éxito!", "Usuario creado", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };
  const openEditUserModal = user => {
    setEditUserForm({
      id: user.id,
      username: user.username,
      nombreCompleto: user.nombreCompleto,
      codigo: user.codigo,
      email: user.email||"",
      password: "",
      roleId: user.role?.id?.toString()||""
    });
    setIsEditUserModalOpen(true);
  };
  const handleEditUserChange = e => {
    const { name, value } = e.target;
    setEditUserForm(f => ({ ...f, [name]: value }));
  };
  const handleEditUserSubmit = async e => {
    e.preventDefault();
    const { id, username, nombreCompleto, codigo, email, password, roleId } = editUserForm;
    const payload = { username, nombreCompleto, codigo, email, roleId:+roleId };
    if (password) payload.password = password;
    Swal.fire({ title:"Actualizando usuario...", didOpen:()=>Swal.showLoading(), allowOutsideClick:false });
    try {
      const res = await fetch(`/api/users/${id}`, {
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(us => us.map(u=>u.id===data.id?data:u));
      setIsEditUserModalOpen(false);
      Swal.fire("¡Éxito!", "Usuario actualizado", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };
  const openDeleteUserModal = id => {
    setUserToDelete(id);
    setIsDeleteUserModalOpen(true);
  };
  const handleDeleteUser = async () => {
    try {
      const res = await fetch(`/api/users/${userToDelete}`, { method:"DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(us=>us.filter(u=>u.id!==userToDelete));
      setIsDeleteUserModalOpen(false);
      Swal.fire("¡Éxito!", "Usuario eliminado", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  // Handlers modales roles
  const openCreateRoleModal = () => {
    setNewRoleName("");
    setIsCreateRoleModalOpen(true);
  };
  const handleCreateRoleSubmit = async e => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    Swal.fire({ title:"Creando rol...", didOpen:()=>Swal.showLoading(), allowOutsideClick:false });
    try {
      const res = await fetch("/api/roles", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ name:newRoleName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRoles(rs=>[...rs, data]);
      setIsCreateRoleModalOpen(false);
      Swal.fire("¡Éxito!", "Rol creado", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };
  const openEditRoleModal = role => {
    setEditRoleForm({ id:role.id, name:role.name });
    setIsEditRoleModalOpen(true);
  };
  const handleEditRoleChange = e => setEditRoleForm(f=>({...f,name:e.target.value}));
  const handleEditRoleSubmit = async e => {
    e.preventDefault();
    Swal.fire({ title:"Actualizando rol...", didOpen:()=>Swal.showLoading(), allowOutsideClick:false });
    try {
      const res = await fetch(`/api/roles/${editRoleForm.id}`, {
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ name:editRoleForm.name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRoles(rs=>rs.map(r=>r.id===data.id?data:r));
      setIsEditRoleModalOpen(false);
      Swal.fire("¡Éxito!", "Rol actualizado", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };
  const openDeleteRoleModal = id => {
    setRoleToDelete(id);
    setIsDeleteRoleModalOpen(true);
  };
  const handleDeleteRole = async () => {
    try {
      const res = await fetch(`/api/roles/${roleToDelete}`, { method:"DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRoles(rs=>rs.filter(r=>r.id!==roleToDelete));
      setIsDeleteRoleModalOpen(false);
      Swal.fire("¡Éxito!", "Rol eliminado", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  // if (!allLoaded) {
  //   return (
  //     <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
  //       <FiLoader className="animate-spin" size={40} />
  //       <span className="mt-4 text-gray-600">Cargando...</span>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header title="Usuarios & Roles" />

      <div className="max-w-7xl mx-auto px-4 py-6 pt-24">
        {/* Controles superiores */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-6">
          {/* Tabs */}
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center space-x-1 pb-1 border-b-2 transition ${
                activeTab === "users"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 border-transparent hover:text-blue-600 hover:border-blue-600"
              }`}
            >
              <FiUsers size={18} /> <span>Usuarios</span>
            </button>
            <button
              onClick={() => setActiveTab("roles")}
              className={`flex items-center space-x-1 pb-1 border-b-2 transition ${
                activeTab === "roles"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 border-transparent hover:text-blue-600 hover:border-blue-600"
              }`}
            >
              <FiTag size={18} /> <span>Roles</span>
            </button>
          </nav>

          {/* Búsqueda + acciones */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
            {activeTab === "users" && (
              <>
                <input
                  type="text"
                  placeholder="Buscar usuarios..."
                  value={userSearchQuery}
                  onChange={e => setUserSearchQuery(e.target.value)}
                  className="border px-3 py-2 rounded w-full sm:w-auto focus:ring-2 focus:ring-blue-600"
                />
                <button
                  onClick={openCreateUserModal}
                  className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-lg"
                >
                  <FaPlus className="mr-2" /> Agregar
                </button>
              </>
            )}
            {activeTab === "roles" && (
              <>
                <input
                  type="text"
                  placeholder="Buscar roles..."
                  value={roleSearchQuery}
                  onChange={e => setRoleSearchQuery(e.target.value)}
                  className="border px-3 py-2 rounded w-full sm:w-auto focus:ring-2 focus:ring-blue-600"
                />
                <button
                  onClick={openCreateRoleModal}
                  className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-lg"
                >
                  <FaPlus className="mr-2" /> Agregar
                </button>
              </>
            )}
            <button
              onClick={refreshData}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-lg"
            >
              <FiRefreshCw className="mr-2 animate-spin-slow" /> Refrescar
            </button>
          </div>
        </div>

        {/* Tablas */}
        <div className="bg-white shadow rounded p-4 overflow-x-auto">
          {activeTab === "users" ? (
            loadingUsers ? (
              <p className="text-center text-gray-500">Cargando usuarios...</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {["Username","Nombre","Código","Email","Rol","Activo","Acciones"].map(h => (
                      <th
                        key={h}
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap">{user.username}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{user.nombreCompleto}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{user.codigo}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{user.email}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-sm ${getRoleBadgeClass(
                            user.role?.name
                          )}`}
                        >
                          {user.role?.name}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={user.activo}
                            onChange={() => handleToggleActivo(user)}
                          />
                          <span className="slider round"></span>
                        </label>
                      </td>
                      <td className="flex flex-row space-x-2 px-4 py-2">
                        <button
                          onClick={() => openEditUserModal(user)}
                          className="p-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded text-xl transition"
                        >
                          <FiEdit size={20} />
                        </button>
                        <button
                          onClick={() => openDeleteUserModal(user.id)}
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded text-xl transition"
                        >
                          <FiTrash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : loadingRoles ? (
            <p className="text-center text-gray-500">Cargando roles...</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Nombre
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRoles.map(role => (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{role.name}</td>
                    <td className="px-4 py-2 text-center space-x-2">
                      <button
                        onClick={() => openEditRoleModal(role)}
                        className="p-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded text-xl transition"
                      >
                        <FiEdit size={20} />
                      </button>
                      <button
                        onClick={() => openDeleteRoleModal(role.id)}
                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded text-xl transition"
                      >
                        <FiTrash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modales Usuarios */}
      {isCreateUserModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
            <div className="px-4 py-2 border-b">
              <h3 className="text-lg font-semibold">Crear Usuario</h3>
            </div>
            <div className="p-4">
              <form onSubmit={handleCreateUserSubmit} className="space-y-3">
                <input
                  name="username"
                  placeholder="Username"
                  className="border p-2 rounded w-full"
                  value={createUserForm.username}
                  onChange={handleCreateUserChange}
                  required
                />
                <input
                  name="nombreCompleto"
                  placeholder="Nombre Completo"
                  className="border p-2 rounded w-full"
                  value={createUserForm.nombreCompleto}
                  onChange={handleCreateUserChange}
                  required
                />
                <input
                  name="codigo"
                  placeholder="Código Empleado"
                  className="border p-2 rounded w-full"
                  value={createUserForm.codigo}
                  onChange={handleCreateUserChange}
                  required
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  className="border p-2 rounded w-full"
                  value={createUserForm.email}
                  onChange={handleCreateUserChange}
                  required
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  className="border p-2 rounded w-full"
                  value={createUserForm.password}
                  onChange={handleCreateUserChange}
                  required
                />
                <select
                  name="roleId"
                  className="border p-2 rounded w-full"
                  value={createUserForm.roleId}
                  onChange={handleCreateUserChange}
                  required
                >
                  <option value="">Seleccione un rol</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setIsCreateUserModalOpen(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded"
                  >
                    Crear
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {isEditUserModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
            <div className="px-4 py-2 border-b">
              <h3 className="text-lg font-semibold">Editar Usuario</h3>
            </div>
            <div className="p-4">
              <form onSubmit={handleEditUserSubmit} className="space-y-3">
                <input
                  name="username"
                  placeholder="Username"
                  className="border p-2 rounded w-full"
                  value={editUserForm.username}
                  onChange={handleEditUserChange}
                  required
                />
                <input
                  name="nombreCompleto"
                  placeholder="Nombre Completo"
                  className="border p-2 rounded w-full"
                  value={editUserForm.nombreCompleto}
                  onChange={handleEditUserChange}
                  required
                />
                <input
                  name="codigo"
                  placeholder="Código Empleado"
                  className="border p-2 rounded w-full"
                  value={editUserForm.codigo}
                  onChange={handleEditUserChange}
                  required
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  className="border p-2 rounded w-full"
                  value={editUserForm.email}
                  onChange={handleEditUserChange}
                  required
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Password (opcional)"
                  className="border p-2 rounded w-full"
                  value={editUserForm.password}
                  onChange={handleEditUserChange}
                />
                <select
                  name="roleId"
                  className="border p-2 rounded w-full"
                  value={editUserForm.roleId}
                  onChange={handleEditUserChange}
                  required
                >
                  <option value="">Seleccione un rol</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setIsEditUserModalOpen(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded"
                  >
                    Actualizar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {isDeleteUserModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="px-4 py-2 border-b">
              <h3 className="text-lg font-semibold">Confirmar Eliminación</h3>
            </div>
            <div className="p-4">
              <p>¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede revertir.</p>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setIsDeleteUserModalOpen(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modales Roles */}
      {isCreateRoleModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="px-4 py-2 border-b">
              <h3 className="text-lg font-semibold">Crear Rol</h3>
            </div>
            <div className="p-4">
              <form onSubmit={handleCreateRoleSubmit} className="space-y-3">
                <input
                  placeholder="Nombre del rol"
                  className="border p-2 rounded w-full"
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  required
                />
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setIsCreateRoleModalOpen(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded"
                  >
                    Crear
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {isEditRoleModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="px-4 py-2 border-b">
              <h3 className="text-lg font-semibold">Editar Rol</h3>
            </div>
            <div className="p-4">
              <form onSubmit={handleEditRoleSubmit} className="space-y-3">
                <input
                  placeholder="Nuevo nombre para el rol"
                  className="border p-2 rounded w-full"
                  value={editRoleForm.name}
                  onChange={handleEditRoleChange}
                  required
                />
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setIsEditRoleModalOpen(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded"
                  >
                    Actualizar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {isDeleteRoleModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="px-4 py-2 border-b">
              <h3 className="text-lg font-semibold">Confirmar Eliminación</h3>
            </div>
            <div className="p-4">
              <p>¿Estás seguro de que deseas eliminar este rol? Esta acción no se puede revertir.</p>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setIsDeleteRoleModalOpen(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteRole}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
        .switch {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 24px;
        }
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: 0.4s;
          border-radius: 24px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 2px;
          bottom: 2px;
          background-color: white;
          transition: 0.4s;
          border-radius: 50%;
        }
        input:checked + .slider {
          background-color: #4caf50;
        }
        input:checked + .slider:before {
          transform: translateX(24px);
        }
      `}</style>
    </div>
  );
}