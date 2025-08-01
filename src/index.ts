import express from "express";
import dotenv from "dotenv";
import { PrismaClient } from "../generated/prisma/client";
import cors from "cors";

dotenv.config();
const app = express();
const prisma = new PrismaClient();
// app.use(express.json());
app.use(express.text());
app.use(
  cors({
    origin: "*",
  })
);

app.post("/track-click", async (req, res) => {
  const parsedBody = JSON.parse(req.body) || {};
  const { userId, sessionId, text, tag, ElementId, className, utms } =
    parsedBody;

  try {
    await prisma.click.create({
      data: {
        userId,
        sessionId,
        text,
        tag,
        elementId: ElementId || null,
        className: className || null,
        utm_source: utms?.utm_source || null,
        utm_medium: utms?.utm_medium || null,
        utm_campaign: utms?.utm_campaign || null,
        ref: utms?.ref || null,
        ddsaCode: utms?.ddsaCode || null,
      },
    });

    res.status(201).send({ success: true });
  } catch (err) {
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
        utm_source: utms?.utm_source || null,
        utm_medium: utms?.utm_medium || null,
        utm_campaign: utms?.utm_campaign || null,
        ref: utms?.ref || null,
        ddsaCode: utms?.ddsaCode || null,
      },
    });

    res.status(201).send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Could not track conversion" });
  }
});

// app.get("/stats/:ddsaCode", express.json(), async (req, res) => {
//   const { ddsaCode } = req.params;

//   if (!ddsaCode) {
//     res.status(400).send({ error: "Missing ddsaCode" });
//     return;
//   }

//   try {
//     const [clickCount, conversionCount] = await Promise.all([
//       prisma.click.count({
//         where: { ddsaCode },
//       }),
//       prisma.conversion.count({
//         where: { ddsaCode },
//       }),
//     ]);

//     res.send({
//       ddsaCode,
//       clickCount,
//       conversionCount,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send({ error: "Could not fetch stats" });
//   }
// });
app.get("/stats/:ddsaCode", express.json(), async (req, res) => {
  const { ddsaCode } = req.params;

  if (!ddsaCode) {
    res.status(400).send({ error: "Missing ddsaCode" });
    return;
  }

  try {
    const clickCount = await prisma.click.count({
      where: { ddsaCode },
    });

    // Get all sessionIds that have at least one click with this ddsaCode
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
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Could not fetch stats" });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Tracker server listening on port ${process.env.PORT || 3000}`);
});
