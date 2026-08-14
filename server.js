require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

// Em ambiente local, também permite abrir o index.html pelo próprio Express.
app.use(express.static(path.join(__dirname)));

// Página principal do cardápio.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// IMPORTANTE: nunca deixe o Access Token exposto em um repositório público (GitHub, etc).
// Coloque o valor real no arquivo .env (que fica FORA do controle de versão) na chave MP_ACCESS_TOKEN.
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
    console.warn('[AVISO] MP_ACCESS_TOKEN não definido. Crie um arquivo .env com MP_ACCESS_TOKEN=seu_token_aqui');
}

// Cria uma cobrança Pix real na sua conta Mercado Pago, com o valor do pedido do carrinho
app.post('/criar-pix', async (req, res) => {
    try {
        const { total, nomeCliente, cpf } = req.body;

        const valor = Number(total);
        if (!valor || isNaN(valor) || valor <= 0) {
            return res.status(400).json({ error: 'Valor do pedido inválido.' });
        }

        const payer = {
            email: 'cliente@hamburgueriaecomedoria.com.br',
            first_name: (nomeCliente || 'Cliente').split(' ')[0],
            last_name: (nomeCliente || '').split(' ').slice(1).join(' ') || 'Delivery'
        };

        // O Mercado Pago normalmente exige CPF do pagador para liberar o Pix.
        // Se o front-end enviar o CPF do cliente, ele é incluído aqui.
        if (cpf) {
            payer.identification = { type: 'CPF', number: cpf.replace(/\D/g, '') };
        }

        const response = await fetch('https://api.mercadopago.com/v1/payments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': `${Date.now()}-${Math.random().toString(36).slice(2)}`
            },
            body: JSON.stringify({
                transaction_amount: Number(valor.toFixed(2)),
                description: 'Pedido - Hamburgueria e Comedoria',
                payment_method_id: 'pix',
                payer
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Erro Mercado Pago:', data);
            return res.status(response.status).json({ error: data.message || 'Erro ao gerar o Pix.' });
        }

        res.json({
            paymentId: data.id,
            status: data.status,
            copiaECola: data.point_of_interaction.transaction_data.qr_code,
            qrCodeBase64: data.point_of_interaction.transaction_data.qr_code_base64
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao gerar o Pix' });
    }
});

// Consulta se um pagamento Pix já foi confirmado (útil para liberar o pedido automaticamente)
app.get('/status-pix/:id', async (req, res) => {
    try {
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${req.params.id}`, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        const data = await response.json();
        res.json({ status: data.status });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao consultar status do Pix' });
    }
});

// Exporta o app para a Vercel (api/index.js) e mantém o modo local com `npm start`.
module.exports = app;

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
}
