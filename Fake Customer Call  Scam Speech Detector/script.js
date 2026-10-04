"use strict";

/* ================================
   HELPER
================================ */

function get(id) {
    return document.getElementById(id);
}

/* ================================
   LOADER
================================ */

window.addEventListener("load", function () {
    const loader = get("loader");

    if (loader) {
        setTimeout(function () {
            loader.classList.add("hide");
        }, 800);
    }

    createCharts();
});

/* ================================
   TOAST
================================ */

function showToast(message) {
    const toast = get("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(function () {
        toast.classList.remove("show");
    }, 2500);
}

/* ================================
   MOBILE MENU
================================ */

const menuBtn = get("menuBtn");
const sidebar = get("sidebar");

if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", function () {
        sidebar.classList.toggle("open");
    });
}

/* ================================
   NAVIGATION
================================ */

document.querySelectorAll(".nav-link").forEach(function (link) {

    link.addEventListener("click", function () {

        document.querySelectorAll(".nav-link").forEach(function (item) {
            item.classList.remove("active");
        });

        link.classList.add("active");

        if (sidebar) {
            sidebar.classList.remove("open");
        }
    });

});

/* ================================
   THEME
================================ */

const themeBtn = get("themeBtn");

if (themeBtn) {

    themeBtn.addEventListener("click", function () {

        document.body.classList.toggle("light");

        const icon = themeBtn.querySelector("i");

        if (document.body.classList.contains("light")) {

            if (icon) {
                icon.className = "fa-solid fa-sun";
            }

            showToast("Light mode enabled");

        } else {

            if (icon) {
                icon.className = "fa-solid fa-moon";
            }

            showToast("Dark mode enabled");
        }

    });

}

/* ================================
   SETTINGS
================================ */

const settingsBtn = get("settingsBtn");

if (settingsBtn) {

    settingsBtn.addEventListener("click", function () {
        showToast("Settings are ready");
    });

}

/* ================================
   HERO BUTTONS
================================ */

const startVoiceBtn = get("startVoiceBtn");

if (startVoiceBtn) {

    startVoiceBtn.addEventListener("click", function () {

        const voiceSection = get("voice");

        if (voiceSection) {
            voiceSection.scrollIntoView({
                behavior: "smooth"
            });
        }

        setTimeout(function () {
            startRecording();
        }, 500);

    });

}

const textBtn = get("textBtn");

if (textBtn) {

    textBtn.addEventListener("click", function () {

        const textSection = get("text");

        if (textSection) {
            textSection.scrollIntoView({
                behavior: "smooth"
            });
        }

        setTimeout(function () {

            const input = get("textInput");

            if (input) {
                input.focus();
            }

        }, 500);

    });

}

/* ================================
   AUDIO UPLOAD
================================ */

const uploadBtn = get("uploadBtn");
const audioUpload = get("audioUpload");

if (uploadBtn && audioUpload) {

    uploadBtn.addEventListener("click", function () {
        audioUpload.click();
    });

    audioUpload.addEventListener("change", function () {

        const file = this.files[0];

        if (!file) return;

        const audioPlayer = get("audioPlayer");

        if (audioPlayer) {

            audioPlayer.src =
                URL.createObjectURL(file);

            audioPlayer.hidden = false;
        }

        const status = get("recordStatus");

        if (status) {
            status.textContent =
                "Audio uploaded: " + file.name;
        }

        showToast("Audio uploaded successfully");

    });

}

/* ================================
   RECORDING
================================ */

let mediaRecorder = null;
let audioChunks = [];
let timerInterval = null;
let seconds = 0;

const recordBtn = get("recordBtn");
const stopBtn = get("stopBtn");

if (recordBtn) {
    recordBtn.addEventListener("click", startRecording);
}

if (stopBtn) {
    stopBtn.addEventListener("click", stopRecording);
}

async function startRecording() {

    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {
        showToast("Microphone is not supported");
        return;
    }

    try {

        const stream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });

        audioChunks = [];

        mediaRecorder =
            new MediaRecorder(stream);

        mediaRecorder.ondataavailable =
            function (event) {

                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }

            };

        mediaRecorder.onstop =
            function () {

                const blob =
                    new Blob(audioChunks, {
                        type: "audio/webm"
                    });

                const audioPlayer = get("audioPlayer");

                if (audioPlayer) {

                    audioPlayer.src =
                        URL.createObjectURL(blob);

                    audioPlayer.hidden = false;
                }

                stream.getTracks().forEach(
                    function (track) {
                        track.stop();
                    }
                );

                analyzeVoice();
            };

        mediaRecorder.start();

        seconds = 0;

        updateTimer();

        timerInterval =
            setInterval(updateTimer, 1000);

        if (recordBtn) {
            recordBtn.disabled = true;
        }

        if (stopBtn) {
            stopBtn.disabled = false;
        }

        const mic = get("micContainer");

        if (mic) {
            mic.classList.add("recording");
        }

        const waveform = get("waveform");

        if (waveform) {
            waveform.classList.add("active");
        }

        const status = get("recordStatus");

        if (status) {
            status.textContent =
                "Recording... Speak now";
        }

        startSpeechRecognition();

        showToast("Recording started");

    } catch (error) {

        console.error(error);

        showToast(
            "Microphone permission denied"
        );
    }
}

function stopRecording() {

    if (
        !mediaRecorder ||
        mediaRecorder.state === "inactive"
    ) {
        return;
    }

    mediaRecorder.stop();

    clearInterval(timerInterval);

    if (recordBtn) {
        recordBtn.disabled = false;
    }

    if (stopBtn) {
        stopBtn.disabled = true;
    }

    const mic = get("micContainer");

    if (mic) {
        mic.classList.remove("recording");
    }

    const waveform = get("waveform");

    if (waveform) {
        waveform.classList.remove("active");
    }

    const status = get("recordStatus");

    if (status) {
        status.textContent =
            "Recording completed";
    }

    stopSpeechRecognition();

    showToast("Recording stopped");
}

function updateTimer() {

    seconds++;

    const minutes =
        String(Math.floor(seconds / 60))
            .padStart(2, "0");

    const secs =
        String(seconds % 60)
            .padStart(2, "0");

    const timer = get("timer");

    if (timer) {
        timer.textContent =
            minutes + ":" + secs;
    }
}

/* ================================
   SPEECH RECOGNITION
================================ */

let recognition = null;
let recognizedText = "";

function startSpeechRecognition() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        return;
    }

    recognition =
        new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult =
        function (event) {

            let text = "";

            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {
                text +=
                    event.results[i][0].transcript +
                    " ";
            }

            recognizedText =
                text.trim();
        };

    recognition.onerror =
        function (event) {
            console.log(
                "Speech error:",
                event.error
            );
        };

    try {
        recognition.start();
    } catch (error) {
        console.log(error);
    }
}

function stopSpeechRecognition() {

    if (!recognition) {
        return;
    }

    try {
        recognition.stop();
    } catch (error) {
        console.log(error);
    }
}

/* ================================
   SCAM KEYWORDS
================================ */

const keywords = {

    otp: [
        "otp",
        "one time password",
        "verification code",
        "security code"
    ],

    pin: [
        "pin",
        "password",
        "cvv",
        "card number"
    ],

    money: [
        "money",
        "payment",
        "transfer",
        "send money",
        "pay",
        "fee",
        "deposit",
        "refund"
    ],

    urgency: [
        "urgent",
        "immediately",
        "right now",
        "quickly",
        "today",
        "within minutes"
    ],

    threat: [
        "blocked",
        "account blocked",
        "arrest",
        "police",
        "legal action",
        "court",
        "penalty",
        "fine"
    ],

    personal: [
        "aadhaar",
        "aadhar",
        "pan card",
        "date of birth",
        "address",
        "account number",
        "bank details"
    ],

    scam: [
        "winner",
        "prize",
        "lottery",
        "investment",
        "free gift",
        "job offer",
        "click link"
    ]

};

/* ================================
   COUNT WORDS
================================ */

function countMatches(text, list) {

    let count = 0;

    list.forEach(function (word) {

        if (text.includes(word)) {
            count++;
        }

    });

    return count;
}

/* ================================
   ANALYZE TEXT
================================ */

function analyzeConversation(text) {

    text = text.toLowerCase().trim();

    if (!text) {
        showToast("Please enter a conversation");
        return;
    }

    const otp =
        countMatches(text, keywords.otp);

    const pin =
        countMatches(text, keywords.pin);

    const money =
        countMatches(text, keywords.money);

    const urgency =
        countMatches(text, keywords.urgency);

    const threat =
        countMatches(text, keywords.threat);

    const personal =
        countMatches(text, keywords.personal);

    const scam =
        countMatches(text, keywords.scam);

    let score = 0;

    score += otp * 14;
    score += pin * 13;
    score += money * 10;
    score += urgency * 8;
    score += threat * 11;
    score += personal * 7;
    score += scam * 8;

    if (text.includes("send money")) {
        score += 12;
    }

    if (text.includes("account will be blocked")) {
        score += 15;
    }

    score = Math.min(score, 99);

    const totalKeywords =
        otp +
        pin +
        money +
        urgency +
        threat +
        personal +
        scam;

    updateResult(
        score,
        totalKeywords,
        money,
        personal,
        otp + pin,
        urgency,
        threat
    );
}

/* ================================
   UPDATE RESULT
================================ */

function updateResult(
    score,
    keywordCount,
    money,
    personal,
    otp,
    urgency,
    threat
) {

    const riskScore = get("riskScore");

    if (riskScore) {
        riskScore.textContent =
            score + "%";
    }

    const progress =
        get("riskProgress");

    if (progress) {

        const circumference = 314;

        const offset =
            circumference -
            (score / 100) * circumference;

        progress.style.strokeDashoffset =
            offset;
    }

    setText("keywordScore", keywordCount);
    setText("moneyScore", money);
    setText("personalScore", personal);
    setText("otpScore", otp);
    setText("urgencyScore", urgency);
    setText("threatScore", threat);

    let status = "";
    let category = "";
    let explanation = "";
    let recommendation = "";

    if (score >= 70) {

        status =
            "HIGH RISK - SCAM DETECTED";

        category =
            "Strong suspicious conversation patterns detected.";

        explanation =
            "Multiple scam indicators were detected, including financial requests, sensitive information requests, urgency or threatening language.";

        recommendation =
            "Do not share OTP, PIN, password or money. End the call and contact the official company.";

    } else if (score >= 40) {

        status =
            "MEDIUM RISK - BE CAREFUL";

        category =
            "Some suspicious patterns were detected.";

        explanation =
            "The conversation contains signals that may indicate manipulation or an attempted scam.";

        recommendation =
            "Verify the caller independently before sharing personal or financial information.";

    } else {

        status =
            "LOW RISK - LIKELY GENUINE";

        category =
            "No strong scam indicators detected.";

        explanation =
            "The conversation does not contain enough suspicious signals to classify it as a likely scam.";

        recommendation =
            "Still avoid sharing passwords, OTPs or sensitive banking information.";
    }

    setText("resultStatus", status);
    setText("resultCategory", category);
    setText("explanationText", explanation);
    setText("recommendationText", recommendation);

    addHistory(score, category);

    showToast("AI analysis completed");
}

function setText(id, value) {

    const element = get(id);

    if (element) {
        element.textContent = value;
    }
}

/* ================================
   TEXT BUTTONS
================================ */

const analyzeTextBtn = get("analyzeTextBtn");

if (analyzeTextBtn) {

    analyzeTextBtn.addEventListener(
        "click",
        function () {

            const input = get("textInput");

            if (input) {
                analyzeConversation(input.value);
            }

        }
    );
}

const demoBtn = get("demoBtn");

if (demoBtn) {

    demoBtn.addEventListener(
        "click",
        function () {

            const input = get("textInput");

            if (!input) return;

            input.value =
                "Hello sir, your bank account will be blocked immediately. " +
                "Please share your OTP and PIN to verify your account. " +
                "You must send the verification fee right now.";

            showToast(
                "Demo scam conversation loaded"
            );
        }
    );
}

const clearBtn = get("clearBtn");

if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        function () {

            const input = get("textInput");

            if (input) {
                input.value = "";
            }

            showToast("Text cleared");
        }
    );
}

/* ================================
   VOICE ANALYSIS
================================ */

function analyzeVoice() {

    if (recognizedText.trim()) {

        const input = get("textInput");

        if (input) {
            input.value = recognizedText;
        }

        analyzeConversation(
            recognizedText
        );

    } else {

        const demoVoice =
            "Your account will be blocked immediately. " +
            "Please share your OTP to verify your bank account.";

        analyzeConversation(demoVoice);

        showToast(
            "Speech text unavailable. Demo analysis used."
        );
    }
}

/* ================================
   HISTORY
================================ */

let historyNumber = 4;

function addHistory(score, category) {

    const body = get("historyBody");

    if (!body) return;

    const row =
        document.createElement("tr");

    const scam =
        score >= 40;

    row.dataset.status =
        scam ? "scam" : "safe";

    row.innerHTML =
        "<td>#"
        + String(historyNumber).padStart(3, "0")
        + "</td>"
        + "<td>"
        + score
        + "%</td>"
        + "<td><span class=\"table-status "
        + (scam ? "scam" : "safe")
        + "\">"
        + (scam ? "SCAM" : "GENUINE")
        + "</span></td>"
        + "<td>"
        + (scam ? category : "Genuine Conversation")
        + "</td>"
        + "<td>"
        + new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        })
        + "</td>";

    body.prepend(row);

    historyNumber++;

    updateStats(scam);
}

function updateStats(isScam) {

    const total = get("totalCalls");

    if (total) {
        total.textContent =
            Number(total.textContent) + 1;
    }

    if (isScam) {

        const scams = get("scamCalls");

        if (scams) {
            scams.textContent =
                Number(scams.textContent) + 1;
        }

    } else {

        const genuine = get("genuineCalls");

        if (genuine) {
            genuine.textContent =
                Number(genuine.textContent) + 1;
        }
    }
}

/* ================================
   HISTORY SEARCH
================================ */

const historySearch =
    get("historySearch");

const historyFilter =
    get("historyFilter");

if (historySearch) {
    historySearch.addEventListener(
        "input",
        filterHistory
    );
}

if (historyFilter) {
    historyFilter.addEventListener(
        "change",
        filterHistory
    );
}

function filterHistory() {

    const search =
        historySearch
            ? historySearch.value.toLowerCase()
            : "";

    const filter =
        historyFilter
            ? historyFilter.value
            : "all";

    document
        .querySelectorAll("#historyBody tr")
        .forEach(function (row) {

            const text =
                row.textContent.toLowerCase();

            const status =
                row.dataset.status || "";

            const matchSearch =
                text.includes(search);

            const matchFilter =
                filter === "all" ||
                status === filter;

            row.style.display =
                matchSearch && matchFilter
                    ? ""
                    : "none";
        });
}

/* ================================
   CHARTS
================================ */

let scamChart = null;
let riskChart = null;

function createCharts() {

    if (typeof Chart === "undefined") {
        console.log(
            "Chart.js was not loaded."
        );
        return;
    }

    const scamCanvas =
        get("scamChart");

    const riskCanvas =
        get("riskChart");

    if (!scamCanvas || !riskCanvas) {
        return;
    }

    scamChart = new Chart(
        scamCanvas,
        {
            type: "doughnut",

            data: {
                labels: [
                    "Scam Calls",
                    "Genuine Calls"
                ],

                datasets: [{
                    data: [47, 81],

                    backgroundColor: [
                        "#ff3cac",
                        "#35e69a"
                    ],

                    borderWidth: 0
                }]
            },

            options: {
                responsive: true,

                plugins: {
                    legend: {
                        labels: {
                            color: "#aaa6c0"
                        }
                    }
                }
            }
        }
    );

    riskChart = new Chart(
        riskCanvas,
        {
            type: "bar",

            data: {
                labels: [
                    "0-20",
                    "21-40",
                    "41-60",
                    "61-80",
                    "81-100"
                ],

                datasets: [{
                    label: "Calls",

                    data: [
                        25,
                        31,
                        22,
                        28,
                        22
                    ],

                    backgroundColor: [
                        "#35e69a",
                        "#00e5ff",
                        "#ffc857",
                        "#ff784f",
                        "#ff3cac"
                    ],

                    borderRadius: 7
                }]
            },

            options: {
                responsive: true,

                scales: {

                    y: {
                        beginAtZero: true,

                        ticks: {
                            color: "#aaa6c0"
                        },

                        grid: {
                            color:
                                "rgba(255,255,255,0.05)"
                        }
                    },

                    x: {
                        ticks: {
                            color: "#aaa6c0"
                        },

                        grid: {
                            display: false
                        }
                    }
                },

                plugins: {
                    legend: {
                        labels: {
                            color: "#aaa6c0"
                        }
                    }
                }
            }
        }
    );
}