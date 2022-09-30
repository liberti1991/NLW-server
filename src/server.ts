import express from "express";
import cors from "cors";

import {PrismaClient} from '@prisma/client'
import { convertHoursStringToMinutes } from "./utils/convertHourStringToMinutes";
import { convertMinutestoHorsString } from "./utils/convertMinutesToHourString";

const app = express();

app.use(express.json())
app.use(cors({
  // origin: "www.google.com",
}))

const prisma = new PrismaClient({
  log: ['query']
});

app.get("/games", async (request, res) => {
  const games = await prisma.game.findMany({
    include:{
      _count: {
        select: {
          ads: true
        }
      }
    }
  })

  return res.json(games);
});

app.post("/games/:id/ads", async (request, res) => {
  const gameId = request.params.id;
  const body = request.body;

  const ad = await prisma.ad.create({
    data: {
      gameId,
      name: body.name,
      yearsPlaying: body.yearsPlaying,
      discord: body.discord,
      weekDays: body.weekDays.join(','),
      housStar: convertHoursStringToMinutes(body.housStar),
      hourEnd: convertHoursStringToMinutes(body.hourEnd),
      useVoiceChannel: body.useVoiceChannel
    }
  })

  return res.status(201).json(ad);
});

app.get("/games/:id/ads", async(request, response) => {
  const gameId = request.params.id;

  const ads = await prisma.ad.findMany({
    select: {
      id: true,
      name: true,
      weekDays: true,
      useVoiceChannel: true,
      yearsPlaying: true,
      housStar: true, 
      hourEnd: true
    },
    where: {
        gameId: gameId
    },
    orderBy:{
      createAt: 'desc'
    }
  })
  
  return response.json(ads.map(ad=>{
    return {
      ...ad,
      weekDays: ad.weekDays.split(','),
      housStar: convertMinutestoHorsString(ad.housStar),
      hourEnd: convertMinutestoHorsString(ad.hourEnd)
    }
  }))
});

app.get("/ads/:id/discord", async (request, res) => {
  const adId = request.params.id;

  const ad = await prisma.ad.findUniqueOrThrow({
    select: {
      discord: true
    },
    where: {
      id: adId
    }
  })

  return res.json({
    discord: ad.discord,
  });
});

app.listen(3333);
