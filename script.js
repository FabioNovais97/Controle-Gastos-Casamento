// 1. Configuração do Supabase
const SUPABASE_URL = 'https://iqhwjxrjtnujnoteqrzu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Gav_IDnyFOzRCOnuJBx7gA_tK19CqW3';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Carrega os dados assim que a página abre
document.addEventListener('DOMContentLoaded', renderizarContratos);

// ADICIONAR NOVO CONTRATO NO BANCO
async function addNovoContrato() {
    const nomeInput = document.getElementById('contratoNome');
    const totalInput = document.getElementById('contratoTotal');

    const nome = nomeInput.value.trim();
    const total = parseFloat(totalInput.value);

    if (!nome || isNaN(total) || total <= 0) {
        alert("Por favor, preencha o nome e um valor válido!");
        return;
    }

    const { error } = await _supabase
        .from('ControleGastos')
        .insert([{ 
            item: nome, 
            valor_total: total, 
            valor_pago: 0 
        }]);

    if (error) {
        console.error("Erro ao salvar contrato:", error);
        alert("Erro ao salvar no banco!");
    } else {
        nomeInput.value = '';
        totalInput.value = '';
        renderizarContratos();
    }
}

// EDITAR VALOR TOTAL DO CONTRATO
async function editarValor(id, valorAtual) {
    const novoValorStr = prompt("Digite o novo valor total do contrato:", valorAtual);
    
    if (novoValorStr !== null && novoValorStr !== "") {
        const novoValor = parseFloat(novoValorStr);

        if (!isNaN(novoValor) && novoValor > 0) {
            const { error } = await _supabase
                .from('ControleGastos')
                .update({ valor_total: novoValor })
                .eq('id', id);

            if (error) {
                alert("Erro ao atualizar valor!");
            } else {
                renderizarContratos(); // Atualiza a lista e os totais
            }
        } else {
            alert("Por favor, digite um valor numérico válido.");
        }
    }
}

// REGISTRAR PAGAMENTO
async function registrarPagamento(id) {
    const inputPgto = document.getElementById(`input-pgto-${id}`);
    const valorPgto = parseFloat(inputPgto.value);

    if (!valorPgto || valorPgto <= 0) return;

    const { data: contrato } = await _supabase
        .from('ControleGastos')
        .select('valor_pago')
        .eq('id', id)
        .single();

    const novoTotalPago = (contrato.valor_pago || 0) + valorPgto;

    const { error } = await _supabase
        .from('ControleGastos')
        .update({ valor_pago: novoTotalPago })
        .eq('id', id);

    if (error) {
        alert("Erro ao registrar pagamento!");
    } else {
        renderizarContratos();
    }
}

// BUSCAR E DESENHAR OS CONTRATOS NA TELA
async function renderizarContratos() {
    const lista = document.getElementById('listaContratos');
    
    let { data: contratos, error } = await _supabase
        .from('ControleGastos')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error("Erro ao buscar gastos:", error);
        return;
    }

    lista.innerHTML = '';
    let acumuladoPago = 0;
    let acumuladoFalta = 0;

    contratos.forEach(c => {
        const faltaPagar = c.valor_total - c.valor_pago;
        const porcentagem = c.valor_total > 0 ? (c.valor_pago / c.valor_total) * 100 : 0;

        acumuladoPago += c.valor_pago;
        acumuladoFalta += faltaPagar;

        lista.innerHTML += `
            <div class="contrato-card">
                <strong style="font-size: 1.1rem;">${c.item}</strong>
                <p style="margin: 5px 0; font-size: 0.9rem;">
                    Total: R$ ${c.valor_total.toLocaleString('pt-BR')} | 
                    Falta: <b style="color: #e74c3c;">R$ ${faltaPagar.toLocaleString('pt-BR')}</b>
                </p>
                
                <div class="progresso-bg" style="background: #eee; height: 10px; border-radius: 5px; overflow: hidden;">
                    <div class="progresso-barra" style="width: ${porcentagem}%; background: #2ecc71; height: 100%;"></div>
                </div>

                <div style="display: flex; gap: 8px; margin-top: 10px; align-items: center;">
                    <input type="number" id="input-pgto-${c.id}" placeholder="Valor mensal" style="flex: 1; padding: 5px;">
                    <button onclick="registrarPagamento(${c.id})" style="padding: 5px 10px; font-size: 0.8rem; background: #2ecc71; color: white; border: none; cursor: pointer;">Abater</button>
                    
                    <button onclick="editarValor(${c.id}, ${c.valor_total})" style="background: transparent; border: none; cursor: pointer; font-size: 1.2rem;">✏️</button>
                    
                    <button onclick="excluirGasto(${c.id})" style="background: transparent; border: none; cursor: pointer; font-size: 1.2rem;">🗑️</button>
                </div>
            </div>
        `;
    });

    document.getElementById('totalGeralPago').innerText = acumuladoPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('totalGeralFalta').innerText = acumuladoFalta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// FUNÇÃO EXCLUIR
async function excluirGasto(id) {
    if (!confirm("Deseja remover esse contrato?")) return;

    const { error } = await _supabase
        .from('ControleGastos')
        .delete()
        .eq('id', id);

    if (!error) renderizarContratos();
}