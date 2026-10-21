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

window.calcularIdadeExata = function() {
    const dataNascVal = document.getElementById('avalDataNasc').value;
    const campoIdade = document.getElementById('avalIdade');
    if (!dataNascVal) { campoIdade.value = ''; return; }

    const dataNasc = new Date(dataNascVal);
    const hoje = new Date();
    let anos = hoje.getFullYear() - dataNasc.getFullYear();
    let meses = hoje.getMonth() - dataNasc.getMonth();

    if (meses < 0 || (meses === 0 && hoje.getDate() < dataNasc.getDate())) {
        anos--;
        meses += 12;
    }

    campoIdade.value = anos > 0 ? `${anos} anos${meses > 0 ? ' e ' + meses + ' meses' : ''}` : `${meses} meses`;
};

window.salvarAvaliacao = async function() {
    const paciente = document.getElementById('avalPaciente').value;
    const dataNasc = document.getElementById('avalDataNasc').value;
    const idade = document.getElementById('avalIdade').value;
    const data = document.getElementById('avalData').value;
    const responsaveis = document.getElementById('avalResponsaveis').value;

    if (!paciente || !data) {
        alert('Preencha o Nome do Paciente e a Data da Avaliação.');
        return;
    }

    const dadosAvaliacao = {
        paciente,
        dataNasc,
        idade,
        data,
        responsaveis,
        comunicacao: Array.from(document.querySelectorAll('.chkComun:checked')).map(el => el.value),
        socializacao: Array.from(document.querySelectorAll('.chkSoc:checked')).map(el => el.value),
        sensorial: Array.from(document.querySelectorAll('.chkSens:checked')).map(el => el.value),
        entrada: document.querySelector('input[name="radEntrada"]:checked')?.value || 'Não avaliado',
        limites: document.querySelector('input[name="radLimites"]:checked')?.value || 'Não avaliado',
        estrategias: document.getElementById('avalEstrategias').value,
        impressao: document.getElementById('avalImpressao').value,
        criadoEm: new Date().toISOString()
    };

    try {
        await addDoc(collection(db, "avaliacoes_iniciais"), dadosAvaliacao);
        alert(`Avaliação de ${paciente} salva no Firebase Firestore!`);
        await carregarAvaliacoesFirestore();
    } catch (e) {
        console.error("Erro ao salvar avaliação: ", e);
        alert("Erro ao salvar no banco em nuvem.");
    }
};

async function carregarAvaliacoesFirestore() {
    try {
        const q = query(collection(db, "avaliacoes_iniciais"), orderBy("criadoEm", "desc"));
        const querySnapshot = await getDocs(q);
        const avaliacoes = [];
        const select = document.getElementById('selectAvaliacao');
        const tbody = document.getElementById('tabelaHistoricoAvaliacoes');

        select.innerHTML = '<option value="">-- Selecione um paciente avaliado --</option>';
        tbody.innerHTML = '';

        querySnapshot.forEach((docSnap) => {
            const a = docSnap.data();
            avaliacoes.push(a);
            const index = avaliacoes.length - 1;

            select.innerHTML += `<option value="${index}">${a.paciente} - ${a.data} (${a.idade || 'N/I'})</option>`;
            tbody.innerHTML += `
                <tr class="border-b hover:bg-slate-50">
                    <td class="p-2 border font-medium">${a.data}</td>
                    <td class="p-2 border font-semibold text-teal-900">${a.paciente}</td>
                    <td class="p-2 border">${a.idade || '-'}</td>
                    <td class="p-2 border text-xs text-slate-600">${a.entrada}</td>
                    <td class="p-2 border text-center">
                        <button onclick="carregarPorIndex(${index})" class="bg-teal-700 hover:bg-teal-800 text-white text-xs px-3 py-1 rounded font-medium">Abrir Registro</button>
                    </td>
                </tr>
            `;
        });

        window.avaliacoesLocais = avaliacoes;
    } catch (e) {
        console.error("Erro ao carregar avaliações: ", e);
    }
}

window.carregarPorIndex = function(index) {
    document.getElementById('selectAvaliacao').value = index;
    window.carregarAvaliacaoSelecionada();
};

window.carregarAvaliacaoSelecionada = function() {
    const index = document.getElementById('selectAvaliacao').value;
    if (index === "" || !window.avaliacoesLocais) return;

    const dados = window.avaliacoesLocais[index];
    if (dados) {
        document.getElementById('avalPaciente').value = dados.paciente;
        document.getElementById('avalDataNasc').value = dados.dataNasc || '';
        document.getElementById('avalIdade').value = dados.idade || '';
        document.getElementById('avalData').value = dados.data;
        document.getElementById('avalResponsaveis').value = dados.responsaveis || '';

        document.querySelectorAll('.chkComun').forEach(el => el.checked = dados.comunicacao.includes(el.value));
        document.querySelectorAll('.chkSoc').forEach(el => el.checked = dados.socializacao.includes(el.value));
        document.querySelectorAll('.chkSens').forEach(el => el.checked = dados.sensorial.includes(el.value));

        document.querySelectorAll('input[name="radEntrada"]').forEach(el => el.checked = (el.value === dados.entrada));
        document.querySelectorAll('input[name="radLimites"]').forEach(el => el.checked = (el.value === dados.limites));

        document.getElementById('avalEstrategias').value = dados.estrategias || '';
        document.getElementById('avalImpressao').value = dados.impressao || '';
    }
};

window.limparFormAvaliacao = function() {
    document.getElementById('avalPaciente').value = '';
    document.getElementById('avalDataNasc').value = '';
    document.getElementById('avalIdade').value = '';
    document.getElementById('avalData').value = '';
    document.getElementById('avalResponsaveis').value = '';
    document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(el => el.checked = false);
    document.getElementById('avalEstrategias').value = '';
    document.getElementById('avalImpressao').value = '';
    document.getElementById('selectAvaliacao').value = '';
};

window.onload = function() {
    carregarAvaliacoesFirestore();
};