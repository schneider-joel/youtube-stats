import { writeFileSync } from "fs";
import fetch from "node-fetch";

// 🔹 Configuración de YouTube
const API_KEY = "AIzaSyB6yx6m9giPv-h9odvDzj5geBOGR2fDbY4";
// Un JSON por canal (mismo formato). skipShorts: top sin Shorts (más de 3 min) y ordenado por las vistas reales,
// porque el orden por vistas del buscador de YouTube no siempre está al día.
const CHANNELS = [
    { name: "El Negocio del Fútbol", id: "UC60VADsqDa0oooYS8gpN_sw", file: "youtube_stats.json" },
    { name: "Moatseek", id: "UCejBvl107yBdgUfI7qWcMwg", file: "moatseek_stats.json", skipShorts: true },
];

// 🔹 Función para obtener estadísticas generales del canal
async function fetchChannelStats(CHANNEL_ID) {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${CHANNEL_ID}&key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.items) {
        console.error("⚠️ ERROR: No se pudieron obtener las estadísticas del canal.");
        return null;
    }

    return {
        subscribers: parseInt(data.items[0].statistics.subscriberCount).toLocaleString(),
        views: parseInt(data.items[0].statistics.viewCount).toLocaleString(),
        videos: parseInt(data.items[0].statistics.videoCount).toLocaleString(),
    };
}

// 🔹 Función para obtener los 6 videos más vistos con su cantidad de vistas
async function fetchTopVideos(CHANNEL_ID, skipShorts = false) {
    // Con skipShorts se piden más candidatos para que queden 6 tras descartar los Shorts y reordenar
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&maxResults=${skipShorts ? 15 : 6}&order=viewCount&type=video&key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.items) {
        console.error("⚠️ ERROR: No se pudieron obtener los videos.");
        return [];
    }

    const videos = await Promise.all(
        data.items.map(async (video) => {
            const videoId = video.id.videoId;
            const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoId}&key=${API_KEY}`;
            const statsResponse = await fetch(statsUrl);
            const statsData = await statsResponse.json();
            const views = statsData.items?.[0]?.statistics?.viewCount || "0";
            const duration = statsData.items?.[0]?.contentDetails?.duration || "";

            return {
                title: video.snippet.title,
                views: parseInt(views).toLocaleString(),
                url: `https://www.youtube.com/watch?v=${videoId}`,
                thumbnail: video.snippet.thumbnails.medium.url,
                seconds: toSeconds(duration),
                viewCount: parseInt(views),
            };
        })
    );

    const top = skipShorts ? videos.filter((v) => v.seconds > 180).sort((a, b) => b.viewCount - a.viewCount) : videos;
    return top.slice(0, 6).map(({ seconds, viewCount, ...v }) => v);
}

// "PT14M51S" → 891
function toSeconds(iso) {
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    return m ? (+(m[1] || 0)) * 3600 + (+(m[2] || 0)) * 60 + (+(m[3] || 0)) : 0;
}

// 🔹 Función principal para obtener y guardar los datos de cada canal
async function fetchYouTubeStats() {
    for (const channel of CHANNELS) {
        console.log(`📡 Obteniendo datos de YouTube: ${channel.name}...`);

        const stats = await fetchChannelStats(channel.id);
        const topVideos = await fetchTopVideos(channel.id, channel.skipShorts);

        // Si falla un canal, se conserva su último JSON y se sigue con el siguiente
        if (!stats) continue;

        const data = {
            ...stats,
            topVideos,
            lastUpdated: new Date().toISOString(),
        };

        writeFileSync(channel.file, JSON.stringify(data, null, 2));
        console.log(`💾 Datos guardados en ${channel.file}`);
    }
}

// 🔹 Ejecutar la función
fetchYouTubeStats();
