/**
 * plugin/seller-membership/lib/serverHooks.ts
 *
 * Server-side hook: auto-discovers via require.context in hook/serverDataHooks.ts.
 * Listens for order delivery events to activate membership.
 *
 * Also provides the canUpload() helper used by seller product form API.
 */

import { registerServerDataHook } from "@/hook/serverDataHooks";
import { activateMembership } from "../models/SellerMembership";
import { getPackageById } from "../models/MembershipPackage";
import connectDB from "@/lib/mongodb";
import Post from "@/models/post";
import PostInfo from "@/models/post_info";

/**
 * Called when an order item reaches "delivered" status.
 * Checks if any item in the order is a membership product.
 * If so, activates/renews the membership for the seller who bought it.
 *
 * This is invoked by the product plugin's order status update API
 * via the serverDataHook pattern — or can be called directly.
 */
async function onOrderDelivered(orderData: any) {
    try {
        await connectDB();

        const items = orderData?.items ?? [];
        for (const item of items) {
            const productId = item.productId;
            if (!productId) continue;

            // Check if this product is linked to any membership package
            const packages = await import("../models/MembershipPackage").then(
                (m) => m.getActivePackages()
            );

            const matchedPkg = packages.find((p: any) => p.productId === productId);
            if (!matchedPkg) continue;

            // The buyer is the user who placed the order
            const buyerUserId = orderData.userId;
            if (!buyerUserId) continue;

            // Quantity determines duration
            const quantity = item.quantity ?? 1;

            await activateMembership(
                buyerUserId,
                matchedPkg._id,
                orderData.orderNumber || "",
                quantity,
                matchedPkg.type as "one-time" | "monthly" | "yearly"
            );

            console.log(
                `[seller-membership] Activated ${matchedPkg.name} for user ${buyerUserId} (qty: ${quantity}, order: ${orderData.orderNumber})`
            );
        }
    } catch (error) {
        console.error("[seller-membership] onOrderDelivered error:", error);
    }
}

// Register as a data hook so other plugins/services can trigger it
// Usage: await runDataHook("seller-membership:activate", userId, "", orderData);
registerServerDataHook("seller-membership:activate", async (id, slug, data) => {
    await onOrderDelivered(data);
    return { activated: true };
});

// ── Product upload guard helper (used by API routes) ──────────────────────────

/**
 * Check if a seller can upload more products.
 * Returns { allowed: true } or { allowed: false, error: string, ... }.
 *
 * Free package (no membership) still allows uploads if the seller has
 * no membership record — the product plugin handles that independently.
 * This function only gates when a membership IS active.
 */
export async function checkSellerMembership(sellerUserId: string): Promise<{
    allowed: boolean;
    error?: string;
    membership?: any;
    package?: any;
}> {
    const { getMembershipForUser } = await import("../models/SellerMembership");
    const { getPackageById } = await import("../models/MembershipPackage");

    const membership = await getMembershipForUser(sellerUserId);
    if (!membership) {
        // No membership record — allow (free sellers or no plugin active)
        return { allowed: true };
    }

    if (membership.status !== "active") {
        return {
            allowed: false,
            error: "Your membership has expired. Please renew to continue uploading products.",
            membership,
        };
    }

    const pkg = await getPackageById(membership.packageId);
    if (!pkg) {
        return { allowed: true };
    }

    if (membership.productCount >= pkg.productLimit) {
        return {
            allowed: false,
            error: `You've reached your product limit (${pkg.productLimit}). Please upgrade your membership package.`,
            membership,
            package: pkg,
        };
    }

    return { allowed: true, membership, package: pkg };
}
