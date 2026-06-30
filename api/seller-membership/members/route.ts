/**
 * GET /api/seller-membership/members
 * Admin-only — returns all seller memberships with user + package info.
 */

import { NextResponse } from "next/server";
import { resolveUser } from "@/lib/session";
import { getAllMemberships } from "../../../models/SellerMembership";
import { getAllPackages } from "../../../models/MembershipPackage";
import connectDB from "@/lib/mongodb";
import User from "@/models/Users";
import Post from "@/models/post";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
    try {
        const caller = await resolveUser();
        if (!caller || caller.userType !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const [memberships, packages] = await Promise.all([
            getAllMemberships(),
            getAllPackages(),
        ]);

        // Fetch user names
        const userIds = [...new Set(memberships.map((m) => m.userId))];
        await connectDB();
        const users = userIds.length > 0
            ? await User.find({ _id: { $in: userIds } }).lean() as any[]
            : [];
        const userMap = new Map(users.map((u: any) => [String(u._id), {
            name: String(u.name ?? ""),
            email: String(u.email ?? ""),
            image: String(u.image ?? ""),
        }]));

        const pkgMap = new Map(packages.map((p) => [p._id, p]));

        // Count actual products per seller from Post model (authoritative)
        const productCounts = new Map<string, number>();
        if (userIds.length > 0) {
            const counts = await Post.aggregate([
                { $match: { userId: { $in: userIds }, type: "product", status: { $ne: "trash" } } },
                { $group: { _id: "$userId", count: { $sum: 1 } } },
            ]);
            for (const row of counts) {
                productCounts.set(String(row._id), row.count);
            }
        }

        const enriched = memberships.map((m) => ({
            ...m,
            productCount: productCounts.get(m.userId) ?? 0,
            userName: userMap.get(m.userId)?.name ?? "",
            userEmail: userMap.get(m.userId)?.email ?? "",
            userImage: userMap.get(m.userId)?.image ?? "",
            packageName: pkgMap.get(m.packageId)?.name ?? "",
            packageType: pkgMap.get(m.packageId)?.type ?? "",
            packageLimit: pkgMap.get(m.packageId)?.productLimit ?? 0,
        }));

        return NextResponse.json({ members: enriched });
    } catch (error) {
        console.error("Seller membership members GET error:", error);
        return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
    }
}
