/**
 * POST /api/seller-membership/activate
 * Called when a membership product order is delivered.
 * Body: { orderNumber, userId, packageId, quantity, type }
 *
 * Also callable with just { orderNumber } — server looks up order items
 * to find the matching membership product.
 */

import { NextRequest, NextResponse } from "next/server";
import { activateMembership, getMembershipForUser } from "../../../models/SellerMembership";
import { getPackageById } from "../../../models/MembershipPackage";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<Response> {
    try {
        const body = await req.json();
        const { orderNumber, userId, packageId, quantity, type } = body;

        if (!userId || !packageId || !quantity || !type) {
            return NextResponse.json(
                { error: "Missing required fields: userId, packageId, quantity, type" },
                { status: 400 }
            );
        }

        // Verify the package exists
        const pkg = await getPackageById(packageId);
        if (!pkg) {
            return NextResponse.json({ error: "Package not found" }, { status: 404 });
        }

        await activateMembership(userId, packageId, orderNumber || "", quantity, type);

        const updated = await getMembershipForUser(userId);
        return NextResponse.json({ success: true, membership: updated });
    } catch (error) {
        console.error("Seller membership activate error:", error);
        return NextResponse.json({ error: "Failed to activate membership" }, { status: 500 });
    }
}
