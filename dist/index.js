"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("../generated/prisma/client");
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
app.use(express_1.default.text());
app.use((0, cors_1.default)({
    origin: "*",
}));
app.post("/track-click", async (req, res) => {
    const parsedBody = JSON.parse(req.body) || {};
    const { userId, sessionId, text, tag, ElementId, className, utms } = parsedBody;
    try {
        await prisma.click.create({
            data: {
                userId,
                sessionId,
                text,
                tag,
                elementId: ElementId || null,
                className: className || null,
                utm_source: (utms === null || utms === void 0 ? void 0 : utms.utm_source) || null,
                utm_medium: (utms === null || utms === void 0 ? void 0 : utms.utm_medium) || null,
                utm_campaign: (utms === null || utms === void 0 ? void 0 : utms.utm_campaign) || null,
                ref: (utms === null || utms === void 0 ? void 0 : utms.ref) || null,
                ddsaCode: (utms === null || utms === void 0 ? void 0 : utms.ddsaCode) || null,
            },
        });
        res.status(201).send({ success: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ error: "Could not track click" });
    }
});
app.post("/track-conversion", async (req, res) => {
    const { userId, sessionId, method, utms } = req.body;
    try {
        await prisma.conversion.create({
            data: {
                userId,
                sessionId,
                method,
                utm_source: (utms === null || utms === void 0 ? void 0 : utms.utm_source) || null,
                utm_medium: (utms === null || utms === void 0 ? void 0 : utms.utm_medium) || null,
                utm_campaign: (utms === null || utms === void 0 ? void 0 : utms.utm_campaign) || null,
                ref: (utms === null || utms === void 0 ? void 0 : utms.ref) || null,
                ddsaCode: (utms === null || utms === void 0 ? void 0 : utms.ddsaCode) || null,
            },
        });
        res.status(201).send({ success: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ error: "Could not track conversion" });
    }
});
app.get("/stats/:ddsaCode", express_1.default.json(), async (req, res) => {
    const { ddsaCode } = req.params;
    if (!ddsaCode) {
        res.status(400).send({ error: "Missing ddsaCode" });
        return;
    }
    try {
        const clickCount = await prisma.click.count({
            where: { ddsaCode },
        });
        const sessionsWithClicks = await prisma.click.findMany({
            where: { ddsaCode },
            select: { sessionId: true },
            distinct: ["sessionId"],
        });
        const validSessionIds = sessionsWithClicks.map((s) => s.sessionId);
        const conversionCount = await prisma.conversion.count({
            where: {
                ddsaCode,
                sessionId: {
                    in: validSessionIds,
                },
            },
        });
        res.send({
            ddsaCode,
            clickCount,
            conversionCount,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ error: "Could not fetch stats" });
    }
});
app.listen(3000, () => {
    console.log("Tracker server listening on port 3000");
});
//# sourceMappingURL=index.js.map