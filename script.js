const AREA_JOGO = document.getElementById('game-area');
const DISPLAY_PD = document.querySelector('#pd-display span');
const DIV_PALAVRA_ALVO = document.getElementById('target-word');
const INPUT_DIGITACAO = document.getElementById('typing-input');
const BOTAO_RANKING = document.getElementById('ranking-toggle-btn');
const MENU_RANKING = document.getElementById('ranking-menu');
const LISTA_RANKING = document.getElementById('ranking-list');
const BOTAO_FECHAR_RANKING = document.getElementById('close-ranking-btn');
const TELA_FIM_JOGO = document.getElementById('game-over-screen');
const SPAN_PD_FINAL = document.getElementById('final-pd');
const BOTAO_REINICIAR = document.getElementById('restart-btn');

// ELEMENTOS para a interface de nome
const INPUT_NOME_JOGADOR = document.getElementById('player-name-input');
const BOTAO_SALVAR_PONTUACAO = document.getElementById('save-score-btn');
// Elementos de censura (MENSAGEM_CENSURA) e a lista (PALAVRAS_CENSURADAS) foram removidos.
const CONTAINER_ENTRADA_NOME = document.getElementById('name-input-container');


const INTERVALO_QUEDA_MS = 50;
const VELOCIDADE_INICIAL_QUEDA = 2.0; 
const INTERVALO_INICIAL_SPAWN_MS = 1500; 
const DISTANCIA_MAXIMA_QUEDA = 600; 

let contadorPD = 0;
let listaPalavras = [];
let dadosPalavraAtual = null; 
let jogoRodando = false;
let intervaloJogo;
let intervaloSpawn;
let dadosRanking = [];
let velocidadeQuedaAtual = VELOCIDADE_INICIAL_QUEDA;
let intervaloSpawnAtual = INTERVALO_INICIAL_SPAWN_MS;

// --- FUNÇÕES DE LÓGICA DO JOGO ---

async function carregarDicionario() {
    try {
        const resposta = await fetch('dicionario_pt.json'); 
        if (!resposta.ok) throw new Error(`Erro ao carregar dicionário: ${resposta.status}`);
        listaPalavras = await resposta.json(); 
        INPUT_DIGITACAO.placeholder = "Pressione ENTER para começar";
        INPUT_DIGITACAO.disabled = false;
        INPUT_DIGITACAO.focus();

    } catch (erro) {
        INPUT_DIGITACAO.placeholder = "ERRO: Falha ao carregar palavras.";
        INPUT_DIGITACAO.disabled = true;
    }
}

function obterPalavraAleatoria() {
    return listaPalavras[Math.floor(Math.random() * listaPalavras.length)];
}

function aumentarDificuldade() {
    velocidadeQuedaAtual = Math.min(4.5, VELOCIDADE_INICIAL_QUEDA + Math.floor(contadorPD / 5) * 0.4); 
    
    const fatorReducao = Math.floor(contadorPD / 5) * 150;
    intervaloSpawnAtual = Math.max(700, INTERVALO_INICIAL_SPAWN_MS - fatorReducao);
    
    clearInterval(intervaloSpawn);
    intervaloSpawn = setInterval(criarNovaPalavra, intervaloSpawnAtual);
}

function iniciarJogo() {
    if (jogoRodando) return;

    contadorPD = 0;
    DISPLAY_PD.textContent = contadorPD;
    jogoRodando = true;
    velocidadeQuedaAtual = VELOCIDADE_INICIAL_QUEDA;
    intervaloSpawnAtual = INTERVALO_INICIAL_SPAWN_MS;
    TELA_FIM_JOGO.style.display = 'none';
    INPUT_DIGITACAO.disabled = false;
    INPUT_DIGITACAO.value = '';
    INPUT_DIGITACAO.placeholder = "";
    
    CONTAINER_ENTRADA_NOME.classList.remove('hidden'); 
    BOTAO_REINICIAR.classList.add('hidden'); 
    INPUT_NOME_JOGADOR.value = ''; 

    Array.from(AREA_JOGO.querySelectorAll('.falling-word')).forEach(el => el.remove());
    dadosPalavraAtual = null;
    
    clearInterval(intervaloJogo);
    clearInterval(intervaloSpawn); 

    criarNovaPalavra();
    intervaloJogo = setInterval(animarQueda, INTERVALO_QUEDA_MS);
    intervaloSpawn = setInterval(criarNovaPalavra, intervaloSpawnAtual);
    INPUT_DIGITACAO.focus();
}

function criarNovaPalavra() {
    const palavraTexto = obterPalavraAleatoria();
    const divPalavra = document.createElement('div');
    divPalavra.classList.add('falling-word');
    
    palavraTexto.split('').forEach(char => {
        const span = document.createElement('span');
        span.textContent = char;
        divPalavra.appendChild(span);
    });

    const posX = Math.random() * (AREA_JOGO.offsetWidth - 150) + 75;
    divPalavra.style.left = `${posX}px`;
    divPalavra.style.top = '0px'; 
    
    AREA_JOGO.appendChild(divPalavra);

    if (!dadosPalavraAtual) {
        focarPalavra(divPalavra, palavraTexto);
    }
}

function focarPalavra(elemento, texto) {
    if (dadosPalavraAtual) {
        dadosPalavraAtual.elemento.style.zIndex = 1;
    }
    
    dadosPalavraAtual = {
        elemento: elemento,
        texto: texto,
        progresso: 0,
        y: 0 
    };

    elemento.style.zIndex = 5;
    
    DIV_PALAVRA_ALVO.innerHTML = '';
    texto.split('').forEach(char => {
        const span = document.createElement('span');
        span.textContent = char;
        DIV_PALAVRA_ALVO.appendChild(span);
    });
    
    INPUT_DIGITACAO.focus();
}

function animarQueda() {
    const palavrasAtivas = Array.from(AREA_JOGO.querySelectorAll('.falling-word:not(.exploding)'));

    palavrasAtivas.forEach(elemento => {
        let topoAtual = parseFloat(elemento.style.top);
        topoAtual += velocidadeQuedaAtual * (INTERVALO_QUEDA_MS / 100); 
        elemento.style.top = `${topoAtual}px`;

        if (elemento === dadosPalavraAtual?.elemento) {
            dadosPalavraAtual.y = topoAtual;
        }

        if (topoAtual >= DISTANCIA_MAXIMA_QUEDA) {
            if (elemento === dadosPalavraAtual?.elemento) {
                fimDeJogo();
                return;
            }
            elemento.remove();
        }
    });
}

function fimDeJogo() {
    clearInterval(intervaloJogo);
    clearInterval(intervaloSpawn);
    jogoRodando = false;

    Array.from(AREA_JOGO.querySelectorAll('.falling-word')).forEach(el => el.remove());
    dadosPalavraAtual = null;
    DIV_PALAVRA_ALVO.innerHTML = '';

    SPAN_PD_FINAL.textContent = contadorPD;
    INPUT_DIGITACAO.disabled = true;
    
    TELA_FIM_JOGO.style.display = 'flex';
    INPUT_NOME_JOGADOR.focus();
}

// --- FUNÇÕES DE RANKING ---

// Função verificarCensuraLocal removida.

/**
 * Salva o resultado, atualizando o placar do jogador se for um novo recorde.
 * @param {string} nome 
 * @param {number} pontuacao 
 */
function salvarResultado(nome, pontuacao) {
    let dadosRanking = carregarRanking();
    
    // 1. Encontra se o nome já existe
    const indiceExistente = dadosRanking.findIndex(jogador => jogador.nome === nome);

    if (indiceExistente !== -1) {
        // O jogador existe: verifica se a nova pontuação é maior
        if (pontuacao > dadosRanking[indiceExistente].totalPD) {
            dadosRanking[indiceExistente].totalPD = pontuacao;
        }
    } else {
        // O jogador não existe: adiciona nova entrada
        dadosRanking.push({ nome, totalPD: pontuacao });
    }

    // 2. Classifica a lista completa (para que o novo recorde suba no ranking)
    dadosRanking.sort((a, b) => b.totalPD - a.totalPD);
    
    // 3. Limita o ranking aos 10 melhores
    dadosRanking = dadosRanking.slice(0, 10);
    
    // 4. Salva no armazenamento local
    localStorage.setItem('fallingWordsRanking', JSON.stringify(dadosRanking));
}

function carregarRanking() {
    const armazenado = localStorage.getItem('fallingWordsRanking');
    return armazenado ? JSON.parse(armazenado) : [];
}

function mostrarRanking() {
    dadosRanking = carregarRanking();
    LISTA_RANKING.innerHTML = '';
    
    if (dadosRanking.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Nenhuma pontuação salva ainda.';
        LISTA_RANKING.appendChild(li);
        return;
    }
    
    dadosRanking.forEach((jogador, index) => {
        const li = document.createElement('li');
        let prefixo = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        li.textContent = `${prefixo} ${jogador.nome} - ${jogador.totalPD} PD`; 
        LISTA_RANKING.appendChild(li);
    });
}

function processarPontuacao() {
    const nome = INPUT_NOME_JOGADOR.value.trim();

    if (nome === "") {
        // Usa um alert simples para a validação de campo vazio.
        alert("Digite um nome para salvar sua pontuação."); 
        return;
    }
    
    // Toda a lógica de verificação de censura foi removida.

    if (contadorPD > 0) {
        salvarResultado(nome, contadorPD);
    }
    
    mostrarRanking(); 
    MENU_RANKING.classList.add('visible'); 
    
    CONTAINER_ENTRADA_NOME.classList.add('hidden'); 
    BOTAO_REINICIAR.classList.remove('hidden'); 
    INPUT_DIGITACAO.focus();
}

// --- Eventos ---

BOTAO_SALVAR_PONTUACAO.addEventListener('click', processarPontuacao);

INPUT_NOME_JOGADOR.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        processarPontuacao();
    }
});

INPUT_DIGITACAO.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !jogoRodando) {
        iniciarJogo();
        e.preventDefault();
    }
});

INPUT_DIGITACAO.addEventListener('input', (e) => {
    
    if (!dadosPalavraAtual || !jogoRodando) return;

    const entrada = e.target.value.toLowerCase();
    const textoAlvo = dadosPalavraAtual.texto.toLowerCase();
    const spansAlvo = DIV_PALAVRA_ALVO.children;
    const spansCaindo = dadosPalavraAtual.elemento.children;

    let contagemCorreta = 0;
    
    for (let i = 0; i < textoAlvo.length; i++) {
        const estaCorreta = i < entrada.length && entrada[i] === textoAlvo[i];

        if (i < entrada.length) {
            if (estaCorreta) {
                spansAlvo[i].classList.add('correct');
                spansCaindo[i].classList.add('correct'); 
                contagemCorreta++;
            } else {
                spansAlvo[i].classList.remove('correct');
                spansCaindo[i].classList.remove('correct');
                spansAlvo[i].classList.add('incorrect');
                
                dadosPalavraAtual.elemento.style.animation = 'shake 0.1s ease-in-out';
                setTimeout(() => dadosPalavraAtual.elemento.style.animation = '', 100); 
                e.target.value = entrada.slice(0, i); 
                return;
            }
        } else {
            spansAlvo[i].classList.remove('correct', 'incorrect');
            spansCaindo[i].classList.remove('correct');
        }
    }
    
    dadosPalavraAtual.elemento.style.opacity = Math.min(1, 0.25 + (0.75 * (contagemCorreta / textoAlvo.length)));

    if (contagemCorreta === textoAlvo.length) {
        contadorPD++;
        DISPLAY_PD.textContent = contadorPD;
        aumentarDificuldade();

        const elementoConcluido = dadosPalavraAtual.elemento;
        elementoConcluido.classList.add('exploding');
        
        elementoConcluido.addEventListener('animationend', () => {
            elementoConcluido.remove();
        });
        
        INPUT_DIGITACAO.value = '';
        dadosPalavraAtual = null;
        DIV_PALAVRA_ALVO.innerHTML = '';
        
        const palavrasNaoDigitadas = Array.from(AREA_JOGO.querySelectorAll('.falling-word:not(.exploding)'))
            .sort((a, b) => parseFloat(b.style.top) - parseFloat(a.style.top)); 

        if (palavrasNaoDigitadas.length > 0) {
            const textoLimpo = palavrasNaoDigitadas[0].textContent.replace(/\s/g, '');
            focarPalavra(palavrasNaoDigitadas[0], textoLimpo);
        } else {
            criarNovaPalavra();
        }
    }
});


// --- Eventos de Ranking e Foco ---
BOTAO_RANKING.addEventListener('click', () => {
    mostrarRanking();
    MENU_RANKING.classList.toggle('visible');
});

BOTAO_FECHAR_RANKING.addEventListener('click', () => {
    MENU_RANKING.classList.remove('visible');
    INPUT_DIGITACAO.focus(); 
});

BOTAO_REINICIAR.addEventListener('click', () => {
    TELA_FIM_JOGO.style.display = 'none';
    iniciarJogo();
    INPUT_DIGITACAO.focus(); 
});

function configuracaoInicial() {
    carregarDicionario();
    mostrarRanking(); 
    TELA_FIM_JOGO.style.display = 'none';
    MENU_RANKING.classList.remove('visible');
    CONTAINER_ENTRADA_NOME.classList.remove('hidden');
    BOTAO_REINICIAR.classList.add('hidden');
}

configuracaoInicial();
