/**
 * Jokenpô — Script principal
 *
 * Responsabilidades:
 * - Controla a lógica do jogo Jokenpô (rodadas, decisão de vencedor, atualização de placar)
 * - Gerencia animações das mãos e das bolhas de escolha
 * - Executa feedbacks visuais e sonoros (sons de vitória/derrota/empate, músicas e efeitos de suspense)
 * - Trata estados especiais (suspense em 9x9, declaração de campeão em 10 vitórias)
 * - Fornece funções utilitárias para reset, atualização de UI e comentários de placar
 *
 * Desenvolvedor:
 * - Francisco Alexandre Calixto
 *
 * Versão:
 * - 1.0
 *
 * Data:
 * - 23/12/2025
 */

 const choices = ['rock','paper','scissors'];
 const emoji = { rock: '✊', paper: '✋', scissors: '✌️' };
 
 const leftHand = document.getElementById('handLeft');
 const rightHand = document.getElementById('handRight');
 const chantEl = document.getElementById('chant');
 const leftChoiceEl = document.getElementById('leftChoice');
 const rightChoiceEl = document.getElementById('rightChoice');
 const btnRock = document.getElementById('btn-rock');
 const btnPaper = document.getElementById('btn-paper');
 const btnScissors = document.getElementById('btn-scissors');
 const resetBtn = document.getElementById('reset-btn');
 const userScoreEl = document.getElementById('user-score');
 const cpuScoreEl = document.getElementById('cpu-score');
 const gameResultEl = document.getElementById('gameResult');
 const backdrop = document.getElementById('backdrop');
 
 const jokenpoVoice = document.getElementById('jokenpoVoice');
 const jokenpoHands = document.getElementById('jokenpoHands');
 const bgMusic = document.getElementById('bgMusic');
 const musicSelect = document.getElementById('musicSelect');
 const toggleMusicBtn = document.getElementById('toggleMusic');
 
 const audioWin = document.getElementById('audioWin');
 const audioFail = document.getElementById('audioFail');
 const audioDraw = document.getElementById('audioDraw');
 const audioEpicWin = document.getElementById('audioEpicWin');
 const audioGameOver = document.getElementById('audioGameOver');
 const audioSuspenseUser = document.getElementById('audioSuspenseUser');
 const audioSuspenseCPU = document.getElementById('audioSuspenseCPU');
 const audioSuspense9x9 = document.getElementById('audioSuspense9x9');
 
 // seleção segura do elemento (tenta id e depois classe)
const getCharactersImg = () => document.getElementById('charactersImg') || document.querySelector('.duel-img');

let charactersImg = getCharactersImg();
let fadeTimeout = null;
let pendingLoadHandler = null;

// re-obtem o elemento se ainda não existir (útil se o script rodar antes do DOM)
function ensureImg() {
  if (!charactersImg) charactersImg = getCharactersImg();
  return !!charactersImg;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// troca simples
function setSceneImage(src) {
  if (!ensureImg()) return;
  charactersImg.src = src;
}

// troca com fade — espera o load antes de remover a classe
function setSceneImageWithFade(src, duration = 180) {
  if (!ensureImg()) return;

  // limpa timeouts/handlers anteriores
  if (fadeTimeout) {
    clearTimeout(fadeTimeout);
    fadeTimeout = null;
  }
  if (pendingLoadHandler) {
    charactersImg.removeEventListener('load', pendingLoadHandler);
    pendingLoadHandler = null;
  }

  // inicia fade-out
  charactersImg.classList.add('fade-out');

  // quando a nova imagem carregar, removemos o fade
  pendingLoadHandler = () => {
    // pequena espera para respeitar a duração da transição
    fadeTimeout = setTimeout(() => {
      charactersImg.classList.remove('fade-out');
      pendingLoadHandler = null;
      fadeTimeout = null;
    }, duration);
  };
  charactersImg.addEventListener('load', pendingLoadHandler);

  // fallback para erros de carregamento
  charactersImg.onerror = () => {
    console.error('Erro ao carregar imagem:', src);
    // remove listener e fade para não ficar invisível
    if (pendingLoadHandler) {
      charactersImg.removeEventListener('load', pendingLoadHandler);
      pendingLoadHandler = null;
    }
    charactersImg.classList.remove('fade-out');
    // opcional: apontar para um fallback local válido
    // charactersImg.src = 'assets/images/duel-fallback.png';
  };

  // finalmente, trocamos o src (dispara o evento load quando terminar)
  charactersImg.src = src;
}

 // variável que guarda qual áudio está ativo
 let chantAudio = jokenpoVoice; // padrão inicial
 let audioMode = 'voice';
 
 // Botão de alternância
 const toggleBtn = document.getElementById('toggle-audio');
 if (toggleBtn) {
   toggleBtn.addEventListener('click', () => {
     if (audioMode === 'voice') {
       audioMode = 'hands';
       chantAudio = jokenpoHands;
       toggleBtn.textContent = '✊';
     } else {
       audioMode = 'voice';
       chantAudio = jokenpoVoice;
       toggleBtn.textContent = '🔊';
     }
   });
 }
 
 let musicOn = false; // começa desligada
 let userScore = 0;
 let cpuScore = 0;
 let busy = false;
 
 // Música inicial
 if (musicSelect && bgMusic) {
   bgMusic.src = musicSelect.value;
   bgMusic.volume = 0.4;
   try { bgMusic.play(); } catch (e) { /* autoplay bloqueado */ }
 }
 
 let musicStarted = false;
 function startMusicOnInteraction() {
   if (!musicStarted && musicOn && musicSelect && bgMusic) {
     bgMusic.src = musicSelect.value;
     const p = bgMusic.play();
     if (p && p.catch) p.catch(() => {});
     musicStarted = true;
   }
 }
 window.addEventListener('mousemove', startMusicOnInteraction, { once: true });
 window.addEventListener('click', startMusicOnInteraction, { once: true });
 
 if (musicSelect) {
   musicSelect.addEventListener('change', () => {
     const newSrc = musicSelect.value;
     const wasPlaying = bgMusic && !bgMusic.paused;
     if (bgMusic) bgMusic.src = newSrc;
     if (musicOn && wasPlaying) {
       const p = bgMusic.play();
       if (p && p.catch) p.catch(() => {});
     }
   });
 }
 
 if (toggleMusicBtn) {
   toggleMusicBtn.addEventListener('click', () => {
     if (bgMusic) {
       if (musicOn) {
         bgMusic.pause();
         toggleMusicBtn.textContent = '🎶';
         toggleMusicBtn.classList.add('off');
       } else {
         const p = bgMusic.play();
         if (p && p.catch) p.catch(() => {});
         toggleMusicBtn.textContent = '🎶';
         toggleMusicBtn.classList.remove('off');
       }
     }
     musicOn = !musicOn;
   });
 }
 
 // caminhos das imagens (bonecos jogando)
const sceneImages = {
  initial: 'assets/images/scene-initial.png',
  win: [ 
    'assets/images/scene-win-1.png',
    'assets/images/scene-win-2.png',
    'assets/images/scene-win-3.png'
  ],
  draw: [
    'assets/images/scene-draw-1.png',
    'assets/images/scene-draw-2.png',
    'assets/images/scene-draw-3.png'
  ],
  lose: [ // jogador perde (computador vence na cena)
    'assets/images/scene-lose-1.png',
    'assets/images/scene-lose-2.png',
    'assets/images/scene-lose-3.png'
  ]
};

// pré-carrega imagens
function preloadSceneImages() {
  const all = [sceneImages.initial, ...sceneImages.win, ...sceneImages.draw, ...sceneImages.lose];
  all.forEach(src => {
    const i = new Image();
    i.src = src;
  });
}
preloadSceneImages();

 // Lógica do jogo
 function decide(u, c) {
   if (u === c) return 'draw';
   if ((u === 'rock' && c === 'scissors') ||
       (u === 'paper' && c === 'rock') ||
       (u === 'scissors' && c === 'paper')) return 'user';
   return 'cpu';
 }
 function cpuChoice() { return choices[Math.floor(Math.random() * choices.length)]; }
 
 function updateScores() {
   if (userScoreEl) userScoreEl.textContent = userScore;
   if (cpuScoreEl) cpuScoreEl.textContent = cpuScore;
 }
 
 function pulseScore(winner) {
   const el = winner === 'user' ? userScoreEl : cpuScoreEl;
   if (!el) return;
   el.classList.add('pulse');
   el.addEventListener('animationend', () => {
     el.classList.remove('pulse');
   }, { once: true });
 }
 
 // Reset visual
 function resetVisual() {
   if (leftChoiceEl) leftChoiceEl.textContent = '?';
   if (rightChoiceEl) rightChoiceEl.textContent = '?';
   if (leftChoiceEl) leftChoiceEl.className = 'choice-bubble';
   if (rightChoiceEl) rightChoiceEl.className = 'choice-bubble';
   if (leftHand) leftHand.className = 'hand hand-left closed';
   if (rightHand) rightHand.className = 'hand hand-right closed';
   if (chantEl) {
     chantEl.classList.remove('win', 'lose', 'draw', 'shake');
     chantEl.textContent = 'Escolha sua jogada!';
   }
   if (gameResultEl) gameResultEl.textContent = 'Faça sua escolha';
 }
 
 // Mensagens rotativas no chant
 function updateChant(result) {
   if (!chantEl) return;
   chantEl.classList.remove('win', 'lose', 'draw', 'shake');
 
   switch (result) {
     case 'win': {
       const winMessages = [
         '🎉 Você venceu! Está mandando muito bem… consegue repetir a façanha?',
         '🏆 Parabéns, campeão! Mas será que mantém essa sequência?',
         '💪 Você é bom mesmo! Consegue embalar uma sequência?',
         '⚔️ Você é sortudo viu! Devia jogar na loteria.',
         '🔥 Você arrasou! Mas será que consegue vencer de novo?'
       ];
       chantEl.innerHTML = winMessages[Math.floor(Math.random() * winMessages.length)];
       chantEl.classList.add('win');
       break;
     }
     case 'lose': {
       const loseMessages = [
         '💥 Você perdeu! Mas não desista, tente outra jogada.',
         '😅 Derrota dura… será que consegue virar o jogo?',
         '👊 Caiu agora, mas pode levantar mais forte!',
         '😞 O computador venceu desta vez… revanche?',
         '⚡ Não foi dessa vez, mas a próxima pode ser sua!'
       ];
       chantEl.innerHTML = loseMessages[Math.floor(Math.random() * loseMessages.length)];
       chantEl.classList.add('lose');
       break;
     }
     case 'draw': {
       const drawMessages = [
         '⚖️ Empate!',
         '😎 Igualdade total… bora desempatar?',
         '⚔️ Ninguém venceu… prepare-se para a próxima!',
         '🌀 Empate! A disputa continua acirrada.',
         '🎲 Empatou! Hora de tentar novamente.'
       ];
       chantEl.innerHTML = drawMessages[Math.floor(Math.random() * drawMessages.length)];
       chantEl.classList.add('draw');
       break;
     }
     default:
       chantEl.innerHTML = '(✊ / ✋ / ✌️) Escolha sua jogada!';
   }
 }
 
 // --- Loop de suspense em 9x9 ---
 let isSuspenseLooping = false;
 let bgMusicWasPlayingBeforeSuspense = false;
 
 function startSuspenseLoop() {
   if (!audioSuspense9x9) return;
   if (isSuspenseLooping) return;
 
   if (bgMusic && !bgMusic.paused) {
     bgMusic.pause();
     bgMusicWasPlayingBeforeSuspense = true;
   } else {
     bgMusicWasPlayingBeforeSuspense = false;
   }
 
   audioSuspense9x9.loop = true;
   audioSuspense9x9.currentTime = 0;
   const p = audioSuspense9x9.play();
   if (p && p.catch) p.catch(() => {});
   isSuspenseLooping = true;
 }
 
 function stopSuspenseLoop(shouldResumeBgMusic = true) {
   if (!audioSuspense9x9 || !isSuspenseLooping) return;
   audioSuspense9x9.loop = false;
   audioSuspense9x9.pause();
   audioSuspense9x9.currentTime = 0;
   isSuspenseLooping = false;
 
   if (shouldResumeBgMusic && bgMusic && bgMusicWasPlayingBeforeSuspense) {
     const p = bgMusic.play();
     if (p && p.catch) p.catch(() => {});
   }
 }
 
 function checkSuspenseLoopState() {
   if (userScore === 9 && cpuScore === 9) {
     startSuspenseLoop();
   } else {
     if (isSuspenseLooping) stopSuspenseLoop();
   }
 }
 
 // Rodada
 function playRound(userChoice) {
   if (busy) return;
   busy = true;
   const cpu = cpuChoice();
 
   if (chantAudio) {
     chantAudio.currentTime = 0;
     chantAudio.play();
   }
 
   // Se o loop de suspense estiver ativo e sairmos do 9x9, pará-lo imediatamente
   if (isSuspenseLooping && !(userScore === 9 && cpuScore === 9)) {
     stopSuspenseLoop();
   }
 
   // Limpa estados anteriores
   if (leftChoiceEl) leftChoiceEl.classList.remove('win', 'lose', 'shake');
   if (rightChoiceEl) rightChoiceEl.classList.remove('win', 'lose', 'shake');
 
   // Mãos: fechar e sacudir
   if (leftHand) leftHand.classList.remove('open');
   if (rightHand) rightHand.classList.remove('open');
   if (leftHand) leftHand.classList.add('shake');
   if (rightHand) rightHand.classList.add('shake');
 
   // Bolhas: “...” e sacudir
   if (leftChoiceEl) leftChoiceEl.textContent = '...';
   if (rightChoiceEl) rightChoiceEl.textContent = '...';
   if (leftChoiceEl) leftChoiceEl.classList.add('shake');
   if (rightChoiceEl) rightChoiceEl.classList.add('shake');
 
   // Frase com emoji aleatório
   if (chantEl) {
     chantEl.classList.remove('win', 'lose', 'draw');
     const shakeEmojis = ['👊🤝', '✊✊', '✊', '✊✋', '👏👏'];
     const randomEmoji = shakeEmojis[Math.floor(Math.random() * shakeEmojis.length)];
     chantEl.textContent = `${randomEmoji} Sacudindo as mãos...`;
     chantEl.classList.add('shake');
   }
 
   if (gameResultEl) gameResultEl.textContent = 'Preparando...';
 
   setTimeout(() => {
     // Parar sacudir
     if (leftHand) leftHand.classList.remove('shake');
     if (rightHand) rightHand.classList.remove('shake');
     if (leftChoiceEl) leftChoiceEl.classList.remove('shake');
     if (rightChoiceEl) rightChoiceEl.classList.remove('shake');
     if (chantEl) chantEl.classList.remove('shake');
 
     // Abrir mãos
     if (leftHand) leftHand.classList.add('open');
     if (rightHand) rightHand.classList.add('open');
 
     // Revelar escolhas
     if (leftChoiceEl) leftChoiceEl.textContent = emoji[userChoice];
     if (rightChoiceEl) rightChoiceEl.textContent = emoji[cpu];
 
     // Decidir e aplicar efeitos
     const winner = decide(userChoice, cpu);
 
     if (winner === 'draw') setSceneForResult('draw');
      else if (winner === 'user') setSceneForResult('win');
      else setSceneForResult('lose');

     if (gameResultEl) gameResultEl.classList.remove('win', 'lose', 'draw');
 
     if (winner === 'draw') {
       if (gameResultEl) gameResultEl.textContent = 'Empate!';
       updateChant('draw');
       if (audioDraw) { audioDraw.currentTime = 0; audioDraw.play(); }
     } else if (winner === 'user') {
       if (gameResultEl) gameResultEl.textContent = 'Você ganhou!';
       updateChant('win');
       userScore++;
       pulseScore('user');
       if (leftChoiceEl) leftChoiceEl.classList.add('win');
       if (rightChoiceEl) rightChoiceEl.classList.add('lose');
       if (audioWin) { audioWin.currentTime = 0; audioWin.play(); }
     } else {
       if (gameResultEl) gameResultEl.textContent = 'Você perdeu!';
       updateChant('lose');
       cpuScore++;
       pulseScore('cpu');
       if (rightChoiceEl) rightChoiceEl.classList.add('win');
       if (leftChoiceEl) leftChoiceEl.classList.add('lose');
       if (audioFail) { audioFail.currentTime = 0; audioFail.play(); }
     }
 
     // Escolhe cena conforme resultado: 'win' | 'draw' | 'lose'
     function setSceneForResult(result) {
      // result: 'win' | 'draw' | 'lose'
      if (!charactersImg) return;
      if (result === 'draw') {
        const src = pickRandom(sceneImages.draw);
        setSceneImageWithFade(src);
        return;
      }
      if (result === 'win') {
        const src = pickRandom(sceneImages.win);
        setSceneImageWithFade(src);
        return;
      }
      if (result === 'lose') {
        const src = pickRandom(sceneImages.lose);
        setSceneImageWithFade(src);
        return;
      }
    }
    
     updateScores();
     updateScoreHighlight();
 
     // Suspense especial
     if (userScore === 9 && cpuScore === 9) {
       // Empate 9x9: tocar suspense extra em loop e frase impactante
       if (audioSuspense9x9) {
         startSuspenseLoop();
       } else {
         if (bgMusic) { bgMusic.pause(); bgMusic.currentTime = 0; }
       }
 
       const frasesImpactantes = [
         "⚡ Tudo ou nada: quem vencer agora será o grande campeão!",
         "⚡ A próxima jogada decide tudo... o campeão está prestes a surgir!",
         "⚡ Suspense total! O próximo ponto coroa o vencedor!",
         "⚡ É o momento da verdade: quem ganhar agora leva o título!",
         "⚡ Última batalha! Só mais uma vitória e o campeão será revelado!",
         "⚡ O próximo a vencer escreve seu nome na glória!"
       ];
       const frase = frasesImpactantes[Math.floor(Math.random() * frasesImpactantes.length)];
       if (gameResultEl) gameResultEl.textContent += " " + frase;
     } else if (userScore === 9 && cpuScore < 9) {
       if (audioSuspenseUser) { audioSuspenseUser.currentTime = 0; audioSuspenseUser.play(); }
       if (gameResultEl) gameResultEl.textContent += ' ⚡ Falta só 1 vitória pra fechar!';
     } else if (cpuScore === 9 && userScore < 9) {
       if (audioSuspenseCPU) { audioSuspenseCPU.currentTime = 0; audioSuspenseCPU.play(); }
       if (gameResultEl) gameResultEl.textContent += ' ⚡ E só falta 1 vitória pra ele fechar!';
     }
 
     // Efeitos especiais de placar (campeão)
     if (userScore === 10 && userScore > cpuScore) {
       if (audioSuspenseUser && !audioSuspenseUser.paused) { audioSuspenseUser.pause(); audioSuspenseUser.currentTime = 0; }
       if (audioSuspenseCPU && !audioSuspenseCPU.paused) { audioSuspenseCPU.pause(); audioSuspenseCPU.currentTime = 0; }
       if (audioSuspense9x9 && isSuspenseLooping) stopSuspenseLoop(false);
 
       if (audioEpicWin) { audioEpicWin.currentTime = 0; audioEpicWin.play(); }
       if (gameResultEl) gameResultEl.textContent += ' 🏆 Você venceu a partida!';
     }
 
     if (cpuScore === 10 && cpuScore > userScore) {
       if (audioSuspenseUser && !audioSuspenseUser.paused) { audioSuspenseUser.pause(); audioSuspenseUser.currentTime = 0; }
       if (audioSuspenseCPU && !audioSuspenseCPU.paused) { audioSuspenseCPU.pause(); audioSuspenseCPU.currentTime = 0; }
       if (audioSuspense9x9 && isSuspenseLooping) stopSuspenseLoop(false);
 
       if (audioGameOver) { audioGameOver.currentTime = 0; audioGameOver.play(); }
       if (gameResultEl) gameResultEl.innerHTML += ' <span style="color: #e53935; font-weight:700;">💀 Game Over!</span> O computador venceu.';
     }
 
     // Comentário extra sobre o placar
     const scoreComment = getScoreComment(userScore, cpuScore, winner);
     if (gameResultEl) gameResultEl.innerHTML += ` ${scoreComment}`;
 
     // Garante estado do suspense após atualizações
     checkSuspenseLoopState();
 
     busy = false;
   }, 1800);
 }
 
 function updateScoreHighlight() {
   const userScoreNum = parseInt(userScoreEl ? userScoreEl.textContent : '0', 10) || 0;
   const cpuScoreNum = parseInt(cpuScoreEl ? cpuScoreEl.textContent : '0', 10) || 0;
 
   const scoreboard = document.querySelector('.scoreboard');
   if (!scoreboard) return;
   const scoreBlocks = scoreboard.querySelectorAll('div');
 
   scoreBlocks.forEach(el => el.classList.remove('winner', 'loser', 'tie'));
 
   if (userScoreNum > cpuScoreNum) {
     scoreBlocks[0].classList.add('winner');
     scoreBlocks[1].classList.add('loser');
   } else if (cpuScoreNum > userScoreNum) {
     scoreBlocks[1].classList.add('winner');
     scoreBlocks[0].classList.add('loser');
   } else {
     scoreBlocks.forEach(el => el.classList.add('tie'));
   }
 }
 
 function getScoreComment(userScoreVal, cpuScoreVal, lastWinner) {
   const diff = userScoreVal - cpuScoreVal;
 
   if (userScoreVal >= 10 && userScoreVal > cpuScoreVal) {
     return '<span style="color: #1e88e5; font-weight:700;">🏆 Chegou a 10 vitórias primeiro! Que conquista!</span>';
   }
 
   if (cpuScoreVal >= 10 && cpuScoreVal > userScoreVal) {
     return '<span style="color: #e53935; font-weight:700;">💻 Ele chegou a 10 vitórias antes… revanche?</span>';
   }
 
   if (diff >= 4) {
     return '<span style="color: #1e88e5; font-weight:700;">🔥 Placar:</span> Estás dominando! Que sequência!';
   }
 
   if (diff <= -4) {
     return '<span style="color: #e53935; font-weight:700;">😞 Placar:</span> Ele está te atropelando… tente virar o jogo!';
   }
 
   if (diff === 0) {
     return '<span style="color: #ff9800; font-weight:700;">⚖️ Placar:</span> Tá tudo igual por enquanto...';
   }
 
   if (diff > 0) {
    return '<span style="color: #1e88e5; font-weight:700;">😎 Placar:</span> Você está na frente! Continue assim!';
  }
 
   if (diff < 0) {
     return '<span style="color: #e53935; font-weight:700;">😞 Placar:</span> Ele está ganhando… bora reagir!';
   }
 
   return '';
 }
 
 // Eventos principais
 if (btnRock) btnRock.addEventListener('click', () => playRound('rock'));
 if (btnPaper) btnPaper.addEventListener('click', () => playRound('paper'));
 if (btnScissors) btnScissors.addEventListener('click', () => playRound('scissors'));
 
 if (resetBtn) {
   resetBtn.addEventListener('click', () => {
     userScore = 0;
     cpuScore = 0;
     updateScores();
     updateScoreHighlight();
     if (gameResultEl) gameResultEl.textContent = 'Faça sua escolha';
     resetVisual();

     // Para o loop de suspense se estiver ocorrendo e não retoma bgMusic
     if (isSuspenseLooping) stopSuspenseLoop(false);
 
     // Reinicia música se estiver configurada como ligada
     if (musicOn && bgMusic && bgMusic.paused) {
       const p = bgMusic.play();
       if (p && p.catch) p.catch(() => {});
     }
   });
 }
 
 window.addEventListener('keydown', (e) => {
   if (e.key === 'Escape' && backdrop) backdrop.style.display = 'none';
 });
 
 // Sons de mouseover dos botões de escolha
 const rockSound = new Audio('assets/audio/rock.mp3');
 const paperSound = new Audio('assets/audio/paper.mp3');
 const scissorsSound = new Audio('assets/audio/scissors.mp3');
 
 if (btnRock) {
   btnRock.addEventListener('mouseenter', () => {
     rockSound.currentTime = 0;
     rockSound.play();
   });
 }
 if (btnPaper) {
   btnPaper.addEventListener('mouseenter', () => {
     paperSound.currentTime = 0;
     paperSound.play();
   });
 }
 if (btnScissors) {
   btnScissors.addEventListener('mouseenter', () => {
     scissorsSound.currentTime = 0;
     scissorsSound.play();
   });
 }
 
 // Inicializa
 resetVisual();
 updateScores();
 updateScoreHighlight();
 checkSuspenseLoopState();
 