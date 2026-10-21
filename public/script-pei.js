import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

let metasAtuais = [];

window.adicionarMetaPEI = function() {
    const area = document.getElementById('metaArea').value;
    const descricao = document.getElementById('metaDescricao').value;
    const dica = document.getElementById('metaDica').value;
    const prazo = document.getElementById('metaPrazo').value;

    if (!descricao || descricao.trim() === "") {
        alert("Descreva a meta antes de adicionar.");
        return;
    }

    metasAtuais.push({ area, descricao, dica, prazo, status: "Em Aquisição" });
    document.getElementById('metaDescricao').value = '';
    atualizarTabelaMetas();
};

function atualizarTabelaMetas() {
    const tbody = document.getElementById('tabelaMetasPei');
    tbody.innerHTML = '';

    metasAtuais.forEach((item, index) => {
        tbody.innerHTML += `
            <tr class="border-b hover:bg-slate-50">
                <td class="p-2 border font-semibold text-teal-900">${item.area}</td>
                <td class="p-2 border">${item.descricao}</td>
                <td class="p-2 border text-xs">${item.dica}</td>
                <td class="p-2 border text-xs">${item.prazo}</td>
                <td class="p-2 border">
                    <select onchange="alterarStatusMeta(${index}, this.value)" class="border rounded text-xs p-1 bg-white font-medium">
                        <option value="Em Aquisição" ${item.status === 'Em Aquisição' ? 'selected' : ''}>Em Aquisição</option>
                        <option value="Manutenção" ${item.status === 'Manutenção' ? 'selected' : ''}>Manutenção</option>
                        <option value="Generalizado" ${item.status === 'Generalizado' ? 'selected' : ''}>Generalizado</option>
                    </select>
                </td>
                <td class="p-2 border text-center">
                    <button onclick="removerMeta(${index})" class="text-red-600 hover:text-red-800 text-xs font-bold">Excluir</button>
                </td>
            </tr>
        `;
    });
}

window.alterarStatusMeta = function(index, novoStatus) {
    metasAtuais[index].status = novoStatus;
};

window.removerMeta = function(index) {
    metasAtuais.splice(index, 1);
    atualizarTabelaMetas();
};

window.salvarPEI = async function() {
    const paciente = document.getElementById('peiPaciente').value;
    const dataInicio = document.getElementById('peiDataInicio').value;
    const dataReaval = document.getElementById('peiDataReaval').value;

    if (!paciente || !dataInicio) {
        alert("Preencha o Nome do Paciente e a Data de Início do PEI.");
        return;
    }

    const dadosPEI = {
        paciente,
        dataInicio,
        dataReaval,
        barreiras: Array.from(document.querySelectorAll('.barreiraPei:checked')).map(el => el.value),
        metas: metasAtuais,
        reforçadores: document.getElementById('peiReforçadores').value,
        estrategiasFuga: document.getElementById('peiEstrategiasFuga').value,
        criadoEm: new Date().toISOString()
    };

    try {
        await addDoc(collection(db, "peis_pacientes"), dadosPEI);
        alert(`PEI do paciente ${paciente} salvo no Firebase Firestore!`);
        await carregarPEIsFirestore();
    } catch (e) {
        console.error("Erro ao salvar PEI: ", e);
        alert("Erro ao salvar no banco em nuvem.");
    }
};

async function carregarPEIsFirestore() {
    try {
        const q = query(collection(db, "peis_pacientes"), orderBy("criadoEm", "desc"));
        const querySnapshot = await getDocs(q);
        const peis = [];
        const select = document.getElementById('selectPei');
        const tbody = document.getElementById('tabelaHistoricoPei');

        select.innerHTML = '<option value="">-- Selecione um PEI ativo --</option>';
        tbody.innerHTML = '';

        querySnapshot.forEach((docSnap) => {
            const p = docSnap.data();
            peis.push(p);
            const index = peis.length - 1;

            select.innerHTML += `<option value="${index}">${p.paciente} - Início: ${p.dataInicio}</option>`;
            tbody.innerHTML += `
                <tr class="border-b hover:bg-slate-50">
                    <td class="p-2 border font-medium">${p.dataInicio}</td>
                    <td class="p-2 border font-semibold text-teal-900">${p.paciente}</td>
                    <td class="p-2 border text-xs">${p.metas ? p.metas.length : 0} meta(s)</td>
                    <td class="p-2 border text-xs text-slate-600">${p.dataReaval || 'Não definida'}</td>
                    <td class="p-2 border text-center">
                        <button onclick="carregarPEIPorIndex(${index})" class="bg-teal-700 hover:bg-teal-800 text-white text-xs px-3 py-1 rounded font-medium">Abrir PEI</button>
                    </td>
                </tr>
            `;
        });

        window.peisLocais = peis;
    } catch (e) {
        console.error("Erro ao carregar PEIs: ", e);
    }
}

window.carregarPEIPorIndex = function(index) {
    document.getElementById('selectPei').value = index;
    window.carregarPeiSelecionado();
};

window.carregarPeiSelecionado = function() {
    const index = document.getElementById('selectPei').value;
    if (index === "" || !window.peisLocais) return;

    const dados = window.peisLocais[index];
    if (dados) {
        document.getElementById('peiPaciente').value = dados.paciente;
        document.getElementById('peiDataInicio').value = dados.dataInicio;
        document.getElementById('peiDataReaval').value = dados.dataReaval || '';

        document.querySelectorAll('.barreiraPei').forEach(el => {
            el.checked = dados.barreiras.includes(el.value);
        });

        document.getElementById('peiReforçadores').value = dados.reforçadores || '';
        document.getElementById('peiEstrategiasFuga').value = dados.estrategiasFuga || '';

        metasAtuais = dados.metas || [];
        atualizarTabelaMetas();
    }
};

window.limparFormPei = function() {
    document.getElementById('peiPaciente').value = '';
    document.getElementById('peiDataInicio').value = '';
    document.getElementById('peiDataReaval').value = '';
    document.querySelectorAll('.barreiraPei').forEach(el => el.checked = false);
    document.getElementById('peiReforçadores').value = '';
    document.getElementById('peiEstrategiasFuga').value = '';
    document.getElementById('selectPei').value = '';
    metasAtuais = [];
    atualizarTabelaMetas();
};

window.onload = function() {
    carregarPEIsFirestore();
};