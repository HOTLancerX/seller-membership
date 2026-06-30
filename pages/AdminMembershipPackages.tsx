"use client";

/**
 * Admin — Seller Membership Packages Management
 * URL: /admin/seller-membership
 *
 * CRUD for membership packages.
 */

import { useEffect, useState, useCallback } from "react";
import { Icon } from "@iconify/react";

interface Package {
    _id:          string;
    name:         string;
    slug:         string;
    price:        number;
    type:         "one-time" | "monthly" | "yearly";
    productLimit: number;
    productId:    string;
    icon:         string;
    description:  string;
    isActive:     boolean;
    position:     number;
}

const EMPTY: Omit<Package, "_id"> = {
    name: "", slug: "", price: 0, type: "monthly",
    productLimit: 10, productId: "", icon: "solar:crown-bold",
    description: "", isActive: true, position: 0,
};

const TYPE_OPTIONS = [
    { value: "one-time", label: "One-time" },
    { value: "monthly",  label: "Monthly" },
    { value: "yearly",   label: "Yearly" },
];

export default function AdminMembershipPackages() {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading]   = useState(true);
    const [editing, setEditing]   = useState<Package | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm]         = useState(EMPTY);
    const [saving, setSaving]     = useState(false);
    const [message, setMessage]   = useState("");

    const fetchPackages = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/seller-membership/packages", { cache: "no-store" });
            const data = await res.json();
            setPackages(data.packages ?? []);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchPackages(); }, [fetchPackages]);

    const openAdd = () => {
        setEditing(null);
        setForm(EMPTY);
        setShowForm(true);
        setMessage("");
    };

    const openEdit = (pkg: Package) => {
        setEditing(pkg);
        setForm({ ...pkg });
        setShowForm(true);
        setMessage("");
    };

    const handleSave = async () => {
        if (!form.name) { setMessage("Error: Name is required"); return; }
        setSaving(true);
        setMessage("");
        try {
            if (editing) {
                const res = await fetch(`/api/seller-membership/packages/${editing._id}`, {
                    method: "PUT",
                    body: JSON.stringify(form),
                });
                if (!res.ok) throw new Error();
            } else {
                const res = await fetch("/api/seller-membership/packages", {
                    method: "POST",
                    body: JSON.stringify(form),
                });
                if (!res.ok) throw new Error();
            }
            setMessage("Saved successfully!");
            setEditing(null);
            setForm(EMPTY);
            setShowForm(false);
            fetchPackages();
        } catch {
            setMessage("Error: Failed to save");
        } finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this package? Sellers with this package will not be affected but the link will be broken.")) return;
        try {
            await fetch(`/api/seller-membership/packages/${id}`, { method: "DELETE" });
            fetchPackages();
        } catch { /* silent */ }
    };

    const toggleActive = async (pkg: Package) => {
        try {
            await fetch(`/api/seller-membership/packages/${pkg._id}`, {
                method: "PUT",
                body: JSON.stringify({ isActive: !pkg.isActive }),
            });
            fetchPackages();
        } catch { /* silent */ }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Seller Membership</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manage seller subscription packages</p>
                </div>
                <button onClick={openAdd}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-400 transition">
                    <Icon icon="solar:add-circle-bold" width={18} />
                    Add Package
                </button>
            </div>

            {message && (
                <div className={`rounded-lg px-4 py-3 text-sm font-medium border ${
                    message.startsWith("Error")
                        ? "bg-red-400/10 text-red-400 border-red-400/25"
                        : "bg-emerald-400/10 text-emerald-400 border-emerald-400/25"
                }`}>
                    {message}
                </div>
            )}

            {/* ── Add/Edit Form ── */}
            {showForm && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <h2 className="text-sm font-bold text-gray-800">
                        {editing ? "Edit Package" : "New Package"}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Package Name" value={form.name}
                            onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
                        <Field label="Price" type="number" value={String(form.price)}
                            onChange={(v) => setForm((f) => ({ ...f, price: Number(v) || 0 }))} />
                        <SelectField label="Type" value={form.type} options={TYPE_OPTIONS}
                            onChange={(v) => setForm((f) => ({ ...f, type: v as any }))} />
                        <Field label="Product Upload Limit" type="number" value={String(form.productLimit)}
                            onChange={(v) => setForm((f) => ({ ...f, productLimit: Number(v) || 1 }))} />
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-600">Linked Product (buy to activate)</label>
                            <ProductSelect
                                value={form.productId}
                                onChange={(v) => setForm((f) => ({ ...f, productId: v }))}
                            />
                        </div>
                        <Field label="Icon (Iconify name)" value={form.icon}
                            onChange={(v) => setForm((f) => ({ ...f, icon: v }))} />
                        <div className="md:col-span-2">
                            <Field label="Description" value={form.description}
                                onChange={(v) => setForm((f) => ({ ...f, description: v }))} />
                        </div>
                        <Field label="Sort Order" type="number" value={String(form.position)}
                            onChange={(v) => setForm((f) => ({ ...f, position: Number(v) || 0 }))} />
                        <div className="flex items-center gap-3 pt-5">
                            <Toggle value={form.isActive}
                                onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
                            <span className="text-sm font-medium text-gray-700">Active</span>
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button onClick={handleSave} disabled={saving}
                            className="px-5 py-2 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-400 transition disabled:opacity-50">
                            {saving ? "Saving…" : editing ? "Update" : "Create"}
                        </button>
                        <button onClick={() => { setEditing(null); setForm(EMPTY); setShowForm(false); setMessage(""); }}
                            className="px-5 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* ── Package List ── */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Icon icon="svg-spinners:ring-resize" width={32} className="text-gray-400" />
                </div>
            ) : packages.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 rounded-2xl py-16 text-center">
                    <Icon icon="solar:crown-bold" width={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-semibold text-gray-500">No packages yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {packages.map((pkg) => (
                        <div key={pkg._id}
                            className={`bg-white rounded-2xl border shadow-sm p-5 space-y-3 transition ${
                                pkg.isActive ? "border-gray-100" : "border-gray-200 opacity-60"
                            }`}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                        <Icon icon={pkg.icon || "solar:crown-bold"} width={20}
                                            className="text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{pkg.name}</p>
                                        <p className="text-xs text-gray-400 capitalize">{pkg.type}</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    pkg.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"
                                }`}>
                                    {pkg.isActive ? "Active" : "Inactive"}
                                </span>
                            </div>

                            <p className="text-xs text-gray-500 line-clamp-2">{pkg.description || "No description"}</p>

                            <div className="flex items-center gap-4 text-xs">
                                <span className="font-bold text-lg text-gray-900">
                                    {pkg.price === 0 ? "Free" : `$${pkg.price}`}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-600">{pkg.productLimit} products</span>
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button onClick={() => openEdit(pkg)}
                                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition">
                                    Edit
                                </button>
                                <button onClick={() => toggleActive(pkg)}
                                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-50 text-gray-600 hover:bg-gray-100 transition">
                                    {pkg.isActive ? "Disable" : "Enable"}
                                </button>
                                <button onClick={() => handleDelete(pkg._id)}
                                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition">
                                    <Icon icon="solar:trash-bin-trash-bold" width={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Tiny field helpers ──────────────────────────────────────────────────────

function Field({ label, value, onChange, type = "text", placeholder = "" }: {
    label: string; value: string; onChange: (v: string) => void;
    type?: string; placeholder?: string;
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">{label}</label>
            <input type={type} value={value} placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 transition" />
        </div>
    );
}

function SelectField({ label, value, options, onChange }: {
    label: string; value: string;
    options: { value: string; label: string }[];
    onChange: (v: string) => void;
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">{label}</label>
            <select value={value} onChange={(e) => onChange(e.target.value)}
                className="appearance-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 transition">
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
        <button type="button" role="switch" aria-checked={value} onClick={() => onChange(!value)}
            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                value ? "bg-indigo-500" : "bg-gray-200"
            }`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                value ? "translate-x-6" : "translate-x-1"
            }`} />
        </button>
    );
}

function ProductSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [query, setQuery]       = useState("");
    const [results, setResults]   = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedTitle, setSelectedTitle] = useState("");
    const [showSearch, setShowSearch] = useState(false);

    const search = useCallback(async (q: string) => {
        if (!q.trim()) { setResults([]); return; }
        setSearching(true);
        try {
            const EXPRESS_API = process.env.NEXT_PUBLIC_EXPRESS_API_URL ?? "http://localhost:5000";
            const LICENSE_KEY = process.env.NEXT_PUBLIC_LICENSE_KEY ?? "";
            const res = await fetch(`${EXPRESS_API}/post?type=product&search=${encodeURIComponent(q)}&limit=10`, {
                credentials: "include",
                headers: { "x-license-key": LICENSE_KEY },
            });
            if (res.ok) {
                const data = await res.json();
                setResults(data.posts ?? []);
            }
        } catch { /* silent */ }
        finally { setSearching(false); }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => search(query), 300);
        return () => clearTimeout(t);
    }, [query, search]);

    const selectProduct = (post: any) => {
        onChange(post._id);
        setSelectedTitle(post.title);
        setShowSearch(false);
        setQuery("");
        setResults([]);
    };

    const clear = () => {
        onChange("");
        setSelectedTitle("");
    };

    if (!showSearch && value) {
        return (
            <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                <Icon icon="solar:box-bold" width={16} className="text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700 truncate flex-1">{selectedTitle || value}</span>
                <button type="button" onClick={clear} className="text-xs text-red-400 hover:text-red-600 shrink-0">Remove</button>
            </div>
        );
    }

    if (showSearch) {
        return (
            <div className="flex flex-col gap-2 p-2 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2">
                    <input type="text" value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search products..."
                        className="flex-1 text-sm px-3 py-1.5 border rounded-lg outline-none focus:border-indigo-400" autoFocus />
                    <button type="button" onClick={() => { setShowSearch(false); setQuery(""); setResults([]); }}
                        className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                </div>
                {searching && <p className="text-xs text-gray-400">Searching…</p>}
                {results.length > 0 && (
                    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                        {results.map((post) => (
                            <button key={post._id} type="button" onClick={() => selectProduct(post)}
                                className={`flex items-center gap-2 p-1.5 rounded text-left transition ${
                                    value === post._id ? "bg-indigo-100" : "hover:bg-indigo-50"
                                }`}>
                                <div className="w-8 h-8 rounded bg-gray-200 overflow-hidden shrink-0">
                                    {(() => {
                                        try {
                                            const imgs = JSON.parse(post.info?.images ?? "[]");
                                            return Array.isArray(imgs) && imgs[0] ? (
                                                <img src={imgs[0]} alt="" className="w-full h-full object-cover" />
                                            ) : null;
                                        } catch { return null; }
                                    })()}
                                </div>
                                <span className="text-xs font-medium text-gray-700 truncate">{post.title}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <button type="button" onClick={() => setShowSearch(true)}
            className="flex items-center justify-center gap-1.5 w-full py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-indigo-400 hover:text-indigo-500 transition">
            <Icon icon="solar:magnifer-bold" width={14} />
            Search for product…
        </button>
    );
}
