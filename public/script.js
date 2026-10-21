import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAfr_48YPX4tsu9HesLAHc1q0WdB5As-Vs",
  authDomain: "ia-becky.firebaseapp.com",
  projectId: "ia-becky",
  storageBucket: "ia-becky.firebasestorage.app",
  messagingSenderId: "342602360420",
  appId: "1:342602360420:web:732cb5f84ca566c0cda171",
  measurementId: "G-9DZC5CW1PR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let registrosABC = [];
let chartInstance = null;
let profissionais = JSON.parse(localStorage.getItem('lista_profissionais') || '["Psicólogo Bruno Costa Feijó Xavier (CRP RS 07/42923)"]');
let monitores = JSON.parse(localStorage.getItem('lista_monitores') || '["Nenhum / Sem Monitor", "Monitor 01"]');

window.carregarListasEquipe = function() {
    const selProf = document.getElementById('selectProfissional');
    const selMon = document.getElementById('selectMonitor');

    if (selProf) {
        selProf.innerHTML = '<option value="">-- Selecione o Profissional --</option>';
        profissionais.forEach(p => { selProf.innerHTML += `<option value="${p}">${p}</option>`; });
    }

    if (selMon) {
        selMon.innerHTML = '<option value="">-- Selecione o Monitor --</option>';
        monitores.forEach(m => { selMon.innerHTML += `<option value="${m}">${m}</option>`; });
    }
};

window.cadastrarProfissional = function() {
    const nome = prompt("Digite o nome do Profissional:");
    if (nome && nome.trim() !== "") {
        profissionais.push(nome.trim());
        localStorage.setItem('lista_profissionais', JSON.stringify(profissionais));
        window.carregarListasEquipe();
        document.getElementById('selectProfissional').value = nome.trim();
    }
};

window.cadastrarMonitor = function() {
    const nome = prompt("Digite o nome do Monitor:");
    if (nome && nome.trim() !== "") {
        monitores.push(nome.trim());
        localStorage.setItem('lista_monitores', JSON.stringify(monitores));
        window.carregarListasEquipe();
        document.getElementById('selectMonitor').value = nome.trim();
    }
};

window.calcularTempoPermanencia = function() {
    const inicio = document.getElementById('horaInicio').value;
    const fim = document.getElementById('horaFim').value;
    const txtTempo = document.getElementById('tempoTotalTexto');

    if (inicio && fim) {
        const [h1, m1] = inicio.split(':').map(Number);
        const [h2, m2] = fim.split(':').map(Number);
        let minInicio = h1 * 60 + m1;
        let minFim = h2 * 60 + m2;
        if (minFim < minInicio) minFim += 24 * 60;
        const diferenca = minFim - minInicio;
        const horas = Math.floor(diferenca / 60);
        const minutos = diferenca % 60;
        txtTempo.textContent = `${horas > 0 ? horas + 'h ' : ''}${minutos} min (${diferenca} min totais)`;
        return diferenca;
    } else {
        txtTempo.textContent = "0 min";
        return 0;
    }
};

window.adicionarLinhaABC = function() {
    const hora = document.getElementById('abcHora').value;
    const antecedente = document.getElementById('abcAntecedente').value;
    const prodromos = document.getElementById('abcProdromos').value || '-';
    const comportamento = document.getElementById('abcComportamento').value;
    const consequencia = document.getElementById('abcConsequencia').value;
    const hipotese = document.getElementById('abcHipotese').value;

    if (!hora) {
        alert('Por favor, informe a hora do evento.');
        return;
    }

    registrosABC.push({ hora, antecedente, prodromos, comportamento, consequencia, hipotese });
    atualizarTabelaABC();
};

function atualizarTabelaABC() {
    const tbody = document.getElementById('tabelaAbcCorpo');
    tbody.innerHTML = '';
    registrosABC.forEach((item, index) => {
        tbody.innerHTML += `
            <tr class="border-b hover:bg-slate-50">
                <td class="p-2 border font-medium">${item.hora}</td>
                <td class="p-2 border">${item.antecedente}</td>
                <td class="p-2 border text-slate-500">${item.prodromos}</td>
                <td class="p-2 border font-medium">${item.comportamento}</td>
                <td class="p-2 border">${item.consequencia}</td>
                <td class="p-2 border"><span class="bg-teal-50 text-teal-800 text-xs px-2 py-0.5 rounded border border-teal-200 font-semibold">${item.hipotese}</span></td>
                <td class="p-2 border text-center">
                    <button onclick="removerItem(${index})" class="text-red-600 hover:text-red-800 text-xs font-bold">Excluir</button>
                </td>
            </tr>
        `;
    });
}

window.removerItem = function(index) {
    registrosABC.splice(index, 1);
    atualizarTabelaABC();
};

window.salvarSessao = async function() {
    const paciente = document.getElementById('paciente').value;
    const sessao = document.getElementById('numSessao').value;
    const data = document.getElementById('dataSessao').value;

    if (!sessao || !data) {
        alert('Preencha o Número da Sessão e a Data antes de salvar.');
        return;
    }

    const medicacaoEl = document.querySelector('input[name="medicacao"]:checked');
    const sensorialEls = document.querySelectorAll('.sensorial:checked');
    const vestuarioEls = document.querySelectorAll('.vestuario:checked');

    const dadosSessao = {
        paciente,
        sessao: parseInt(sessao),
        data,
        profissional: document.getElementById('selectProfissional').value || 'Não informado',
        monitor: document.getElementById('selectMonitor').value || 'Não informado',
        horaInicio: document.getElementById('horaInicio').value,
        horaFim: document.getElementById('horaFim').value,
        tempoPermanenciaMinutos: window.calcularTempoPermanencia(),
        medicacao: medicacaoEl ? medicacaoEl.value : 'Não informada',
        sensorial: Array.from(sensorialEls).map(el => el.value),
        vestuario: Array.from(vestuarioEls).map(el => el.value),
        auto: document.getElementById('qtdAuto').value,
        hetero: document.getElementById('qtdHetero').value,
        intervencao: document.getElementById('intervencaoEficaz').value,
        eventosABC: registrosABC,
        anotacoes: document.getElementById('anotacoesClinicas').value
    };

    try {
        await setDoc(doc(db, "sessoes_abc", `sessao_${sessao}`), dadosSessao);
        alert(`Sessão Nº ${sessao} salva no Firebase Firestore!`);
        await carregarHistoricoFirestore();
    } catch (e) {
        console.error("Erro ao salvar no Firestore: ", e);
        alert("Erro ao salvar no banco de dados em nuvem.");
    }
};

async function carregarHistoricoFirestore() {
    try {
        const q = query(collection(db, "sessoes_abc"), orderBy("sessao", "asc"));
        const querySnapshot = await getDocs(q);
        const historico = [];
        const select = document.getElementById('selectHistoricoSessao');
        select.innerHTML = '<option value="">-- Selecione uma Sessão --</option>';

        querySnapshot.forEach((docSnap) => {
            const h = docSnap.data();
            historico.push(h);
            select.innerHTML += `<option value="${h.sessao}">Sessão Nº ${h.sessao} - Data: ${h.data} (${h.paciente})</option>`;
        });

        window.historicoLocal = historico;
        renderizarGrafico(historico);
    } catch (e) {
        console.error("Erro ao carregar histórico: ", e);
    }
}

window.carregarEvolucaoSelecionada = function() {
    const numSessao = document.getElementById('selectHistoricoSessao').value;
    if (!numSessao || !window.historicoLocal) return;

    const dados = window.historicoLocal.find(h => parseInt(h.sessao) === parseInt(numSessao));
    if (dados) {
        document.getElementById('paciente').value = dados.paciente;
        document.getElementById('numSessao').value = dados.sessao;
        document.getElementById('dataSessao').value = dados.data;
        document.getElementById('selectProfissional').value = dados.profissional || '';
        document.getElementById('selectMonitor').value = dados.monitor || '';
        document.getElementById('horaInicio').value = dados.horaInicio || '';
        document.getElementById('horaFim').value = dados.horaFim || '';

        window.calcularTempoPermanencia();

        document.querySelectorAll('input[name="medicacao"]').forEach(el => { el.checked = (el.value === dados.medicacao); });
        document.querySelectorAll('.sensorial').forEach(el => { el.checked = dados.sensorial.includes(el.value); });
        document.querySelectorAll('.vestuario').forEach(el => { el.checked = dados.vestuario.includes(el.value); });

        document.getElementById('qtdAuto').value = dados.auto;
        document.getElementById('qtdHetero').value = dados.hetero;
        document.getElementById('intervencaoEficaz').value = dados.intervencao;
        document.getElementById('anotacoesClinicas').value = dados.anotacoes;

        registrosABC = dados.eventosABC || [];
        atualizarTabelaABC();
    }
};

window.limparFormulario = function() {
    document.getElementById('numSessao').value = '';
    document.getElementById('dataSessao').value = '';
    document.getElementById('horaInicio').value = '';
    document.getElementById('horaFim').value = '';
    document.getElementById('tempoTotalTexto').textContent = '0 min';
    document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(el => el.checked = false);
    document.getElementById('qtdAuto').value = '0';
    document.getElementById('qtdHetero').value = '0';
    document.getElementById('anotacoesClinicas').value = '';
    document.getElementById('selectHistoricoSessao').value = '';
    registrosABC = [];
    atualizarTabelaABC();
};

function renderizarGrafico(historico) {
    const labelsSessoes = historico.map(h => `Sessão ${h.sessao}`);
    const dadosAuto = historico.map(h => parseInt(h.auto || 0));
    const dadosHetero = historico.map(h => parseInt(h.hetero || 0));

    const ctx = document.getElementById('graficoEvolucao').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labelsSessoes.length ? labelsSessoes : ['Sem Registros'],
            datasets: [{
                label: 'Automutilação',
                data: dadosAuto.length ? dadosAuto : [0],
                borderColor: 'rgb(13, 148, 136)',
                backgroundColor: 'rgba(13, 148, 136, 0.1)',
                fill: true
            }, {
                label: 'Heteroagressividade',
                data: dadosHetero.length ? dadosHetero : [0],
                borderColor: 'rgb(225, 29, 72)',
                backgroundColor: 'rgba(225, 29, 72, 0.1)',
                fill: true
            }]
        },
        options: { responsive: true }
    });
}

window.onload = function() {
    window.carregarListasEquipe();
    carregarHistoricoFirestore();
};