/**
 * plugin/seller-membership/lib/actionHooks.ts — Server-only action hook registrations.
 *
 * Auto-discovered by hook/serverDataHooks.ts via require.context
*/

import { addAction } from "@/hook/pluginHooks";
import { getActivePackages } from "../models/MembershipPackage";
import { activateMembership } from "../models/SellerMembership";

const PLUGIN_NX = "com.system.seller-membership";

// ─── Action: order.delivered → activate membership ────────────────────────────
// Priority 20 — runs after seller commission credit (priority 10).

addAction<{
    order: any;
    orderNumber: string;
    userId: string;
    items: any[];
}>(
    "order.delivered",
    async ({ order, orderNumber, userId, items }) => {
        try {
            const buyerUserId = userId || order?.userId;
            if (!buyerUserId) return;

            const packages = await getActivePackages();
            if (!packages.length) return;

            for (const item of (items ?? [])) {
                const matchedPkg = packages.find((p: any) => p.productId === item.productId);
                if (!matchedPkg) continue;

                const quantity = item.quantity ?? 1;
                await activateMembership(
                    buyerUserId,
                    matchedPkg._id,
                    orderNumber,
                    quantity,
                    matchedPkg.type as "one-time" | "monthly" | "yearly"
                );

                console.log(
                    `[seller-membership] Activated ${matchedPkg.name} for user ${buyerUserId}` +
                    ` (qty: ${quantity}, order: ${orderNumber})`
                );
            }
        } catch (err) {
            console.error("[seller-membership] order.delivered handler error:", err);
        }
    },
    PLUGIN_NX,
    20
);
