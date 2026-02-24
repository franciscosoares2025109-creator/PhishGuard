document.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("analisarBtn");
    button.addEventListener("click", analisarEmail);
});

// Histórico de emails analisados
const history = [];

function preencherExemplo(id) {
    const emails = {
        email1: "Olá, detectamos atividade suspeita em sua conta bancária. Confirme: https://seguranca-banco-central-verificacao.com/login",
        email2: "Não foi possível entregar sua encomenda. Atualize seu endereço: http://correios-rastreamento-pacote.info/atualizar",
        email3: "Detectamos login incomum. Verifique sua conta imediatamente: https://linkedin-seguranca-alerta.com/verificar"
    };
    document.getElementById("emailInput").value = emails[id];
}

async function analisarEmail() {
    const email = document.getElementById("emailInput").value;

    if (!email.trim()) {
        alert("Por favor cole um email para análise.");
        return;
    }

    const scoreText = document.getElementById("scoreText");
    const progress = document.getElementById("progress");
    const motivosDiv = document.getElementById("motivos");

    scoreText.innerHTML = "🔍 A analisar...";
    progress.style.width = "0%";
    progress.style.background = "#888";
    motivosDiv.innerHTML = "";

    try {
        // Simulação de análise local
        let data = analisarEmailLocal(email);

        progress.style.width = data.score + "%";

        // Atualiza cor e texto do score
        if (data.nivel === "ALTO") {
            progress.style.background = "red";
            scoreText.innerHTML = `🚨 Alto Risco (${data.score}%)`;
        } else if (data.nivel === "MODERADO") {
            progress.style.background = "orange";
            scoreText.innerHTML = `⚠️ Risco Moderado (${data.score}%)`;
        } else {
            progress.style.background = "lightgreen";
            scoreText.innerHTML = `✅ Baixo Risco (${data.score}%)`;
        }

        // Exibe badges para cada motivo
        if (data.motivos.length > 0) {
            motivosDiv.innerHTML = "<strong>Motivos:</strong><br>";
            data.motivos.forEach(m => {
                let level = m.includes("link") ? "high" : m.includes("urgência") ? "medium" : "low";
                motivosDiv.innerHTML += `<span class="badge ${level}">${m}</span>`;
            });
        } else {
            motivosDiv.innerHTML = "<strong>Motivos:</strong><br><span class='badge low'>Nenhum padrão suspeito encontrado</span>";
        }

        // Adiciona ao histórico
        history.unshift({ email, score: data.score, nivel: data.nivel });
        atualizarHistorico();

    } catch (error) {
        scoreText.innerHTML = "❌ Erro ao analisar o email";
        progress.style.width = "0%";
        motivosDiv.innerHTML = "";
        console.error(error);
    }
}

function analisarEmailLocal(email) {
    let score = 0;
    let motivos = [];

    const links = email.match(/https?:\/\/[^\s]+/g);
    if (links && links.length > 0) {
        score += 40;
        motivos.push("Contém link(s) suspeito(s)");
    }

    if (email.toLowerCase().includes("urgente") || email.toLowerCase().includes("sua conta")) {
        score += 30;
        motivos.push("Texto tenta criar urgência");
    }

    if (email.toLowerCase().includes("clique aqui") || email.toLowerCase().includes("atualize")) {
        score += 30;
        motivos.push("Solicitação de ação imediata");
    }

    if (score > 100) score = 100;

    let nivel = "BAIXO";
    if (score >= 70) nivel = "ALTO";
    else if (score >= 40) nivel = "MODERADO";

    return { score, nivel, motivos };
}

function atualizarHistorico() {
    const historyList = document.getElementById("historyList");
    historyList.innerHTML = "";
    history.forEach(item => {
        historyList.innerHTML += `<li>${item.nivel} (${item.score}%): ${item.email.substring(0, 50)}${item.email.length > 50 ? '...' : ''}</li>`;
    });
}