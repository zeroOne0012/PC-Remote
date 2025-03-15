const express = require('express');
const router = express.Router();

const puppeteer = require('puppeteer');
const { exec } = require("child_process"); // 검색만 puppeteer로, 실행은 exec

let browser = null; // puppetear - 영상 찾기
let runed=false;

let chromePids = [];

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"; // Windows용 Chrome 경로

function getPids() {
    return new Promise((resolve, reject) => {
        exec(`tasklist | findstr chrome.exe`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error getting process: ${error}`);
                return;
            }
            let pids=[];
            const lines = stdout.split("\n")
            for(let line of lines){
                const divideds = line.split(" ");
                let pid;
                for(let d of divideds){
                    if (d!=""&&!isNaN(Number(d))){
                        pid=d;
                        break;
                    }
                }
                if (pid) pids.push(pid);
            }
            // console.log("!!!!!!!", pids.length);
            resolve(pids);
        });
    });
}
function killChromePids(){
    for(let pid of chromePids){
        exec(`taskkill /PID ${pid} /F`, (error,stdout,stderr)=>{
            if (error) {
                console.error(`Error killing Chrome process: ${error}`);
                return;
            }
        });
    }
}

async function searchYouTube(term) {
    try{
        if(browser) browser.close();
        if(runed) {
            try{
                killChromePids();
            }catch(e){
                console.error(e);
            }
        }

        browser = await puppeteer.launch({ 
            headless: false, 
            defaultViewport: null,
            args: [
                '--start-maximized'
            ] // 브라우저 최대화
        });

        const page = await browser.newPage(); // 신규 탭(페이지) 생성

        // 유튜브 열기
        await page.goto(`https://www.youtube.com/results?search_query=${term}`);

        // 검색 결과가 로드될 때까지 대기
        await page.waitForSelector('#contents'); 

        // 영상 목록 가져오기
        const videos = await page.$$eval('ytd-video-renderer ytd-thumbnail a', (links) => {
            return links.map(link => link.href); // 영상 링크만 가져옴
        });

        if (videos.length === 0) {
            console.log('No videos found');
            return;
        }
        // 임의로 하나의 영상 선택
        const randomVideoUrl = videos[Math.floor(Math.random() * videos.length)];
        console.log(`Selecting video: ${randomVideoUrl}`);

        browser.close();
        browser=null;
        const pidsBefore = await getPids();
        await execPromise(randomVideoUrl);
        const pidsAfter = await getPids();
        chromePids = pidsAfter.filter(item => !pidsBefore.includes(item));
        // console.log("debug1", pidsBefore.length);
        // console.log("debug2", pidsAfter.length);
        // console.log("debug3", chromePids.length);

        runed=true;
    } catch(e){
        console.error("youtube_api_error: ", e);
        browser = null;
        runed=false;
        chromePids = [];
    }
}

function execPromise(randomVideoUrl) {
    return new Promise((resolve, reject) => {
        exec(`start chrome "${randomVideoUrl}"`, (err, stdout, stderr) => {
            if (err) {
                console.error(`exec error: ${err}`);
                reject(err);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            resolve(stdout); // 실행 완료 후 resolve 호출
        }); // 크롬 새로 실행
    });
}

router.get("/search", async(req, res)=>{
    const term = req.query.term;
    console.log("검색어: ", term);
    searchYouTube(term);
    res.send("success");
});

module.exports = router;

