import fs from "fs/promises";
import fetch from "node-fetch";

// 🔹 Configuración de YouTube
const API_KEY = "AIzaSyB6yx6m9giPv-h9odvDzj5geBOGR2fDbY4";
const CHANNEL_ID = "UC60VADsqDa0oooYS8gpN_sw";
const STATS_FILE = "youtube_stats.json";

// 🔹 Función para obtener estadísticas generales del canal
async function fetchChannelStats() {
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
async function fetchTopVideos() {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&maxResults=6&order=viewCount&type=video&key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.items) {
        console.error("⚠️ ERROR: No se pudieron obtener los videos.");
        return [];
    }

    return await Promise.all(
        data.items.map(async (video) => {
            const videoId = video.id.videoId;
            const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${API_KEY}`;
            const statsResponse = await fetch(statsUrl);
            const statsData = await statsResponse.json();
            const views = statsData.items?.[0]?.statistics?.viewCount || "0";

            return {
                title: video.snippet.title,
                views: parseInt(views).toLocaleString(),
                url: `https://www.youtube.com/watch?v=${videoId}`,
                thumbnail: video.snippet.thumbnails.medium.url,
            };
        })
    );
}



// 🔹 Función principal para obtener y guardar los datos
async function fetchYouTubeStats() {
    console.log("📡 Obteniendo datos de YouTube...");
    
    const stats = await fetchChannelStats();
    const topVideos = await fetchTopVideos();

    if (!stats) return;

    const data = {
        ...stats,
        topVideos,
        lastUpdated: new Date().toISOString(),
    };

    fs.writeFileSync(STATS_FILE, JSON.stringify(data, null, 2));
    console.log("💾 Datos guardados en youtube_stats.json");
}

// 🔹 Ejecutar la función
fetchYouTubeStats();
