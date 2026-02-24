require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const VT_API_KEY = process.env.VT_API_KEY;

// Extrair URLs do email
function extrairURLs(texto) {
    return texto.match(/https?:\/\/[^\s]+/g) || [];
}

// Análise heurística local
function analiseLocal(texto) {
    let score = 0;
    let motivos = [];

    const regras = [
        { regex: /urgente|imediatamente|ação necessária/i, peso: 10, msg: "Uso de urgência", tipo: "medium" },
        { regex: /clique aqui|verifique conta|atualizar conta/i, peso: 15, msg: "Pedido direto de ação", tipo: "medium" },
        { regex: /http:\/\//i, peso: 20, msg: "Link HTTP inseguro", tipo: "high" },
        { regex: /\d+\.\d+\.\d+\.\d+/, peso: 25, msg: "URL com IP direto", tipo: "high" },
        { regex: /bit\.ly|tinyurl/i, peso: 20, msg: "Uso de encurtador de URL", tipo: "high" },
        { regex: /paypa1|g00gle|micros0ft/i, peso: 30, msg: "Possível ataque homográfico", tipo: "high" }
    ];

    regras.forEach(r => {
        if (r.regex.test(texto)) {
            score += r.peso;
            motivos.push({ msg: r.msg, tipo: r.tipo });
        }
    });

    return { score, motivos };
}

// Consulta VirusTotal
async function verificarURL(url) {
    try {
        const urlId = Buffer.from(url).toString("base64").replace(/=/g, "");
        const response = await axios.get(
            `https://www.virustotal.com/api/v3/urls/${urlId}`,
            { headers: { "x-apikey": VT_API_KEY } }
        );
        const stats = response.data.data.attributes.last_analysis_stats;
        return stats.malicious || 0;
    } catch (error) {
        console.log("Erro VirusTotal:", error.response?.status || error.message);
        return 0;
    }
}

// Endpoint principal
app.post("/analisar", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ erro: "Email não fornecido" });

    let totalScore = 0;
    let motivos = [];

    // 1️⃣ Análise local
    const local = analiseLocal(email);
    totalScore += local.score;
    motivos.push(...local.motivos);

    // 2️⃣ Verificar links com VirusTotal
    const urls = extrairURLs(email);
    for (let url of urls) {
        const deteccoes = await verificarURL(url);
        if (deteccoes > 0) {
            totalScore += 30;
            motivos.push({ msg: `VirusTotal: ${deteccoes} motores classificaram como malicioso`, tipo: "high" });
        }
    }

    if (totalScore > 100) totalScore = 100;

    let nivel = "BAIXO";
    if (totalScore >= 70) nivel = "ALTO";
    else if (totalScore >= 40) nivel = "MODERADO";

    res.json({ score: totalScore, nivel, motivos });
});

app.listen(3000, () => console.log("Servidor ativo em http://localhost:3000"));