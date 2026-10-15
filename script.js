
const questionScreen = document.getElementById("question-screen");
const loveScreen = document.getElementById("love-screen");
const yesBtn = document.getElementById("yes-btn");
const noBtn = document.getElementById("no-btn");
const heart = document.getElementById("heart");

const WORD_COUNT = 48;
const GLIDE_DURATION = 1000; // ms to glide from centre to the top of the heart
const DRAW_DURATION = 5500; // ms to draw the full heart
const FLOW_SPEED = 0.3;     // how fast words flow afterwards (radians per second)

let scale = 1;
const words = []; // each item : { el: the element, t: its position on the heart }

// Takes t (0 to 2π) and returns a point on a heart outline
function heartPoint(t) {
    const x = 16 * Math.sin(t) ** 3;
    const y = 13 * Math.cos(t)
        - 5 * Math.cos(2 * t)
        - 2 * Math.cos(3 * t)
        - Math.cos(4 * t);

    return { x: x, y: -y }; // flip y, because on screens y grows downwards
}

// Moves an elemnt to position t on the heart
function placeWord(el, t) {
    const point = heartPoint(t);
    el.style.left = `${point.x * scale}px`;
    el.style.top = `${point.y * scale}px`;
}

function createWord() {
    const el = document.createElement("span");
    el.className = "love-word fade-in";
    el.textContent = "I love you";
    heart.appendChild(el);
    return el;
}

function startAnimation() {
    scale = Math.min(window.innerWidth, window.innerHeight) / 40;

    const leader = heart.querySelector(".love-word"); // the centered word from the HTML
    const startPoint = heartPoint(0);                   // the dip at the top of the heart
    const fullTurn = 2 * Math.PI;

    let phase = "glide";
    let phaseStart = performance.now();
    let lastTime = phaseStart;
    let nextSlot = 1; // slot 0 is where it will end

    function frame(now) {
        const elapsed = now - phaseStart;

        if ( phase === "glide") {
            const progress = Math.min(elapsed / GLIDE_DURATION, 1); // 0 -> 1
            leader.style.left = `${startPoint.x * scale * progress}px`;
            leader.style.top = `${startPoint.y * scale * progress}px`;

            if (progress === 1) {
                phase = "draw";
                phaseStart = now;
            }
        }
        else if (phase === "draw") {
            const progress = Math.min(elapsed / DRAW_DURATION, 1); // 0 -> 1
            const t = progress * fullTurn;
            placeWord(leader, t);

            // Drop a copy at every slot the leader has passed
            while(nextSlot < WORD_COUNT && t >= (nextSlot / WORD_COUNT) * fullTurn) {
                const slotT = (nextSlot / WORD_COUNT) * fullTurn;
                const el = createWord();
                placeWord(el, slotT);
                words.push({ el: el, t: slotT});
                nextSlot++;
            }
            
            if (progress === 1) {
                words.push({ el: leader, t: 0}); // the leader takes the last empty slot
                phase = "flow";
                heart.classList.add("beating"); // start the heartbeat
            }
        }
        else if (phase === "flow") {
            const deltaSeconds = (now - lastTime) / 1000;
            for (const word of words) {
                word.t = (word.t + FLOW_SPEED * deltaSeconds) % fullTurn;
                placeWord(word.el, word.t);
            }
        }

        lastTime = now;
        requestAnimationFrame(frame); // ask for the next frame
    }

    requestAnimationFrame(frame);
}

yesBtn.addEventListener("click", () => {
    questionScreen.classList.add("hidden");
    loveScreen.classList.remove("hidden");
    startAnimation();
});

let noIsRunning = false;
let dodgeCount = 0;
const MAX_DODGES = 10;

function overlaps(a, b) {
    return a.left < b.right && a.right > b.left &&
            a.top < b.bottom && a.bottom > b.top;
}

function moveNoButton() {
    const padding = 20;


    if(noBtn.style.position !== "fixed") {
        const start = noBtn.getBoundingClientRect();
        noBtn.style.position = "fixed";
        noBtn.style.left = `${start.left}px`;
        noBtn.style.top = `${start.top}px`;
        noBtn.offsetWidth;
    }

    const noRect = noBtn.getBoundingClientRect();
    const yesRect = yesBtn.getBoundingClientRect();

    const forbidden = {
        left: yesRect.left - padding,
        right: yesRect.right + padding,
        top: yesRect.top - padding,
        bottom: yesRect.bottom + padding,
    };

    const maxX = window.innerWidth - noRect.width - padding;
    const maxY = window.innerHeight - noRect.height - padding;

    let x, y;
    let tries = 0;
    do {
        x = padding + Math.random() * (maxX - padding);
        y = padding + Math.random() * (maxY - padding);
        tries++;
    } while (
        overlaps(
            { left: x, right: x + noRect.width, top: y, bottom: y + noRect.height },
            forbidden
        ) && tries < 100
    );

    noBtn.style.left = `${x}px`;
    noBtn.style.top = `${y}px`;
}

function explodeNoButton() {
    noBtn.classList.add("exploding");
    noBtn.addEventListener("animationend", () => {
        noBtn.classList.add("hidden");
    }, { once: true });
}

noBtn.addEventListener("click", () => {
    if (!noIsRunning) {
        noIsRunning = true;
        moveNoButton();
    } else {
        explodeNoButton();
    }
});

noBtn.addEventListener("mouseenter", () => {
    if (noIsRunning && dodgeCount < MAX_DODGES) {
        dodgeCount++;
        moveNoButton();
    }
});

noBtn.addEventListener("touchstart", (event) => {
    if (noIsRunning && dodgeCount < MAX_DODGES) {
        event.preventDefault();
        dodgeCount++;
        moveNoButton();
    }
}, { passive: false});


const floatingHearts = document.getElementById("floating-hearts");

function spawnFloatinHeart() {
    const heartEl = document.createElement("span");
    heartEl.className = "floating-heart";
    heartEl.textContent = "♥";

    heartEl.style.setProperty("--x", `${Math.random() * 100}vw`);
    heartEl.style.setProperty("--size", `${0.8 + Math.random() * 1.5}rem`);
    heartEl.style.setProperty("--duration", `${6 + Math.random() * 6}s`);
    heartEl.style.setProperty("--drift", `${(Math.random() - 0.5) * 100}px`);

    floatingHearts.appendChild(heartEl);

    heartEl.addEventListener("animationend", () => heartEl.remove());
}

setInterval(spawnFloatinHeart, 600);
