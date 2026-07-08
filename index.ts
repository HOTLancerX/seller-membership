/**
 * plugin/seller-membership/index.ts — Seller Membership / Subscription plugin.
 *
 * ── What it does ─────────────────────────────────────────────────────────────
 *   Admin creates membership packages (free or paid, one-time / monthly / yearly).
 *   Each package defines a product upload limit and optionally links to a product
 *   that the seller must purchase to activate the membership.
 *
 *   When the linked product order is delivered, the membership activates.
 *   After expiry the seller can no longer upload products until they renew.
 *
 * ── Registration ─────────────────────────────────────────────────────────────
 *   - Admin nav: "Seller Membership" section with Packages + Members sub-items
 *   - Admin pages: package management, member list
 *   - Account nav: "Membership" page (all sellers)
 *   - Account page: membership status + usage
 *   - Root pages: /membership public listing with Buy Now → /checkout
 */

import { addHook, type PluginMeta } from "@/hook";
import { addAction } from "@/hook/pluginHooks";
import AdminMembershipPackages from "./pages/AdminMembershipPackages";
import AdminMembershipMembers from "./pages/AdminMembershipMembers";
import SellerMembershipPage from "./pages/SellerMembershipPage";
import MembershipListingPage from "./pages/MembershipListingPage";

// ─── Plugin metadata ──────────────────────────────────────────────────────────
export const PLUGINS: PluginMeta = {
    nx:          "com.system.seller-membership",
    name:        "Seller Membership",
    version:     "1.0.0",
    description: "Seller subscription packages — control product upload limits.",
    author:      "System",
    path:        "https://github.com/HOTLancerX/seller-membership.git",
    icon:        "solar:crown-bold",
    color:       "from-indigo-500 to-purple-600",
};

/**
 * Register all hooks for this plugin.
 * Called by PluginList.reregisterHooks() after the gate is armed.
 */
export function register() {

    // ─── Action: order.delivered → activate membership ────────────────────────
    // Fired by product/api/orders/[orderNumber]/route.ts when an order transitions
    // to "delivered". If any item matches a membership package's linked productId,
    // activate or renew the buyer's seller membership.
    // The product plugin has ZERO imports from this plugin.
    addAction<{
        order: any;
        orderNumber: string;
        userId: string;
        items: any[];
    }>("order.delivered", async ({ order, orderNumber, userId, items }) => {
        try {
            const buyerUserId = userId || order?.userId;
            if (!buyerUserId) return;

            const [{ getActivePackages }, { activateMembership }] = await Promise.all([
                import("./models/MembershipPackage"),
                import("./models/SellerMembership"),
            ]);

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
                    matchedPkg.type as 'one-time' | 'monthly' | 'yearly'
                );

                console.log(
                    `[seller-membership] Activated ${matchedPkg.name} for user ${buyerUserId}` +
                    ` (qty: ${quantity}, order: ${orderNumber})`
                );
            }
        } catch (err) {
            console.error('[seller-membership] order.delivered handler error:', err);
        }
    }, PLUGINS.nx, 20); // priority 20 — runs after seller commission (priority 10)

    // ─── Admin nav — Seller Membership section ────────────────────────────────
    addHook("admin.nav", [
        {
            key:      "seller-membership",
            label:    "Seller Membership",
            icon:     "solar:crown-bold",
            slug:     "seller-membership",
            parent:   "",
            position: 21,
        },
        {
            key:      "seller-membership-members",
            label:    "Members",
            icon:     "solar:users-group-rounded-bold",
            slug:     "seller-membership/members",
            parent:   "seller-membership",
            position: 2,
        },
    ], PLUGINS.nx);

    // ─── Admin pages ──────────────────────────────────────────────────────────
    addHook("admin.pages", [
        {
            key:      "seller-membership",
            label:    "Membership Packages",
            type:     "seller-membership-admin",
            style:    "left",
            position: 55,
            path:     AdminMembershipPackages,
        },
        {
            key:      "seller-membership/members",
            label:    "Membership Members",
            type:     "seller-membership-admin",
            style:    "left",
            position: 56,
            path:     AdminMembershipMembers,
        },
    ], PLUGINS.nx);

    // ─── Account nav — Membership page (all sellers) ──────────────────────────
    addHook("user.nav", [
        {
            key:        "seller-membership",
            label:      "Membership",
            icon:       "solar:crown-bold",
            slug:       "membership",
            parent:     "",
            position:   4,
            sellerOnly: true,
        },
    ], PLUGINS.nx);

    // ─── Account pages ────────────────────────────────────────────────────────
    addHook("user.page", [
        {
            key:      "membership",
            label:    "My Membership",
            type:     "seller-membership",
            style:    "left",
            position: 4,
            path:     SellerMembershipPage,
        },
    ], PLUGINS.nx);

    // ─── Root pages — public /membership listing ──────────────────────────────
    addHook("root.pages", [
        {
            key:      "membership",
            label:    "Membership Packages",
            type:     "single",
            slug:     "single",
            style:    "left",
            position: 20,
            active:   true,
            component: MembershipListingPage,
        },
    ], PLUGINS.nx);
}
