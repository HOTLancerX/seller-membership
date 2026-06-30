"use client";

/**
 * Public Membership Packages Listing Page
 * URL: /membership (registered as root.pages single page)
 *
 * Lists all active packages with a "Buy Now" button that goes to
 * the product checkout page.
 */

import { useEffect, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useUser } from "@/context/Provider";
import { xFetch } from "@/lib/express";

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
}

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
    "one-time": { label: "One-time",  color: "bg-blue-50 text-blue-600" },
    "monthly":  { label: "Monthly",   color: "bg-violet-50 text-violet-600" },
    "yearly":   { label: "Yearly",    color: "bg-emerald-50 text-emerald-600" },
};

export default function MembershipListingPage() {
    const { user } = useUser();
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading]    = useState(true);

    const fetchPackages = useCallback(async () => {
        try {
            const res = await xFetch("/seller-membership/packages", { cache: "no-store" });
            const data = await res.json();
            setPackages((data.packages ?? []).filter((p: Package) => p._id));
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchPackages(); }, [fetchPackages]);

    return (
        <div className="container py-10">
            {/* ── Header ── */}
            <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-black text-gray-900">Seller Membership</h1>
                <p className="text-gray-500 mt-2 max-w-lg mx-auto">
                    Choose a membership package to start selling. Each package includes a product upload quota.
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Icon icon="svg-spinners:ring-resize" width={36} className="text-gray-400" />
                </div>
            ) : packages.length === 0 ? (
                <div className="text-center py-16">
                    <Icon icon="solar:crown-bold" width={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-semibold text-gray-500">No packages available yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {packages.map((pkg) => {
                        const badge = TYPE_BADGE[pkg.type] ?? TYPE_BADGE.monthly;
                        const hasProduct = Boolean(pkg.productId);

                        return (
                            <div key={pkg._id}
                                className="relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
                                {/* ── Top accent ── */}
                                <div className="h-1.5 bg-linear-to-r from-indigo-500 to-purple-500" />

                                <div className="p-6 flex flex-col flex-1">
                                    {/* Icon + badge */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                                            <Icon icon={pkg.icon || "solar:crown-bold"} width={24}
                                                className="text-indigo-500" />
                                        </div>
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${badge.color}`}>
                                            {badge.label}
                                        </span>
                                    </div>

                                    {/* Name + description */}
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">{pkg.name}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2 mb-5 flex-1">
                                        {pkg.description || `Upload up to ${pkg.productLimit} products`}
                                    </p>

                                    {/* Price */}
                                    <div className="mb-4">
                                        <span className="text-3xl font-black text-gray-900">
                                            {pkg.price === 0 ? "Free" : `$${pkg.price}`}
                                        </span>
                                        {pkg.price > 0 && (
                                            <span className="text-sm text-gray-400 ml-1">/ {pkg.type}</span>
                                        )}
                                    </div>

                                    {/* Product limit */}
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                                        <Icon icon="solar:box-bold" width={16} className="text-gray-400" />
                                        <span>{pkg.productLimit} product{pkg.productLimit !== 1 ? "s" : ""} allowed</span>
                                    </div>

                                    {/* CTA */}
                                    {hasProduct ? (
                                        <Link href={`/checkout?membership=${pkg._id}`}
                                            className="block w-full text-center py-3 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-400 hover:-translate-y-px transition-all text-sm">
                                            Buy Now
                                        </Link>
                                    ) : (
                                        <div className="block w-full text-center py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm">
                                            Free — Get Started
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Already a seller? ── */}
            {user?.type === "seller" && (
                <div className="text-center mt-10">
                    <Link href="/account/membership"
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition">
                        View your membership →
                    </Link>
                </div>
            )}
        </div>
    );
}
