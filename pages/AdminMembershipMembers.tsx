"use client";

/**
 * Admin — Seller Membership Members
 * URL: /admin/seller-membership/members
 *
 * Shows all sellers and their membership status.
 */

import { useEffect, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import { xFetch } from "@/lib/express";

interface MemberRow {
    _id:          string;
    userId:       string;
    packageId:    string;
    orderNumber:  string;
    quantity:     number;
    status:       string;
    activatedAt:  string;
    expiresAt:    string | null;
    productCount: number;
    userName:     string;
    userEmail:    string;
    userImage:    string;
    packageName:  string;
    packageType:  string;
}

const STATUS_CFG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
    active:    { label: "Active",    dot: "bg-emerald-400", bg: "bg-emerald-50",  text: "text-emerald-700" },
    expired:   { label: "Expired",   dot: "bg-gray-400",    bg: "bg-gray-100",    text: "text-gray-600" },
    cancelled: { label: "Cancelled", dot: "bg-red-400",     bg: "bg-red-50",      text: "text-red-600" },
};

export default function AdminMembershipMembers() {
    const [members, setMembers] = useState<MemberRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter]   = useState("");

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await xFetch("/seller-membership/members", { cache: "no-store" });
            const data = await res.json();
            setMembers(data.members ?? []);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchMembers(); }, [fetchMembers]);

    const filtered = filter
        ? members.filter((m) => m.status === filter)
        : members;

    const fmtDate = (d: string | null) => {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    };

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Members</h1>
                <p className="text-sm text-gray-500 mt-0.5">All seller membership subscriptions</p>
            </div>

            {/* ── Filter tabs ── */}
            {!loading && members.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    {["", "active", "expired", "cancelled"].map((key) => {
                        const cfg = key ? STATUS_CFG[key] : null;
                        const count = key ? members.filter((m) => m.status === key).length : members.length;
                        return (
                            <button key={key} onClick={() => setFilter(key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                                    filter === key
                                        ? cfg ? `${cfg.bg} ${cfg.text}` : "bg-gray-900 text-white"
                                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                                }`}>
                                {cfg && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
                                {key ? cfg!.label : "All"}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                    filter === key ? "bg-black/10" : "bg-gray-100 text-gray-500"
                                }`}>{count}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-12">
                    <Icon icon="svg-spinners:ring-resize" width={32} className="text-gray-400" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 rounded-2xl py-16 text-center">
                    <Icon icon="solar:users-group-rounded-bold" width={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-semibold text-gray-500">No members found</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 text-left">
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Seller</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Package</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Status</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Products</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Activated</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Expires</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Order</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((m) => {
                                    const cfg = STATUS_CFG[m.status] ?? STATUS_CFG.expired;
                                    return (
                                        <tr key={m._id} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    {m.userImage ? (
                                                        <img src={m.userImage} alt=""
                                                            className="w-8 h-8 rounded-lg object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                            {m.userName?.charAt(0) ?? "?"}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-semibold text-gray-900 text-sm">{m.userName}</p>
                                                        <p className="text-xs text-gray-400">{m.userEmail}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">{m.packageName || "—"}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                                                    <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">{m.productCount}</td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(m.activatedAt)}</td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(m.expiresAt)}</td>
                                            <td className="px-4 py-3 text-gray-500 text-xs font-mono">{m.orderNumber || "—"}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
