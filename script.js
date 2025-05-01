// Biến để lưu URL API, mặc định là ngrok hoặc IP cục bộ
let apiUrl = localStorage.getItem("apiUrl") || "https://0467-2405-4802-dc1b-9f50-e8b7-ea7c-6e16-8e79.ngrok-free.app/data"; // Thay bằng URL ngrok mới
const espIP = "192.168.1.212"; // IP cục bộ của ESP8266

// Hàm để thay đổi URL API
function setApiUrl(newUrl) {
    apiUrl = newUrl;
    localStorage.setItem("apiUrl", newUrl);
    document.getElementById("connection-status").innerHTML = '<i class="fas fa-wifi"></i> Đã kết nối';
    document.getElementById("connection-status").style.color = "green";
    fetchData(); // Gọi lại dữ liệu ngay khi thay đổi URL
}

// Thêm giao diện để người dùng nhập URL (tùy chọn)
window.addEventListener("DOMContentLoaded", () => {
    const urlInput = document.createElement("input");
    urlInput.type = "text";
    urlInput.placeholder = "Nhập URL API (e.g., https://new-url.ngrok-free.app/data)";
    urlInput.style.margin = "10px";
    urlInput.style.padding = "5px";
    urlInput.style.width = "300px";
    urlInput.value = apiUrl;

    const setUrlButton = document.createElement("button");
    setUrlButton.className = "btn btn-primary";
    setUrlButton.innerHTML = '<i class="fas fa-link"></i> Cập nhật URL';
    setUrlButton.onclick = () => {
        const newUrl = urlInput.value.trim();
        if (newUrl) {
            setApiUrl(newUrl);
        } else {
            alert("Vui lòng nhập URL hợp lệ!");
        }
    };

    const header = document.querySelector("header");
    header.appendChild(urlInput);
    header.appendChild(setUrlButton);
});

const timeLabels = Array(20).fill().map((_, i) => i);
const accelXData = Array(20).fill(0);
const accelYData = Array(20).fill(0);
const accelZData = Array(20).fill(0);
const ctx = document.createElement("canvas");
document.getElementById("accelChart").appendChild(ctx);

const chart = new Chart(ctx, {
    type: "line",
    data: {
        labels: timeLabels,
        datasets: [
            { label: "Gia tốc X", data: accelXData, borderColor: "#4361ee", tension: 0.3, fill: false },
            { label: "Gia tốc Y", data: accelYData, borderColor: "#4cc9f0", tension: 0.3, fill: false },
            { label: "Gia tốc Z", data: accelZData, borderColor: "#3f37c9", tension: 0.3, fill: false }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { beginAtZero: false, suggestedMin: -2, suggestedMax: 2 }
        },
        animation: { duration: 300 }
    }
});

function updateStatusIcon(activity) {
    const icon = document.querySelector(".status-icon i");
    let iconClass = "fa-walking";
    if (activity === "Nằm") iconClass = "fa-bed";
    else if (activity === "Ngồi") iconClass = "fa-chair";
    else if (activity === "Đứng yên") iconClass = "fa-person-standing";
    else if (activity === "Đi bộ") iconClass = "fa-walking";
    else if (activity === "Chạy bộ") iconClass = "fa-person-running";
    else if (activity === "Cầu Thang") iconClass = "fa-stairs";
    else if (activity === "Ngã") iconClass = "fa-person-falling";
    icon.className = `fas ${iconClass}`;
}

function addLogEntry(message) {
    const logContainer = document.getElementById("activityLogs");
    const logItem = document.createElement("div");
    logItem.className = "log-item";
    const messageSpan = document.createElement("span");
    messageSpan.textContent = message;
    const timeSpan = document.createElement("span");
    timeSpan.className = "log-time";
    const now = new Date();
    timeSpan.textContent = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    logItem.appendChild(messageSpan);
    logItem.appendChild(timeSpan);
    logContainer.insertBefore(logItem, logContainer.firstChild);
    if (logContainer.children.length > 20) logContainer.removeChild(logContainer.lastChild);
}

async function fetchData() {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        document.getElementById("currentActivity").textContent = data.activity;
        document.getElementById("accelX").textContent = data.accelX.toFixed(2);
        document.getElementById("accelY").textContent = data.accelY.toFixed(2);
        document.getElementById("accelZ").textContent = data.accelZ.toFixed(2);
        updateStatusIcon(data.activity);

        const statusDisplay = document.getElementById("activityStatus");
        const fallAlert = document.getElementById("fallAlert");
        if (data.fallDetected || data.activity === "Ngã") {
            statusDisplay.className = "status-display danger";
            fallAlert.style.display = "block";
            addLogEntry("CẢNH BÁO: Phát hiện ngã");
        } else if (data.activity === "Chạy bộ" || data.activity === "Cầu Thang") {
            statusDisplay.className = "status-display warning";
            fallAlert.style.display = "none";
            addLogEntry(data.activity);
        } else {
            statusDisplay.className = "status-display normal";
            fallAlert.style.display = "none";
            addLogEntry(data.activity);
        }

        accelXData.shift();
        accelYData.shift();
        accelZData.shift();
        accelXData.push(data.accelX);
        accelYData.push(data.accelY);
        accelZData.push(data.accelZ);
        chart.update();

        document.getElementById("connection-status").innerHTML = '<i class="fas fa-wifi"></i> Đã kết nối';
        document.getElementById("connection-status").style.color = "green";
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("connection-status").innerHTML = '<i class="fas fa-exclamation-triangle"></i> Mất kết nối';
        document.getElementById("connection-status").style.color = "red";
    }
}

function testAlert() {
    const fallAlert = document.getElementById("fallAlert");
    fallAlert.style.display = "block";
    document.getElementById("activityStatus").className = "status-display danger";
    document.getElementById("currentActivity").textContent = "Ngã";
    updateStatusIcon("Ngã");
    addLogEntry("KIỂM TRA: Mô phỏng ngã");
    setTimeout(() => {
        if (document.getElementById("currentActivity").textContent === "Ngã") {
            document.getElementById("activityStatus").className = "status-display normal";
            document.getElementById("currentActivity").textContent = "Đứng yên";
            updateStatusIcon("Đứng yên");
            fallAlert.style.display = "none";
            addLogEntry("Bình thường");
        }
    }, 5000);
}

function confirmCheck() {
    const fallAlert = document.getElementById("fallAlert");
    fallAlert.style.display = "none";
    document.getElementById("activityStatus").className = "status-display normal";
    document.getElementById("currentActivity").textContent = "Đứng yên";
    updateStatusIcon("Đứng yên");
    addLogEntry("Đã kiểm tra");
}

setInterval(fetchData, 3000);
document.addEventListener("DOMContentLoaded", fetchData);
