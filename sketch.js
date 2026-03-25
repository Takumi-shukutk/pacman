    // --- 変数の宣言 ---
    let mode = 0; // 0: スタート, 1: プレイ中, 2: ゲームオーバー, 3: クリア
    let CELL_SIZE = 40; // 1マスのピクセルサイズ
    let powerTime = 7; //パワーエサの継続秒
    let powerTimer = 0;

    // マップの2次元配列: 1=壁, 0=通路（ドットあり）
let map = [
  [1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1],
  [1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1],
  [1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
];  

    let pacman;
    let ghosts = [];
    let dots = []; // 2次元配列: dots[行][列] = true でドットあり
    let score;

    // --- 初期化 ---
    function setup() {
        let CanvasH = map.length * CELL_SIZE
        let canvasW = map[0].length * CELL_SIZE
        createCanvas(canvasW, CanvasH)
        angleMode(DEGREES);
        initGame();
    }

    // --- メインループ,シーンの設定 ---
    function draw() {
        background(0);
        if (mode == 0) {
            showStartScreen();
        } else if (mode == 1) {
            playGame();
        } else if (mode == 2) {
            showGameOver();
        } else if (mode == 3) {
            showClearScreen();
        }
    }

    // --- スペースキー操作 ---
    function keyPressed() {
        if (mode == 0 && key == " ") {
            initGame();
            mode = 1;
        } else if (mode == 1) {
            changeDirection();
        } else if (mode == 2 && key == " ") {
            mode = 0;
        } else if (mode == 3 && key == " ") {
            mode = 0;
        }
    }

    // --- 画面表示 ---
    // 待機画面
    function showStartScreen() {
        drawMap();
        drawDots();
        drawPacman();
        drawScore();
        textAlign(CENTER);
        fill("yellow");
        textSize(40);
        text("PAC-MAN", width / 2, height / 2 - 30);
        fill("white");
        textSize(18);
        text("SPACE キーでスタート", width / 2, height / 2 + 20);
    }

    // プレイ画面
    function playGame() {
        updatePacman();
        updateGhosts();
        checkEatDots();
        checkHitGhost();
        checkClear();
        drawMap();
        drawDots();
        drawPacman();
        drawGhosts();
        drawScore();
        if (powerTimer > 0) {
            powerTimer--;
            pacman.speed = CELL_SIZE / 20 * 1.5
        } else {
            pacman.speed = CELL_SIZE / 20
        }
    }

    // 負け画面
    function showGameOver() {
        drawMap();
        drawDots();
        drawPacman();
        drawGhosts();
        drawScore();
        textAlign(CENTER);
        fill("red");
        textSize(40);
        text("GAME OVER", width / 2, height / 2);
        fill("white");
        textSize(18);
        text("SPACE キーでタイトルへ", width / 2, height / 2 + 50);
    }

    // 勝利画面
    function showClearScreen() {
        drawMap();
        drawDots();
        drawPacman();
        drawScore();
        textAlign(CENTER);
        fill("yellow");
        textSize(40);
        text("STAGE CLEAR!", width / 2, height / 2);
        fill("white");
        textSize(18);
        text("SPACE キーでタイトルへ", width / 2, height / 2 + 50);
    }

    // --- ゲームの初期化の設定 ---
    function initGame() {
        // mapの2次元配列からdotsの2次元配列を生成する
        dots = [];
        for (let r = 0; r < map.length; r++) {
            dots.push([]);
            for (let c = 0; c < map[r].length; c++) {
                // 端のトンネルマスにはドットを置かない
                let isBorder =
                    r == 0 ||
                    r == map.length - 1 ||
                    c == 0 ||
                    c == map[r].length - 1;
                dots[r].push(map[r][c] == 0 && !isBorder);
            }
        }

        // pacmanの初期位置
        pacman = {
            col: 8,
            row: 8, // 向かっているマス（列, 行）
            x: cellX(7),
            y: cellY(8), // ピクセル位置
            dir: { x: 1, y: 0 }, // 現在の進行方向
            nextDir: { x: 1, y: 0 }, // 次に曲がりたい方向
            speed: CELL_SIZE / 20,
            mouthAngle: 0,
            mouthOpen: true,
        };

        // ghostの初期位置
        // ghostsを空にしてから4体追加
        ghosts = [];
        let endD = map.length - 2
        let endR = map[0].length - 2
            // 赤
            ghosts.push({
                col: 1,
                row: 1,
                x: cellX(1),
                y: cellY(1),
                dir: {x:1, y:0},
                speed: CELL_SIZE / 20,
                clr: color(255, 0, 0),
                type: "red"
            });
            // ピンク
            ghosts.push({
                col: endR,
                row: 1,
                x: cellX(endR),
                y: cellY(1),
                dir: {x:-1, y:0},
                speed: CELL_SIZE / 20,
                clr: color(255, 184, 255),
                type: "pink"
            });
            // 水色
            ghosts.push({
                col: 1,
                row: endD,
                x: cellX(1),
                y: cellY(endD),
                dir: {x:1, y:0},
                speed: CELL_SIZE / 20,
                clr: color(0, 255, 255),
                type: "cyan"
            });
            // オレンジ
            ghosts.push({
                col: endR,
                row: endD,
                x: cellX(endR),
                y: cellY(endD),
                dir: {x:-1, y:0},
                speed: CELL_SIZE / 20,
                clr: color(255, 184, 82),
                type: "orange"
            });

        // scoreのリセット
        score = 0;
    }

    // マップを表示する (02)
    function drawMap() {
        noStroke();
        for (let r = 0; r < map.length; r++) {
            for (let c = 0; c < map[r].length; c++) {
                if (map[r][c] == 1) {
                    fill(0, 0, 180);
                    rect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                }
            }
        }
    }

    // ドットを表示する (03)
    function drawDots() {
        for (let r = 0; r < dots.length; r++) {
            for (let c = 0; c < dots[r].length; c++) {
                // ドットがまだ食べられていない（true）ときだけ描画する
                if (dots[r][c]) {
                    noStroke();
                    
                    if (map[r][c] == 2) {
                        // --- パワーエサの描画 ---
                        // 目立つようにピンク色で大きく、少し点滅させる
                        fill(255, 184, 174);
                        let s = 20 + sin(frameCount * 10) * 5; // ふわふわ動く演出
                        circle(cellX(c), cellY(r), s);
                    } else {
                        // --- 普通のドットの描画 ---
                        fill(255);
                        circle(cellX(c), cellY(r), 8);
                    }
                }
            }
        }
    }

    // ドットを食べる判定 (04)
    function checkEatDots() {
        // ピクセル位置からマスの番号を計算する
        let c = floor(pacman.x / CELL_SIZE);
        let r = floor(pacman.y / CELL_SIZE);
        // ワープ中はキャンバス外になるためチェックをスキップする
        if (r < 0 || r >= dots.length || c < 0 || c >= dots[r].length) return;
        if (dots[r][c]) {
            dots[r][c] = false;
            score += 10;
        }

        // パワーエサだったら
        if (map[r][c] == 2){
            powerTimer = 60 * powerTime;
            score += 40
        }
    }

    // ゴーストに当たったか (05)
    function checkHitGhost() {
        for (let i = 0; i < ghosts.length; i++) {
            let g = ghosts[i];
            let d = dist(pacman.x, pacman.y, g.x, g.y);

            if (d < CELL_SIZE * 0.8) { // 当たり判定
                if (powerTimer > 0) {
                    // --- パックマンが無敵の時：ゴーストを倒す ---
                    score += 100;
                    
                    // ゴーストをそれぞれの初期位置（四隅）へリセット
                    // setupで決めたルール（1, 1 など）に合わせて戻す
                    if (g.type === "red") { g.col = 1; g.row = 1; }
                    else if (g.type === "pink") { g.col = map[0].length - 2; g.row = 1; }
                    else if (g.type === "cyan") { g.col = 1; g.row = map.length - 2; }
                    else if (g.type === "orange") { g.col = map[0].length - 2; g.row = map.length - 2; }
                    
                    // ピクセル位置も瞬時に更新
                    g.x = cellX(g.col);
                    g.y = cellY(g.row);
                    
                } else {
                    // --- 通常時：ゲームオーバー ---
                    mode = 2;
                }
            }
        }
    }

    // 全部食べたか (06)
    function checkClear() {
        let remaining = 0;
        for (let r = 0; r < dots.length; r++) {
            for (let c = 0; c < dots[r].length; c++) {
                if (dots[r][c]) {
                    remaining = remaining + 1;
                }
            }
        }
        if (remaining == 0) {
            mode = 3;
        }
    }

    // パックマンを表示する
    function drawPacman() {
        pacman_shape(
            pacman.x,
            pacman.y,
            CELL_SIZE / 2 - 2,
            pacman.mouthAngle,
            pacman.dir,
        );
    }

    // パックマンをマスに沿って動かす
    function updatePacman() {
        let tx = cellX(pacman.col);
        let ty = cellY(pacman.row);

        // 目標マスの中心に到達したら次の行き先を決める
        if (pacman.x == tx && pacman.y == ty) {
            // nextDir に曲がれるか確認する
            let nc = pacman.col + pacman.nextDir.x;
            let nr = pacman.row + pacman.nextDir.y;
            if (isPath(nc, nr)) {
                pacman.dir = { x: pacman.nextDir.x, y: pacman.nextDir.y };
            }
            // 現在の方向に進めるなら、次のマスを目標にセットする
            let fc = pacman.col + pacman.dir.x;
            let fr = pacman.row + pacman.dir.y;
            if (isPath(fc, fr)) {
                // ワープ: 端を超えたら反対側へ
                let wc = wrapCol(fc);
                let wr = wrapRow(fr);
                if (wc != fc || wr != fr) {
                    // ピクセル位置をトンネルの入口にテレポートする
                    pacman.x = cellX(wc) - pacman.dir.x * CELL_SIZE;
                    pacman.y = cellY(wr) - pacman.dir.y * CELL_SIZE;
                }
                pacman.col = wc;
                pacman.row = wr;
            }
        }

        // 目標マスの中心に向かってピクセル移動する
        tx = cellX(pacman.col);
        ty = cellY(pacman.row);
        if (pacman.x < tx) pacman.x = min(pacman.x + pacman.speed, tx);
        else if (pacman.x > tx) pacman.x = max(pacman.x - pacman.speed, tx);
        if (pacman.y < ty) pacman.y = min(pacman.y + pacman.speed, ty);
        else if (pacman.y > ty) pacman.y = max(pacman.y - pacman.speed, ty);

        // 口の開閉アニメーション
        if (pacman.mouthOpen) {
            pacman.mouthAngle += 5;
            if (pacman.mouthAngle >= 30) pacman.mouthOpen = false;
        } else {
            pacman.mouthAngle -= 5;
            if (pacman.mouthAngle <= 0) pacman.mouthOpen = true;
        }
    }

    // 進む方向を変える
    function changeDirection() {
        if (keyCode == LEFT_ARROW || key == 'a') pacman.nextDir = { x: -1, y: 0 };
        if (keyCode == RIGHT_ARROW || key == 'd') pacman.nextDir = { x: 1, y: 0 };
        if (keyCode == UP_ARROW || key == 'w') pacman.nextDir = { x: 0, y: -1 };
        if (keyCode == DOWN_ARROW || key == 's') pacman.nextDir = { x: 0, y: 1 };
    }

    // ゴーストを表示する
    function drawGhosts() {
        for (let i = 0; i < ghosts.length; i++) {
            let g = ghosts[i];
            let displayColor = g.clr;

            if (powerTimer > 0) {
                // 終了2秒前（120フレーム）から白と青で点滅
                if (powerTimer < 120 && frameCount % 20 < 10) {
                    displayColor = color(255); // 白
                } else {
                    displayColor = color(0, 0, 255); // 弱気な青
                }
            }
            // 5番目の引数に目を向けるための「g.dir」を忘れずに！
            ghost_shape(g.x, g.y, CELL_SIZE / 2 - 2, displayColor, g.dir);
        }
    }

    // ゴーストをマスに沿って動かす
    function updateGhosts() {
    let allDirs = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
    ];

    for (let i = 0; i < ghosts.length; i++) {
        let g = ghosts[i];
        let tx = cellX(g.col);
        let ty = cellY(g.row);

        if (g.x == tx && g.y == ty) {
            let validDirs = [];
            for (let d = 0; d < allDirs.length; d++) {
                let isReverse = allDirs[d].x == -g.dir.x && allDirs[d].y == -g.dir.y;
                if (!isReverse && isPath(g.col + allDirs[d].x, g.row + allDirs[d].y)) {
                    validDirs.push(allDirs[d]);
                }
            }

            if (validDirs.length == 0) {
                validDirs.push({ x: -g.dir.x, y: -g.dir.y });
            }

            // 1. 性格に合わせて「目指す場所」を決める
            // 1. 性格に合わせて「目指す場所」を決める
            let targetCol, targetRow;
                if (powerTimer > 0) {
                    // 【追加：逃走モード】パックマンから一番遠いカドを目指す
                    targetCol = map[0].length - pacman.col;
                    targetRow = map.length - pacman.row;
                } else {
                    // 【通常モード】いつものロジック
                    if (g.type === "red") {
                        targetCol = pacman.col;
                        targetRow = pacman.row;
                    } else if (g.type === "pink") {
                        targetCol = pacman.col + pacman.dir.x * 4;
                        targetRow = pacman.row + pacman.dir.y * 4;
                    } else if (g.type === "orange") {
                        let d = dist(g.col, g.row, pacman.col, pacman.row);
                        if (d > 8) {
                            targetCol = pacman.col; targetRow = pacman.row;
                        } else {
                            targetCol = 0; targetRow = 14; 
                        }
                    } else {
                        targetCol = pacman.col; targetRow = pacman.row;
                    }
                }

            // 2. 「目指す場所」に一番近づける方向(chosen)を、進める方向(validDirs)の中から選ぶ
            let chosen = validDirs[0];
            let minDist = Infinity;

            // 80%の確率で賢く動き、20%はランダム（遊びを持たせる）
            if (random(1) < 0.8) {
                for (let d = 0; d < validDirs.length; d++) {
                    let testCol = g.col + validDirs[d].x;
                    let testRow = g.row + validDirs[d].y;
                    let d2t = dist(testCol, testRow, targetCol, targetRow);
                    if (d2t < minDist) {
                        minDist = d2t;
                        chosen = validDirs[d];
                    }
                }
            } else {
                chosen = validDirs[floor(random(validDirs.length))];
            }

            // 3. 決定した方向で移動
            g.dir = chosen;
            let gc = g.col + chosen.x;
            let gr = g.row + chosen.y;
            let wc = wrapCol(gc);
            let wr = wrapRow(gr);

            if (wc != gc || wr != gr) {
                g.x = cellX(wc) - chosen.x * CELL_SIZE;
                g.y = cellY(wr) - chosen.y * CELL_SIZE;
            }
            g.col = wc;
            g.row = wr;
        }

        // ピクセル移動処理
        tx = cellX(g.col);
        ty = cellY(g.row);
        if (g.x < tx) g.x = min(g.x + g.speed, tx);
        else if (g.x > tx) g.x = max(g.x - g.speed, tx);
        if (g.y < ty) g.y = min(g.y + g.speed, ty);
        else if (g.y > ty) g.y = max(g.y - g.speed, ty);
    }
}

    // スコアを表示する
    function drawScore() {
        noStroke();
        fill("white");
        textAlign(LEFT);
        textSize(16);
        text("SCORE: " + score, 10, 25);
    }

    // マスの列番号 → X座標（マス中心）
    function cellX(col) {
        return col * CELL_SIZE + CELL_SIZE / 2;
    }

    // マスの行番号 → Y座標（マス中心）
    function cellY(row) {
        return row * CELL_SIZE + CELL_SIZE / 2;
    }

    // 指定のマスが通路かどうかを返す（端は反対側へワープして判定）
    // 指定のマスが通路（またはパワーエサ）かどうかを返す
    function isPath(col, row) {
        let c = wrapCol(col);
        let r = wrapRow(row);
        // map[r][c] が 0（道） または 2（パワーエサ） なら true を返す
        return map[r][c] == 0 || map[r][c] == 2;
    }

    // 列番号を端でワープさせる
    function wrapCol(col) {
        return ((col % map[0].length) + map[0].length) % map[0].length;
    }

    // 行番号を端でワープさせる
    function wrapRow(row) {
        return ((row % map.length) + map.length) % map.length;
    }

    // ============================================================
    // 図形を描く関数
    // ============================================================

    function pacman_shape(x, y, radius, mouthAngle, dir) {
        push();
        translate(x, y);
        rotate(atan2(dir.y, dir.x));
        noStroke();
        fill("yellow");
        arc(0, 0, radius * 2, radius * 2, mouthAngle, 360 - mouthAngle, PIE);
        pop();
    }

    function ghost_shape(x, y, radius, clr, dir) {
        push();
        translate(x, y);
        noStroke();
        // 体の描画
        fill(clr);
        arc(0, 0, radius * 2, radius * 2, 180, 360);
        rect(-radius, 0, radius * 2, radius);
        // 目の白い部分（固定）
        fill("white");
        ellipse(-radius * 0.35, -radius * 0.1, radius * 0.5, radius * 0.65);
        ellipse(radius * 0.35, -radius * 0.1, radius * 0.5, radius * 0.65);
        // --- 黒目の位置計算 ---
        // dir.x や dir.y が 1 ならプラス方向、-1 ならマイナス方向に黒目をずらす
        let eyeOffsetX = dir.x * radius * 0.15;
        let eyeOffsetY = dir.y * radius * 0.15;
        
        fill("black");
        // 左の黒目
        ellipse(-radius * 0.35 + eyeOffsetX, -radius * 0.1 + eyeOffsetY, radius * 0.25, radius * 0.35);
        // 右の黒目
        ellipse(radius * 0.35 + eyeOffsetX, -radius * 0.1 + eyeOffsetY, radius * 0.25, radius * 0.35);
        
        pop();
    }