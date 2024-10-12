import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
import { calculatePercentage, getCategoriesCount, getChartData, } from "../utils/features.js";
export const getDashboardStats = TryCatch(async (req, res, next) => {
    let stats;
    let key = "admin-stats";
    if (myCache.has(key)) {
        stats = JSON.parse(myCache.get(key));
    }
    else {
        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(today.getMonth() - 6);
        const thisMonth = {
            start: new Date(today.getFullYear(), today.getMonth(), 1),
            end: today,
        };
        const lastMonth = {
            start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
            end: new Date(today.getFullYear(), today.getMonth(), 0),
        };
        const thisMonthProductsPromise = Product.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end,
            },
        });
        const lastMonthProductsPromise = Product.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end,
            },
        });
        const thisMonthUsersPromise = User.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end,
            },
        });
        const lastMonthUsersPromise = User.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end,
            },
        });
        const thisMonthOrdersPromise = Order.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end,
            },
        });
        const lastMonthOrdersPromise = Order.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end,
            },
        });
        const lastSixMonthsOrdersPromise = Order.find({
            createdAt: {
                $gte: sixMonthsAgo,
                $lte: today,
            },
        });
        const latestOrdersPromise = Order.find({})
            .sort({ createdAt: -1 })
            .limit(4)
            .select(["orderItems", "discount", "total", "status"]);
        const [thisMonthProducts, thisMonthUsers, thisMonthOrders, lastMonthProducts, lastMonthUsers, lastMonthOrders, productCount, userCount, allOrders, lastSixMonthsOrders, categories, femaleUserCount, latestOrders,] = await Promise.all([
            thisMonthProductsPromise,
            thisMonthUsersPromise,
            thisMonthOrdersPromise,
            lastMonthProductsPromise,
            lastMonthUsersPromise,
            lastMonthOrdersPromise,
            Product.countDocuments(),
            User.countDocuments(),
            Order.find({}),
            lastSixMonthsOrdersPromise,
            Product.distinct("category"),
            User.countDocuments({ gender: "female" }),
            latestOrdersPromise,
        ]);
        const ChangePercent = {
            revenue: calculatePercentage(thisMonthOrders.reduce((total, order) => total + (order.total || 0), 0), lastMonthOrders.reduce((total, order) => total + (order.total || 0), 0)),
            products: calculatePercentage(thisMonthProducts.length, lastMonthProducts.length),
            users: calculatePercentage(thisMonthUsers.length, lastMonthUsers.length),
            orders: calculatePercentage(thisMonthOrders.length, lastMonthOrders.length),
        };
        const revenue = allOrders.reduce((total, order) => total + (order.total || 0), 0);
        const count = {
            revenue,
            products: productCount,
            users: userCount,
            orders: allOrders.length,
        };
        const orderMonthlyCount = getChartData({
            length: 6,
            today,
            docArr: lastSixMonthsOrders,
        });
        const orderMonthlyRevenue = getChartData({
            length: 6,
            today,
            property: "total",
            docArr: lastSixMonthsOrders,
        });
        const categoryCount = await getCategoriesCount({
            categories,
            productCount,
        });
        const userRatio = {
            male: (userCount - femaleUserCount) / userCount,
            female: femaleUserCount / userCount,
        };
        const modifiedLatestOrders = latestOrders.map((order) => {
            return {
                _id: order._id,
                discount: order.discount,
                amount: order.total,
                quantity: order.orderItems.length,
                status: order.status,
            };
        });
        stats = {
            categoryCount,
            ChangePercent,
            count,
            chart: {
                order: orderMonthlyCount,
                revenue: orderMonthlyRevenue,
            },
            userRatio,
            latestOrders: modifiedLatestOrders,
        };
        myCache.set(key, JSON.stringify(stats));
    }
    return res.status(200).json({
        success: true,
        message: "Admin dashboard stats",
        stats,
    });
});
export const getPieCharts = TryCatch(async (req, res, next) => {
    let charts;
    let key = "admin-pie-charts";
    if (myCache.has(key)) {
        charts = JSON.parse(myCache.get(key));
    }
    else {
        const allOrderPromise = Order.find({}).select([
            "total",
            "discount",
            "subtotal",
            "tax",
            "shippingCharges",
        ]);
        const [processingOrder, shippedOrder, deliveredOrder, categories, productCount, productsOutOfStock, allOrders, allUser, adminCount, userCount,] = await Promise.all([
            Order.countDocuments({ status: "Processing" }),
            Order.countDocuments({ status: "Shipped" }),
            Order.countDocuments({ status: "Delivered" }),
            Product.distinct("category"),
            Product.countDocuments(),
            Product.countDocuments({ stock: 0 }),
            allOrderPromise,
            User.find({}).select(["dob"]),
            User.countDocuments({ role: "admin" }),
            User.countDocuments({ role: "user" }),
        ]);
        const orderFullfiillment = {
            processing: processingOrder,
            shipped: shippedOrder,
            delivered: deliveredOrder,
        };
        const productCategories = await getCategoriesCount({
            categories,
            productCount,
        });
        const stockAvailability = {
            inStock: productCount - productsOutOfStock,
            outOfStock: productsOutOfStock,
        };
        const grossIncome = allOrders.reduce((prev, order) => prev + (order.total || 0), 0);
        const discount = allOrders.reduce((prev, order) => prev + (order.discount || 0), 0);
        const productionCost = allOrders.reduce((prev, order) => prev + (order.shippingCharges || 0), 0);
        const burnt = allOrders.reduce((prev, order) => prev + (order.tax || 0), 0);
        const marketingCost = Math.round(grossIncome * (30 / 100));
        const netMargin = grossIncome - discount - productionCost - burnt - marketingCost;
        const revenueDistribution = {
            netMargin,
            discount,
            productionCost,
            burnt,
            marketingCost,
        };
        const userAgeGroup = {
            teen: allUser.filter((user) => user.age < 20).length,
            adult: allUser.filter((user) => user.age >= 20 && user.age < 40).length,
            senior: allUser.filter((user) => user.age >= 40).length,
        };
        const adminCustomer = {
            admin: adminCount,
            user: userCount,
        };
        charts = {
            orderFullfiillment,
            productCategories,
            stockAvailability,
            revenueDistribution,
            userAgeGroup,
            adminCustomer,
        };
        myCache.set(key, JSON.stringify(charts));
    }
    return res.status(200).json({
        success: true,
        message: "Admin pie charts",
        charts,
    });
});
export const getBarCharts = TryCatch(async (req, res, next) => {
    let charts;
    let key = "admin-bar-charts";
    if (myCache.has(key)) {
        charts = JSON.parse(myCache.get(key));
    }
    else {
        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(today.getMonth() - 6);
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(today.getMonth() - 12);
        const sixMonthsProductsPromise = Product.find({
            createdAt: {
                $gte: sixMonthsAgo,
                $lte: today,
            },
        }).select("createdAt");
        const sixMonthsUsersPromise = User.find({
            createdAt: {
                $gte: sixMonthsAgo,
                $lte: today,
            },
        }).select("createdAt");
        const twelveMonthsOrdersPromise = Order.find({
            createdAt: {
                $gte: twelveMonthsAgo,
                $lte: today,
            },
        }).select("createdAt");
        const [Products, Users, Orders] = await Promise.all([
            sixMonthsProductsPromise,
            sixMonthsUsersPromise,
            twelveMonthsOrdersPromise,
        ]);
        const productCount = getChartData({ length: 6, today, docArr: Products });
        const userCount = getChartData({ length: 6, today, docArr: Users });
        const orderCount = getChartData({ length: 12, today, docArr: Orders });
        charts = {
            users: userCount,
            products: productCount,
            orders: orderCount,
        };
        myCache.set(key, JSON.stringify(charts));
    }
    return res.status(200).json({
        success: true,
        message: "Admin bar charts",
        charts,
    });
});
export const getLineCharts = TryCatch(async (req, res, next) => {
    let charts;
    let key = "admin-line-charts";
    if (myCache.has(key)) {
        charts = JSON.parse(myCache.get(key));
    }
    else {
        const today = new Date();
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(today.getMonth() - 12);
        const baseQuery = {
            createdAt: {
                $gte: twelveMonthsAgo,
                $lte: today,
            },
        };
        const [Products, Users, Orders] = await Promise.all([
            Product.find(baseQuery).select("createdAt"),
            User.find(baseQuery).select("createdAt"),
            Order.find(baseQuery).select("createdAt discount total status"),
        ]);
        const productCount = getChartData({ length: 12, today, docArr: Products });
        const userCount = getChartData({ length: 12, today, docArr: Users });
        const discount = getChartData({
            length: 12,
            today,
            property: "discount",
            docArr: Orders,
        });
        const revenue = getChartData({
            length: 12,
            today,
            property: "total",
            docArr: Orders,
        });
        charts = {
            users: userCount,
            products: productCount,
            discount: discount,
            revenue: revenue,
        };
        myCache.set(key, JSON.stringify(charts));
    }
    return res.status(200).json({
        success: true,
        message: "Admin line charts",
        charts,
    });
});
