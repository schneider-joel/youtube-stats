import fs from "fs";
import fetch from "node-fetch";

const API_KEY = "AIzaSyB6yx6m9giPv-h9odvDzj5geBOGR2fDbY4";
const CHANNEL_ID = "UC60VADsqDa0oooYS8gpN_sw";
const API_URL = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${CHANNEL_ID}&key=${API_KEY}`;

const FILE_PATH = "youtube_stats.json"; // Archivo donde se guardarán los datos

async function fetchYouTubeStats() {
    try {
        console.log("📡 Obteniendo datos de YouTube...");
        const response = await fetch(API_URL);
        const data = await response.json();

        if (data.error) {
            console.error("⚠️ ERROR de la API:", data.error.message);
            return;
        }

        const stats = {
            subscribers: data.items[0].statistics.subscriberCount,
            views: data.items[0].statistics.viewCount,
            videos: data.items[0].statistics.videoCount,
            lastUpdated: new Date().toISOString(),
        };

        console.log("✅ Datos obtenidos:", stats);

        fs.writeFileSync(FILE_PATH, JSON.stringify(stats, null, 2));
        console.log(`💾 Datos guardados en ${FILE_PATH}`);
    } catch (error) {
        console.error("❌ Error obteniendo datos:", error);
    }
}

// Ejecutar la función
fetchYouTubeStats();
