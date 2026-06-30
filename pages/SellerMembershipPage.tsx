"use client";

/**
 * Seller Account — My Membership
 * URL: /account/membership
 *
 * Shows the seller's current membership status and history.
 */

import { useEffect, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useUser } from "@/context/Provider";
import { xFetch } from "@/lib/express";

interface Membership {
    _id:          string;
    packageId:    string;
    orderNumber:  string;
    quantity:     number;
    status:       string;
    activatedAt:  string;
    expiresAt:    string | null;
    productCount: number;
}

interface Package {
    _id:          string;
    name:         string;
    price:        number;
    type:         string;
    productLimit: number;
    icon:         string;
    description:  string;
}

export default function SellerMembershipPage() {
    const { user } = useUser();
    const [membership, setMembership] = useState<Membership | null>(null);
    const [pkg, setPkg]               = useState<Package | null>(null);
    const [loading, setLoading]        = useState(true);

    const fetchData = useCallback(async () => {
        if (!user?._id) return;
        setLoading(true);
        try {
            const res = await xFetch(`/seller-membership/status?userId=${user._id}`, { cache: "no-store" });
            const data = await res.json();
            setMembership(data.membership ?? null);
            setPkg(data.package ?? null);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [user?._id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const fmtDate = (d: string | null) => {
        if (!d) return "Never";
        return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    };

    const isActive = membership?.status === "active";
    const daysLeft = membership?.expiresAt
        ? Math.max(0, Math.ceil((new Date(membership.expiresAt).getTime() - Date.now()) / 86400000))
        : null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-black text-gray-900">Membership</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Your seller subscription</p>
                </div>
                <Link href="/membership"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-400 transition">
                    <Icon icon="solar:shop-bold" width={16} />
                    Browse Packages
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Icon icon="svg-spinners:ring-resize" width={32} className="text-gray-400" />
                </div>
            ) : !membership ? (
                <div className="bg-white border border-dashed border-gray-200 rounded-2xl py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
                        <Icon icon="solar:crown-bold" width={32} className="text-amber-400" />
                    </div>
                    <p className="text-base font-bold text-gray-600">No active membership</p>
                    <p className="text-sm text-gray-400 mt-1 mb-5">Choose a package to start uploading products</p>
                    <Link href="/membership"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:shadow-md hover:-translate-y-px transition-all">
                        <Icon icon="solar:crown-bold" width={16} />
                        View Packages
                    </Link>
                </div>
            ) : (
                <>
                    {/* ── Status Card ── */}
                    <div className={`rounded-2xl p-6 text-white shadow-lg ${
                        isActive
                            ? "bg-linear-to-br from-emerald-500 to-teal-600"
                            : "bg-linear-to-br from-gray-400 to-gray-500"
                    }`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                <Icon icon={pkg?.icon || "solar:crown-bold"} width={24} />
                            </div>
                            <div>
                                <p className="text-lg font-bold">{pkg?.name ?? "Unknown Package"}</p>
                                <p className="text-sm text-white/70 capitalize">{pkg?.type ?? ""}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatusItem label="Status" value={isActive ? "Active" : membership.status} />
                            <StatusItem label="Activated" value={fmtDate(membership.activatedAt)} />
                            <StatusItem label="Expires" value={fmtDate(membership.expiresAt)} />
                            <StatusItem label="Days Left" value={daysLeft !== null ? String(daysLeft) : "∞"} />
                        </div>
                    </div>

                    {/* ── Usage ── */}
                    {pkg && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                            <h2 className="text-sm font-bold text-gray-800">Product Usage</h2>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs text-gray-500">
                                            {membership.productCount} of {pkg.productLimit} products used
                                        </span>
                                        <span className="text-xs font-semibold text-gray-700">
                                            {pkg.productLimit > 0
                                                ? `${Math.round((membership.productCount / pkg.productLimit) * 100)}%`
                                                : "0%"}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${
                                                membership.productCount >= pkg.productLimit
                                                    ? "bg-red-400"
                                                    : "bg-indigo-500"
                                            }`}
                                            style={{
                                                width: `${Math.min(100, pkg.productLimit > 0 ? (membership.productCount / pkg.productLimit) * 100 : 0)}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {membership.productCount >= pkg.productLimit && (
                                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
                                    <Icon icon="solar:info-circle-bold" width={16} className="inline mr-1.5 -mt-0.5" />
                                    You&apos;ve reached your product limit. Upgrade your package to upload more.
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Quick links ── */}
                    <div className="grid grid-cols-2 gap-3">
                        <Link href="/account/post/product"
                            className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                                <Icon icon="solar:box-bold" width={20} className="text-amber-500" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">My Products</p>
                                <p className="text-xs text-gray-400">{membership.productCount} uploaded</p>
                            </div>
                        </Link>
                        <Link href="/membership"
                            className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                <Icon icon="solar:crown-bold" width={20} className="text-indigo-500" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">Browse Packages</p>
                                <p className="text-xs text-gray-400">Upgrade or renew</p>
                            </div>
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
}

function StatusItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-white/50">{label}</p>
            <p className="text-sm font-bold">{value}</p>
        </div>
    );
}
