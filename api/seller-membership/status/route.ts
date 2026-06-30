/**
 * GET /api/seller-membership/status?userId=<id>
 * Returns the membership status for a seller.
 * If no userId provided, returns the caller's own membership.
 */

import { NextRequest, NextResponse } from "next/server";
import { resolveUser } from "@/lib/session";
import { getMembershipForUser } from "../../../models/SellerMembership";
import { getPackageById } from "../../../models/MembershipPackage";
import connectDB from "@/lib/mongodb";
import Post from "@/models/post";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<Response> {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const requestedUserId = searchParams.get("userId") ?? "";
        const isAdmin = caller.userType === "admin";

        const targetUserId = (isAdmin && requestedUserId) ? requestedUserId : caller.userId;

        const membership = await getMembershipForUser(targetUserId);
        if (!membership) {
            return NextResponse.json({ membership: null, package: null });
        }

        const pkg = membership.packageId
            ? await getPackageById(membership.packageId)
            : null;

        // Count actual products from Post model (authoritative, not stored counter)
        await connectDB();
        const productCount = await Post.countDocuments({
            userId: targetUserId,
            type: "product",
            status: { $ne: "trash" },
        });

        return NextResponse.json({ membership: { ...membership, productCount }, package: pkg });
    } catch (error) {
        console.error("Seller membership status GET error:", error);
        return NextResponse.json({ error: "Failed to fetch membership status" }, { status: 500 });
    }
}
