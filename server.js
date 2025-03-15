const express = require('express');
const loudness = require('loudness');
const path = require('path');

const { exec } = require("child_process");

const app = express();
const PORT = 3333;

// const { Server } = require('socket.io');
// const http = require('http');
// const server = http.createServer(app);
// const io = new Server(server, {});
// io.on("connection", (socket)=>{
// });
const Websocket = require('ws');
const io = new Websocket.Server({port:3000});
let connectedClients = []; 

// WebSocket 연결
io.on('connection', (socket) => {
    console.log('A client connected');
    connectedClients.push(socket); 

    socket.on('disconnect', () => {
        console.log('A client disconnected');
        connectedClients = connectedClients.filter(client => client !== socket); // 클라이언트 삭제
    });
});

const youtubeRouter = require('./youtube');
app.use("/youtube", youtubeRouter);

// 정적 파일 제공
// app.use(express.static(path.join(__dirname, 'public')));
app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// 1% 감소
app.get('/volume/down/1', async (req, res) => {
    let volume = await loudness.getVolume();
    let newVolume = Math.max(0, volume - 1);
    await loudness.setVolume(newVolume);
    res.send(`Volume decreased to ${newVolume}%`);
});

// 1% 증가
app.get('/volume/up/1', async (req, res) => {
    let volume = await loudness.getVolume();
    let newVolume = Math.min(100, volume + 1);
    await loudness.setVolume(newVolume);
    res.send(`Volume increased to ${newVolume}%`);
});

// 10% 감소
app.get('/volume/down/10', async (req, res) => {
    let volume = await loudness.getVolume();
    let newVolume = Math.max(0, volume - 10);
    await loudness.setVolume(newVolume);
    res.send(`Volume decreased to ${newVolume}%`);
});

// 10% 증가
app.get('/volume/up/10', async (req, res) => {
    let volume = await loudness.getVolume();
    let newVolume = Math.min(100, volume + 10);
    await loudness.setVolume(newVolume);
    res.send(`Volume increased to ${newVolume}%`);
});

// 현재 볼륨 가져오기
app.get('/volume', async (req, res) => {
    let volume = await loudness.getVolume();
    res.send(`${volume}%`);
});
let will_be_shutdown = false;
app.get('/shutdown/:id', async (req, res)=>{
    const seconds = req.params.id;
    if(will_be_shutdown){ // 두번 이상 실행
        exec('shutdown_a.bat', (err,stdout,stderr)=>{
            if (err) {
                console.error(`Error: ${err.message}`);
                return;
            }
            if (stderr) {
                console.error(`Stderr: ${stderr}`);
                return;
            }
            console.log(`Output: ${stdout}`);
        });
    }
    exec(`shutdown_s_t.bat ${seconds}`, (err,stdout,stderr)=>{
        if (err) {
            console.error(`Error: ${err.message}`);
            return;
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return;
        }
        console.log(`Output: ${stdout}`);
    });
    will_be_shutdown=true;
    startTimer(seconds);
    res.send(getTimeString(seconds));
});
app.get('/cancel',async(req,res)=>{
    exec('shutdown_a.bat', (err,stdout,stderr)=>{
        if (err) {
            console.error(`Error: ${err.message}`);
            return;
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return;
        }
        console.log(`Output: ${stdout}`);
    });
    will_be_shutdown=false;
    connectedClients.forEach(client => {
        client.send(""); // 모든 클라이언트에 메시지 전송
    });
    // io.send("message", "");
    clearInterval(countdownInterval);
    res.send(`shutdown canceled`);
});


let countdownInterval; // 타이머를 저장할 변수
function startTimer(s){
    let remainingSeconds = s;

    clearInterval(countdownInterval);
    countdownInterval = setInterval(()=>{
        connectedClients.forEach(client => {
            client.send(getTimeString(remainingSeconds)); // 모든 클라이언트에 메시지 전송
        });
        // io.send("message", getTimeString(remainingSeconds));
        
        remainingSeconds--;

        // 종료(타이머 끝)
        if (remainingSeconds < 0) {
            clearInterval(countdownInterval);
            connectedClients.forEach(client => {
                client.send("shutdown!"); // 모든 클라이언트에 메시지 전송
            });
            // io.send("message", "shutdown!");
        }
    }, 1000);

}


// 시간초 -> 00:00:00 변환
function getTimeString(total_seconds){
    let hours = Math.floor(total_seconds / 3600);
    let minutes = Math.floor((total_seconds % 3600) / 60);
    let seconds = total_seconds % 60;
    return `남은 시간: ${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
