const botoes = document.querySelectorAll('.add-item')

function lerSacola() {
    const dados = localStorage.getItem('brasaCart')
    if (dados) {
        return JSON.parse(dados)
    }
    return []
}

function salvarSacola(sacola) {
    localStorage.setItem('brasaCart', JSON.stringify(sacola))
}

function adicionarItem(evento) {
    const botao = evento.currentTarget
    const sacola = lerSacola()
    sacola.push({
        name: botao.dataset.name,
        price: Number(botao.dataset.price)
    })
    salvarSacola(sacola)
    botao.textContent = 'Adicionado ✓'
}

for (let i = 0; i < botoes.length; i++) {
    botoes[i].addEventListener('click', adicionarItem)
}

const registro = document.querySelector('#registro')
const login = document.querySelector('#login-form')
const form = registro || login

async function validarSenha(senha, salt) {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', encoder.encode(senha), 'PBKDF2', false, ['deriveBits'])
    const bits = await crypto.subtle.deriveBits({
        name: 'PBKDF2', salt: encoder.encode(salt), iterations: 210000, hash: 'SHA-256'
    }, key, 256)
    return Array.from(new Uint8Array(bits)).join('-')
}

if (form) {
    form.addEventListener('submit', async function (event) {
        event.preventDefault()
        const id = 'brasaConta:' + form.querySelector('#email').value.trim().toLowerCase()
        const senha = form.querySelector('#senha').value
        const mensagem = form.querySelector('#login-message')
        const conta = JSON.parse(localStorage.getItem(id))
        if (registro) {
            if (conta) {
                mensagem.textContent = 'Este e-mail já tem cadastro.'
                return
            }
            const salt = crypto.randomUUID()
            const hash = await validarSenha(senha, salt)
            localStorage.setItem(id, JSON.stringify({nome: form.querySelector('#nome').value, salt, hash}))
            window.location.href = './login.html'
        } else if (conta && conta.hash === await validarSenha(senha, conta.salt)) {
            sessionStorage.setItem('brasaNome', conta.nome)
            window.location.href = './pagamento.html'
        } else {
            mensagem.textContent = 'Confira o e-mail e a senha.'
        }
    })
}
if (login) {
    document.querySelector('#guest').onclick = function () {
        sessionStorage.removeItem('brasaNome')
        window.location.href = './pagamento.html'
    }
}
const listaItens = document.querySelector('#cart-items')
if (listaItens) {
    const sacola = lerSacola()
    const opcoesEntrega = document.querySelectorAll('input[name="entrega"]')
    document.querySelector('#nome').value = sessionStorage.getItem('brasaNome') || ''

    function formatarPreco(value) {
        return 'R$ ' + value.toFixed(2).replace('.', ',')
    }

    function atualizarSacola() {
        let subtotal = 0
        listaItens.innerHTML = ''

        for (let i = 0; i < sacola.length; i++) {
            subtotal += sacola[i].price
            const linha = document.createElement('div')
            linha.className = 'cart-row'
            linha.textContent = sacola[i].name + ' · ' + formatarPreco(sacola[i].price)
            const botaoRemover = document.createElement('button')
            botaoRemover.textContent = 'Remover'
            botaoRemover.addEventListener('click', function () {
                sacola.splice(i, 1)
                salvarSacola(sacola)
                atualizarSacola()
            })
            linha.appendChild(botaoRemover)
            listaItens.appendChild(linha)
        }

        if (sacola.length === 0) listaItens.textContent = 'Sua sacola está vazia. Volte ao cardápio para escolher.'

        let taxaEntrega = 0
        if (opcoesEntrega[0].checked) {
            taxaEntrega = 6
        }
        document.querySelector('#item-count').textContent = sacola.length + ' itens'
        document.querySelector('#subtotal').textContent = formatarPreco(subtotal)
        document.querySelector('#delivery').textContent = formatarPreco(taxaEntrega)
        document.querySelector('#grand-total').textContent = formatarPreco(subtotal + taxaEntrega)
        document.querySelector('#address-fields').style.display = taxaEntrega > 0 ? 'block' : 'none'
    }

    for (let i = 0; i < opcoesEntrega.length; i++) {
        opcoesEntrega[i].addEventListener('change', atualizarSacola)
    }
    document.querySelector('#checkout-form').addEventListener('submit', function (event) {
        event.preventDefault()
        const mensagem = document.querySelector('#checkout-message')
        if (sacola.length === 0) {
            mensagem.textContent = 'Escolha um item no cardápio antes de confirmar.'
        } else {
            mensagem.textContent = 'Total do pedido: ' + document.querySelector('#grand-total').textContent
        }
    })
    atualizarSacola()
}