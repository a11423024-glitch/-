document.addEventListener('DOMContentLoaded', () => {
    // --- 【新增】全局數據儲存區 ---
    let coinSimulationData = []; // 儲存區塊 II 硬幣模擬的 H/T 結果 (True/False)
    let diceSimulationData = []; // 儲存區塊 II 骰子模擬的 1-6 結果
    // ---------------------------------
    
    // 新增: 獲取聲音 DOM 元素
    const soundFlip = document.getElementById('sound-flip');
    const soundRoll = document.getElementById('sound-roll');
    const soundIncorrect = document.getElementById('sound-incorrect');
    const soundCorrect = document.getElementById('sound-correct'); // 答對音效
    
    // --- 變數與 DOM 元素獲取 ---
    // 區域 1-A: 硬幣模擬
    let headsCount = 0;
    let tailsCount = 0;
    const headsText = '正面';
    const tailsText = '反面';

    // 圖片路徑
    const headsImgSrc = "coin_head.png";
    const tailsImgSrc = "coin_tail.png";

    // DOM 元素 (硬幣)
    const coinImg = document.getElementById('coin-img');
    const headsDisplay = document.getElementById('heads-count');
    const tailsDisplay = document.getElementById('tails-count');
    const flipButton = document.getElementById('flip-button');
    const resetCoinButton = document.getElementById('reset-coin-button');
    const headsBar = document.getElementById('heads-bar');
    const tailsBar = document.getElementById('tails-bar');
    const shortTermFeedback = document.getElementById('short-term-feedback'); // 區塊I的即時回饋

    // 區域 1-B: 骰子模擬
    const diceImg = document.getElementById('dice-img');
    const rollDiceButton = document.getElementById('roll-dice-button');
    const lastDiceResultDisplay = document.getElementById('last-dice-result');
    const diceTotalCountDisplay = document.getElementById('dice-total-count');
    // let diceTotalCount = 0; // 不再需要，直接從 DOM 讀取
    let diceChart = null; // 儲存 I-B 區塊的長條圖實例
    let diceRolls = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }; // 追蹤 I-B 的手動擲骰次數
    const diceResultsList = document.getElementById('dice-results-list'); // 區塊 1-B 列表 DOM

    // 區域 2 & 3: 大規模模擬與證明
    const runSimButton = document.getElementById('run-simulation-button');
    
    // --- 【修改】區塊 III 按鈕 & 區域 ID ---
    const proofButtonCoin = document.getElementById('proof-button-coin');
    const proofButtonDice = document.getElementById('proof-button-dice');
    const coinFinalProofDiv = document.getElementById('coin-final-proof'); // 原 final-proof
    const diceFinalProofDiv = document.getElementById('dice-final-proof'); // 新增
    const proofGuideBox = document.getElementById('proof-guide-box');       // 新增
    // -----------------------------------------
    
    const simResultsDiv = document.getElementById('simulation-results');
    const chartCtx = document.getElementById('frequencyChart').getContext('2d');
    const infoBox2 = document.getElementById('info-box-2');
    const quizBox2 = document.getElementById('quiz-box-2');
    const infoBox3 = document.getElementById('info-box-3');
    const quizBox3 = document.getElementById('quiz-box-3');
    let currentMode = 'coin'; // 追蹤當前模式 ('coin' 或 'dice')
    // DOM 元素 (區塊 II 新增)
    const selectCoinButton = document.getElementById('select-coin');
    const selectDiceButton = document.getElementById('select-dice');
    const simStatsCoin = document.getElementById('sim-stats-coin');
    const simStatsDice = document.getElementById('sim-stats-dice');
    const diceSimTotal = document.getElementById('dice-sim-total');

    // let history = []; // 不再需要，使用 coinSimulationData
    const SIMULATION_COUNT = 10000;
    let flipCount = 0; // 用於限制短期模擬次數
    
    // 在 setupQuiz 函式之前或其他合適位置新增此輔助函數
    const playSound = (audioElement) => {
        if (!audioElement) return; // 確保元素存在

        // 核心邏輯: 停止並重設到開頭，然後播放
        audioElement.pause();
        audioElement.currentTime = 0;
        audioElement.play().catch(e => {
            // 捕捉瀏覽器可能因使用者未互動而阻止自動播放的錯誤
            console.error("無法播放音效：", e);
        });
    };
    
    // --- 輔助函數：處理測驗邏輯 ---
    const setupQuiz = (quizId, correctAnswer) => {
        const feedbackEl = document.getElementById(`quiz-feedback-${quizId}`);
        const buttons = document.querySelectorAll(`#quiz-box-${quizId} .quiz-option`);

        buttons.forEach(button => {
            button.addEventListener('click', (event) => {
                const selectedAnswer = event.target.getAttribute('data-answer');

                // 清除所有按鈕的背景色
                document.querySelectorAll(`#quiz-box-${quizId} .quiz-option`).forEach(btn => btn.style.backgroundColor = '#64b5f6');

                if (selectedAnswer === correctAnswer) {
                    // 答對邏輯
                    playSound(soundCorrect); 
                    feedbackEl.textContent = '✅ 太棒了！這是正確的機率思維。';
                    feedbackEl.classList.remove('incorrect');
                    feedbackEl.classList.add('correct');
                    event.target.style.backgroundColor = '#4CAF50';
                } else {
                    // 答錯邏輯
                    playSound(soundIncorrect); 
                    feedbackEl.textContent = '❌ 答案不正確。請閱讀上方的理論知識，再試試看。';
                    feedbackEl.classList.remove('correct');
                    feedbackEl.classList.add('incorrect');
                    event.target.style.backgroundColor = '#D32F2F';
                }
            });
        });
    };

    // 初始化所有測驗
    setupQuiz(1, 'A'); // 測驗 I: 保持 50%
    setupQuiz(2, 'B'); // 測驗 II: 大數法則
    setupQuiz(3, 'B'); // 測驗 III: 保持不變 (獨立事件)

    // --- 區域 1-A: 短期硬幣模擬 (手動擲幣) ---
    const updateFrequencyBar = () => {
        const total = headsCount + tailsCount;
        if (total === 0) return;

        const headsPercent = (headsCount / total) * 100;
        const tailsPercent = (tailsCount / total) * 100;

        headsBar.style.width = `${headsPercent.toFixed(1)}%`;
        headsBar.textContent = headsPercent > 10 ? `${headsPercent.toFixed(0)}%` : '';
        tailsBar.style.width = `${tailsPercent.toFixed(1)}%`;
        tailsBar.textContent = tailsPercent > 10 ? `${tailsPercent.toFixed(0)}%` : '';

        // 實時教學反饋邏輯
        const thresholdHigh = 70; // 高度偏離閾值
        const thresholdLow = 30;  // 低度偏離閾值
        const theoreticalProb = 50;

        if (total > 5) { // 至少擲了 5 次之後才開始給予反饋
            if (headsPercent >= thresholdHigh) {
                shortTermFeedback.textContent = `😱 數據警示： 您連續擲出正面，實驗機率高達 ${headsPercent.toFixed(0)}%！但請記住，硬幣的古典機率是 50%，這是短期隨機性造成的極端現象。`;
                shortTermFeedback.classList.add('incorrect');
                shortTermFeedback.classList.remove('correct');
            } else if (headsPercent <= thresholdLow) {
                shortTermFeedback.textContent = `📉 數據警示： 您的正面次數過少，實驗機率只有 ${headsPercent.toFixed(0)}%。這與 50% 的理論機率相差甚遠。這就是短期實驗的不穩定性。`;
                shortTermFeedback.classList.add('incorrect');
                shortTermFeedback.classList.remove('correct');
            } else if (headsPercent >= 40 && headsPercent <= 60) {
                shortTermFeedback.textContent = `📊 表現穩定： 總次數 ${total} 次。實驗頻率 ${headsPercent.toFixed(0)}% 接近理論值 ${theoreticalProb}%。繼續保持！`;
                shortTermFeedback.classList.remove('incorrect');
                shortTermFeedback.classList.add('correct');
            } else {
                shortTermFeedback.textContent = `🧐 觀察中： 總次數 ${total} 次。實驗頻率 ${headsPercent.toFixed(0)}%，雖然有波動，但仍在觀察範圍內。`;
                shortTermFeedback.classList.remove('incorrect');
                shortTermFeedback.classList.remove('correct');
            }
        } else {
            shortTermFeedback.textContent = "請多擲幾次硬幣（建議 20 次），觀察您的「短期運氣」如何變化。";
            shortTermFeedback.classList.remove('incorrect', 'correct');
        }
    };

    const flipCoin = () => {
        if (flipCount >= 20) { // 限制次數 (邏輯 A)
            shortTermFeedback.textContent = "✅ 短期挑戰結束！請繼續進行下面的理論測驗，然後前往區塊 I-B 和 II。";
            flipButton.disabled = true;
            resetCoinButton.style.display = 'inline-block'; // 顯示重置按鈕
            return;
        }

        flipButton.disabled = true; // 開始動畫時禁用按鈕

        // 移除舊的 CSS 變動，新增 spinning 類別來觸發旋轉動畫
        coinImg.classList.add('spinning');
        playSound(soundFlip); // 提前播放音效以模擬擲出

        const animationDuration = 800; // 調整動畫時間為 800ms

        setTimeout(() => {
            // 移除 spinning 類別，停止動畫，顯示最終結果
            coinImg.classList.remove('spinning');

            // 核心擲幣邏輯
            const result = Math.random() < 0.5 ? headsText : tailsText;
            if (result === headsText) {
                headsCount++;
                coinImg.src = headsImgSrc;
            } else {
                tailsCount++;
                coinImg.src = tailsImgSrc;
            }
            flipCount++;

            headsDisplay.textContent = headsCount;
            tailsDisplay.textContent = tailsCount;

            updateFrequencyBar(); // 更新頻率條和反饋

            if (flipCount >= 20) {
                flipButton.disabled = true; // 達到限制後禁用
                shortTermFeedback.textContent = "✅ 短期挑戰結束！請繼續進行下面的理論測驗，然後前往區塊 I-B 和 II。";
                resetCoinButton.style.display = 'inline-block'; // 顯示重置按鈕
            } else {
                flipButton.disabled = false; // 恢復按鈕
            }
        }, animationDuration); // 使用調整後的動畫時間
    };

    // --- 重置硬幣挑戰的函數 ---
    const resetCoin = () => {
        headsCount = 0;
        tailsCount = 0;
        flipCount = 0; // 重置次數限制
        // history = []; // 重置證明區的歷史數據 - 實際應重置 coinSimulationData，但這裡只重置手動區
        
        headsDisplay.textContent = 0;
        tailsDisplay.textContent = 0;
        coinImg.src = headsImgSrc; // 恢復初始圖片

        // 重設頻率條和反饋
        headsBar.style.width = '50%';
        tailsBar.style.width = '50%';
        headsBar.textContent = '50%';
        tailsBar.textContent = '50%';
        shortTermFeedback.textContent = "請多擲幾次硬幣（建議 20 次），觀察您的「短期運氣」如何變化。";
        shortTermFeedback.classList.remove('incorrect', 'correct');

        // 恢復按鈕狀態
        flipButton.disabled = false;
        resetCoinButton.style.display = 'none'; // 隱藏重置按鈕
    };

    flipButton.addEventListener('click', flipCoin);
    if (resetCoinButton) {
        resetCoinButton.addEventListener('click', resetCoin);
    }

    // --- 區域 1-B: 擲骰子模擬 ---
    
    // 初始化骰子結果列表
    const initializeDiceList = () => {
        if (!diceResultsList) return;
        diceResultsList.innerHTML = '';
        for (let i = 1; i <= 6; i++) {
            const li = document.createElement('li');
            li.id = `dice-point-${i}`;
            li.innerHTML = `${i} 點: <span class="dice-count">0</span> 次 (<span class="dice-freq">0.00%</span>)`;
            diceResultsList.appendChild(li);
        }
    };

    // 每次手動擲骰子的邏輯 (區塊 I-B)
    const rollDice = () => {
        const totalCountSpan = document.getElementById('dice-total-count');
        const lastResultSpan = document.getElementById('last-dice-result');
        const diceImg = document.getElementById('dice-img');
        const diceList = document.getElementById('dice-results-list');

        const diceFeedback = document.getElementById('dice-short-term-feedback');

        rollDiceButton.disabled = true;

        // 1. 產生結果
        const result = Math.floor(Math.random() * 6) + 1;
        diceRolls[result]++;
        const currentTotal = parseInt(totalCountSpan.textContent) + 1;

        // 2. 更新 DOM 及動畫
        playSound(soundRoll);

        const animationDuration = 500;

        diceImg.style.transition = `transform ${animationDuration / 1000}s ease-out`;
        diceImg.style.transform = 'rotateX(720deg) rotateY(720deg) scale(1.1)';

        setTimeout(() => {
            diceImg.style.transition = 'none';
            diceImg.style.transform = 'none';

            diceImg.src = `dice_${result}.png`;

            rollDiceButton.disabled = false;

            // 核心數據更新
            totalCountSpan.textContent = currentTotal;
            lastResultSpan.textContent = result;

            // 3. 更新列表 (實驗頻率)
            diceList.innerHTML = '';
            for (let i = 1; i <= 6; i++) {
                const count = diceRolls[i];
                const freq = (count / currentTotal) * 100;
                const listItem = document.createElement('li');
                listItem.textContent = `${i} 點: ${count} 次 (${freq.toFixed(2)}%)`;
                diceList.appendChild(listItem);
            }

            // 4. 更新長條圖
            updateDiceChart(currentTotal);

            // --- 5. 累積次數提示邏輯 (教學反饋) ---
            const guidingThreshold = 30;

            if (diceFeedback) {
                if (currentTotal < guidingThreshold) {
                    diceFeedback.innerHTML = `🧐 繼續努力！目前總共擲了 ${currentTotal} 次。請觀察您的短期運氣。`;
                    diceFeedback.className = 'feedback-normal';
                } else {
                    const variance = Math.max(...Object.values(diceRolls).map(count => Math.abs(count / currentTotal - 1 / 6)));

                    if (variance > 0.05) {
                        diceFeedback.innerHTML = `⚠️ <strong>短期極端！</strong> 擲骰 ${currentTotal} 次後，實驗頻率仍有較大偏差。這是短期隨機性，要證明 $P=1/6$ 嗎？請前往<strong>區塊 II</strong> 執行大規模模擬！`;
                        diceFeedback.className = 'feedback-warning';
                    } else {
                        diceFeedback.innerHTML = `📊 <strong>表現穩定！</strong> 擲骰 ${currentTotal} 次後，各點數頻率開始接近 $16.67\% $。現在，請前往 <strong>區塊 II</strong>，透過 10,000 次模擬驗證大數法則的力量。`;
                        diceFeedback.className = 'feedback-success';
                    }
                }
            }
            // --- 累積次數提示邏輯結束 ---

        }, animationDuration);
    };

    // 繪製/更新 I-B 區塊長條圖的函數
    const updateDiceChart = (currentTotal) => {
        const data = Object.values(diceRolls).map(count => (count / currentTotal) * 100);

        if (diceChart) {
            diceChart.data.datasets[0].data = data;
            diceChart.update();
        } else {
            const chartCtx = document.getElementById('diceFrequencyBarChart').getContext('2d');
            const theoreticalProb = 16.667;

            diceChart = new Chart(chartCtx, {
                type: 'bar',
                data: {
                    labels: ['1 點', '2 點', '3 點', '4 點', '5 點', '6 點'],
                    datasets: [
                        {
                            label: '實驗頻率 (%)',
                            data: data,
                            backgroundColor: '#66bb6a',
                            borderColor: '#388e3c',
                            borderWidth: 1
                        },
                        {
                            type: 'line',
                            label: `理論機率 (${theoreticalProb.toFixed(2)}%)`,
                            data: Array(6).fill(theoreticalProb),
                            borderColor: '#d32f2f',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            fill: false,
                            pointRadius: 0
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'top' },
                        title: { display: true, text: '各點數實驗頻率與理論機率對比' }
                    },
                    scales: {
                        y: {
                            min: 0,
                            max: 40,
                            title: { display: true, text: '實驗頻率 (%)' }
                        }
                    }
                }
            });
        }
    };

    if (rollDiceButton) {
        rollDiceButton.addEventListener('click', rollDice);
        initializeDiceList();
    }


    // --- 區域 2: 大規模模擬與大數法則圖表 ---
    let frequencyChart;

    const DICE_COLORS = [
        'rgb(255, 99, 132)', 
        'rgb(255, 159, 64)', 
        'rgb(255, 205, 86)', 
        'rgb(75, 192, 192)', 
        'rgb(54, 162, 235)', 
        'rgb(153, 102, 255)' 
    ];

    const createChart = (data, labels, mode) => {
        if (frequencyChart) {
            frequencyChart.destroy();
        }

        let datasets = [];
        let theoreticalProb;
        let chartTitle;
        let yMax, yMin;

        if (mode === 'coin') {
            theoreticalProb = 50;
            chartTitle = '正面頻率隨次數變化 (收斂至 50%)';
            yMax = 55;
            yMin = 45;

            datasets.push({
                label: '正面頻率 (%)',
                data: data[0],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                pointRadius: 0
            });
        } else { // 骰子模式 (Dice Mode)
            theoreticalProb = 16.667;
            chartTitle = '各點數頻率隨次數變化 (收斂至 16.67%)';
            yMax = 30;
            yMin = 0;

            for (let i = 0; i < 6; i++) {
                datasets.push({
                    label: `${i + 1} 點頻率 (%)`,
                    data: data[i],
                    borderColor: DICE_COLORS[i],
                    tension: 0.1,
                    pointRadius: 0
                });
            }
        }

        // 加入理論機率線
        datasets.push({
            label: `理論機率 (${theoreticalProb.toFixed(2)}%)`,
            data: labels.map(() => theoreticalProb),
            borderColor: 'rgb(0, 0, 0)',
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false
        });

        const chart = new Chart(chartCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                scales: {
                    y: {
                        min: yMin,
                        max: yMax,
                        title: { display: true, text: '頻率 (%)' }
                    },
                    x: {
                        title: { display: true, text: '擲幣/擲骰次數 (log 尺規)' }
                    }
                },
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: chartTitle }
                }
            }
        });
        frequencyChart = chart;
    };

    // --- 模式切換邏輯 (硬幣/骰子) ---
    const switchMode = (mode) => {
        currentMode = mode;
        selectCoinButton.classList.remove('active');
        selectDiceButton.classList.remove('active');
        if (mode === 'coin') {
            selectCoinButton.classList.add('active');
            simStatsCoin.classList.remove('hidden');
            simStatsDice.classList.add('hidden');
        } else {
            selectDiceButton.classList.add('active');
            simStatsCoin.classList.add('hidden');
            simStatsDice.classList.remove('hidden');
        }
        if (frequencyChart) {
            frequencyChart.destroy();
        }
        document.getElementById('sim-prob').textContent = '0%';
    };

    selectCoinButton.addEventListener('click', () => switchMode('coin'));
    selectDiceButton.addEventListener('click', () => switchMode('dice'));

    switchMode('coin');

    // 執行大規模模擬
    const runSimulation = () => {
        runSimButton.disabled = true;

        // --- 【修改】重置全局數據 ---
        coinSimulationData = [];
        diceSimulationData = [];
        // -----------------------------
        
        let totalHeads = 0;
        let diceResults = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        
        const chartData = currentMode === 'coin' ? [[]] : [
            [], [], [], [], [], []
        ];
        const chartLabels = [];

        for (let i = 0; i < SIMULATION_COUNT; i++) {
            if (currentMode === 'coin') {
                const isHeads = Math.random() < 0.5;
                if (isHeads) {
                    totalHeads++;
                }
                // --- 【新增】儲存硬幣原始結果 ---
                coinSimulationData.push(isHeads); // True = 正面, False = 反面
                // ---------------------------------
            } else { // 骰子模式邏輯
                const result = Math.floor(Math.random() * 6) + 1;
                diceResults[result]++;
                // --- 【新增】儲存骰子原始結果 ---
                diceSimulationData.push(result);
                // ---------------------------------
            }

            // 策略性取點以展現收斂趨勢
            if (i < 10 || (i < 100 && (i % 10 === 9)) || (i < 1000 && (i % 100 === 99)) || (i % 1000 === 999) || (i === SIMULATION_COUNT - 1)) {
                const currentTotal = i + 1;
                chartLabels.push(currentTotal);

                if (currentMode === 'coin') {
                    const currentFrequency = (totalHeads / currentTotal) * 100;
                    chartData[0].push(currentFrequency);
                } else {
                    for (let j = 1; j <= 6; j++) {
                        const currentFrequency = (diceResults[j] / currentTotal) * 100;
                        chartData[j - 1].push(currentFrequency);
                    }
                }
            }
        }

        // history = historyForProof; // 舊的硬幣儲存方式，已被 coinSimulationData 取代

        // 更新結果顯示
        if (currentMode === 'coin') {
            document.getElementById('sim-heads').textContent = totalHeads;
            document.getElementById('sim-tails').textContent = SIMULATION_COUNT - totalHeads;
            document.getElementById('sim-prob').textContent = ((totalHeads / SIMULATION_COUNT) * 100).toFixed(2) + '%';
        } else {
            diceSimTotal.textContent = SIMULATION_COUNT;
            for (let i = 1; i <= 6; i++) {
                const count = diceResults[i];
                const freq = (count / SIMULATION_COUNT) * 100;
                document.getElementById(`dice-sim-${i}`).textContent = count;
                document.getElementById(`dice-freq-${i}`).textContent = freq.toFixed(2) + '%';
            }
        }

        createChart(chartData, chartLabels, currentMode);

        simResultsDiv.classList.remove('hidden');
        // proofButton.disabled = currentMode === 'dice'; // 舊的邏輯

        runSimButton.disabled = false;

        // 顯示區塊 II 教學內容
        infoBox2.classList.remove('hidden');
        quizBox2.classList.remove('hidden');
        
        // --- 【新增】模擬完成後檢查區塊 III 狀態 ---
        checkSimulationData();
        // ---------------------------------------------
    };

    runSimButton.addEventListener('click', runSimulation);

    // --- 【新增】區塊 III 狀態檢查函數 ---
    const checkSimulationData = () => {
        const coinDataReady = coinSimulationData.length === SIMULATION_COUNT;
        const diceDataReady = diceSimulationData.length === SIMULATION_COUNT;

        // 判斷是否需要引導回區塊 II
        if (!coinDataReady || !diceDataReady) {
            proofGuideBox.style.display = 'block'; // 顯示引導提示
            
            // 啟用數據已準備好的證明按鈕
            if(proofButtonCoin) proofButtonCoin.disabled = !coinDataReady;
            if(proofButtonDice) proofButtonDice.disabled = !diceDataReady;
            
            // 更新引導文字
            let guideText = '您尚未執行「區塊 II：大規模模擬」中的';
            if (!coinDataReady && !diceDataReady) {
                guideText += '硬幣和骰子模擬！請執行這兩項以獲取數據。';
            } else if (!coinDataReady) {
                guideText += '硬幣模擬！';
            } else if (!diceDataReady) {
                guideText += '骰子模擬！';
            }
            document.getElementById('proof-guide-text').textContent = guideText;

        } else {
            proofGuideBox.style.display = 'none'; // 隱藏引導提示
            if(proofButtonCoin) proofButtonCoin.disabled = false;
            if(proofButtonDice) proofButtonDice.disabled = false;
        }
    };
    // ----------------------------------------


    // --- 區域 3: 獨立事件終極證明 ---
    let proofChartCoin;
    let proofChartDice; // 新增骰子證明圖表實例

    // 硬幣證明圖表繪製
    const createProofCoinChart = (headsProb, tailsProb) => {
        if (proofChartCoin) {
            proofChartCoin.destroy();
        }
        const proofChartCtx = document.getElementById('proofCoinChartCanvas').getContext('2d');
        const chart = new Chart(proofChartCtx, {
            type: 'bar',
            data: {
                labels: ['第 6 次是正面', '第 6 次是反面'],
                datasets: [{
                    label: '實驗頻率 (%)',
                    data: [headsProb, tailsProb],
                    backgroundColor: ['#4CAF50', '#FFC107'],
                    borderColor: ['#388E3C', '#FFA000'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        min: 40,
                        max: 60,
                        title: { display: true, text: '機率/頻率 (%)' }
                    }
                },
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: '連續 5 正後，第 6 次結果的頻率對比' }
                }
            }
        });
        proofChartCoin = chart;
    };
    
    // 【新增】骰子證明圖表繪製
    const createProofDiceChart = (sixCount, nonSixCount) => {
        if (proofChartDice) {
            proofChartDice.destroy();
        }
        const proofChartCtx = document.getElementById('proofDiceChartCanvas').getContext('2d');
        
        const chart = new Chart(proofChartCtx, {
            type: 'bar',
            data: {
                labels: ['擲出 6 點 (理論 16.67%)', '擲出 非 6 點 (理論 83.33%)'],
                datasets: [{
                    label: '第 6 次結果 (實驗次數)',
                    data: [sixCount, nonSixCount],
                    backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)'],
                    borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: '實驗次數' }
                    }
                },
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: '連續 5 次非 6 點後，第 6 次結果統計' }
                }
            }
        });
        proofChartDice = chart;
    };
    // ----------------------------
    
    // 硬幣獨立事件證明
    const proveCoinIndependence = () => {
        if (coinSimulationData.length < SIMULATION_COUNT) {
            checkSimulationData(); // 如果數據不足，顯示提示
            return;
        }

        const CONSECUTIVE_N = 5;
        let consecutiveHeadsCount = 0;
        let headsAfterNHeads = 0;

        for (let i = 0; i < coinSimulationData.length - CONSECUTIVE_N; i++) {
            let isNHeads = true;
            for (let j = 0; j < CONSECUTIVE_N; j++) {
                if (!coinSimulationData[i + j]) { // 如果不是正面 (False)
                    isNHeads = false;
                    break;
                }
            }

            if (isNHeads) {
                consecutiveHeadsCount++;

                if (coinSimulationData[i + CONSECUTIVE_N]) { // 第 6 次是正面
                    headsAfterNHeads++;
                }
            }
        }

        const proofHeadsProb = consecutiveHeadsCount > 0
            ? ((headsAfterNHeads / consecutiveHeadsCount) * 100).toFixed(2)
            : '0.00';
        const proofTailsProb = consecutiveHeadsCount > 0
            ? (((consecutiveHeadsCount - headsAfterNHeads) / consecutiveHeadsCount) * 100).toFixed(2)
            : '0.00';

        document.getElementById('proof-heads-prob').textContent = proofHeadsProb + '%';
        document.getElementById('proof-tails-prob').textContent = proofTailsProb + '%';

        createProofCoinChart(parseFloat(proofHeadsProb), parseFloat(proofTailsProb));

        coinFinalProofDiv.classList.remove('hidden');
        diceFinalProofDiv.classList.add('hidden'); // 隱藏骰子證明區

        // 顯示區塊 III 教學內容
        infoBox3.classList.remove('hidden');
        quizBox3.classList.remove('hidden');
    };
    
    // 【新增】骰子獨立事件證明
    const proveDiceIndependence = () => {
        if (diceSimulationData.length < SIMULATION_COUNT) {
            checkSimulationData(); // 如果數據不足，顯示提示
            return;
        }

        const CONSECUTIVE_N = 5; // 連續 5 次非 6 點
        let totalSeries = 0;     // 總共有多少次滿足「連續 5 次非 6 點」的條件
        let nextIsSix = 0;       // 滿足條件後，下一次是 6 點的次數

        // 遍歷數據，直到倒數第 6 個元素
        for (let i = 0; i <= diceSimulationData.length - CONSECUTIVE_N - 1; i++) {
            let isFiveNonSix = true;
            
            // 檢查連續 5 個結果是否都不是 6
            for (let j = 0; j < CONSECUTIVE_N; j++) {
                if (diceSimulationData[i + j] === 6) {
                    isFiveNonSix = false;
                    break;
                }
            }
            
            if (isFiveNonSix) {
                totalSeries++;
                // 檢查緊接著的第 6 個結果
                if (diceSimulationData[i + CONSECUTIVE_N] === 6) {
                    nextIsSix++;
                }
            }
        }

        const nextIsNonSix = totalSeries - nextIsSix;
        const probSix = totalSeries > 0 ? (nextIsSix / totalSeries) * 100 : 0;
        const probNonSix = totalSeries > 0 ? (nextIsNonSix / totalSeries) * 100 : 0;
        
        // 更新 DOM 顯示
        document.getElementById('proof-six-prob').textContent = `${probSix.toFixed(2)}% (理論值 ≈ 16.67%)`;
        document.getElementById('proof-non-six-prob').textContent = `${probNonSix.toFixed(2)}% (理論值 ≈ 83.33%)`;

        createProofDiceChart(nextIsSix, nextIsNonSix);

        diceFinalProofDiv.classList.remove('hidden');
        coinFinalProofDiv.classList.add('hidden'); // 隱藏硬幣證明區

        // 顯示區塊 III 教學內容
        infoBox3.classList.remove('hidden');
        quizBox3.classList.remove('hidden');
    };
    // ----------------------------

    // --- 【修改】事件監聽器 ---
    if(proofButtonCoin) proofButtonCoin.addEventListener('click', proveCoinIndependence);
    if(proofButtonDice) proofButtonDice.addEventListener('click', proveDiceIndependence);
    // ----------------------------
    
    // 首次載入時檢查數據狀態
    document.addEventListener('DOMContentLoaded', checkSimulationData);
});